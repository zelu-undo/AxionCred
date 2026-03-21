-- ============================================
-- CORREÇÃO DAS POLÍTICAS RLS
-- O problema original: current_setting('app.current_tenant_id') nunca é configurado
-- Solução: Usar função que busca tenant_id do usuário logado
-- ============================================

-- 1. Primeiro, verificar qual usuário está autenticado via Supabase Auth
--    e buscar o tenant_id da tabela users

-- Criar função auxiliar para obter o tenant_id do usuário atual
CREATE OR REPLACE FUNCTION auth.tenant_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
DECLARE
  current_user_id uuid;
  tenant_uuid uuid;
BEGIN
  -- Obter o ID do usuário atual logado no Supabase
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Buscar o tenant_id na tabela users
  SELECT u.tenant_id INTO tenant_uuid
  FROM public.users u
  WHERE u.id = current_user_id;
  
  RETURN tenant_uuid;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$;

-- 2. Criar função para verificar se usuário tem acesso
CREATE OR REPLACE FUNCTION auth.user_has_access(table_tenant_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
DECLARE
  current_tenant uuid;
BEGIN
  current_tenant := auth.tenant_id();
  
  IF current_tenant IS NULL THEN
    RETURN false;
  END IF;
  
  RETURN table_tenant_id = current_tenant;
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$$;

-- 3. Recriar políticas RLS usando as novas funções

--drop policy if exists "users_tenant_isolation" on users;
CREATE POLICY "users_tenant_isolation" ON users
    FOR ALL USING (
        tenant_id = auth.tenant_id()
    );

--drop policy if exists "customers_tenant_isolation" on customers;
CREATE POLICY "customers_tenant_isolation" ON customers
    FOR ALL USING (
        tenant_id = auth.tenant_id()
    );

--drop policy if exists "loans_tenant_isolation" on loans;
CREATE POLICY "loans_tenant_isolation" ON loans
    FOR ALL USING (
        tenant_id = auth.tenant_id()
    );

--drop policy if exists "loan_interest_rules_tenant_isolation" on loan_interest_rules;
CREATE POLICY "loan_interest_rules_tenant_isolation" ON loan_interest_rules
    FOR ALL USING (
        tenant_id = auth.tenant_id()
    );

--drop policy if exists "loan_rule_snapshots_tenant_isolation" on loan_rule_snapshots;
CREATE POLICY "loan_rule_snapshots_tenant_isolation" ON loan_rule_snapshots
    FOR ALL USING (
        loan_id IN (
            SELECT id FROM loans WHERE tenant_id = auth.tenant_id()
        )
    );

-- 4. Adicionar políticas para outras tabelas que precisam de tenant_id

-- loan_installments - access via loans
CREATE POLICY "loan_installments_tenant_isolation" ON loan_installments
    FOR ALL USING (
        loan_id IN (
            SELECT id FROM loans WHERE tenant_id = auth.tenant_id()
        )
    );

-- payment_transactions
CREATE POLICY "payment_transactions_tenant_isolation" ON payment_transactions
    FOR ALL USING (
        tenant_id = auth.tenant_id()
    );

-- audit_logs
CREATE POLICY "audit_logs_tenant_isolation" ON audit_logs
    FOR ALL USING (
        tenant_id = auth.tenant_id()
    );

-- notifications
CREATE POLICY "notifications_tenant_isolation" ON notifications
    FOR ALL USING (
        tenant_id = auth.tenant_id()
    );

-- interest_rules
CREATE POLICY "interest_rules_tenant_isolation" ON interest_rules
    FOR ALL USING (
        tenant_id = auth.tenant_id()
    );

-- late_fee_config
CREATE POLICY "late_fee_config_tenant_isolation" ON late_fee_config
    FOR ALL USING (
        tenant_id = auth.tenant_id()
    );

-- loan_config
CREATE POLICY "loan_config_tenant_isolation" ON loan_config
    FOR ALL USING (
        tenant_id = auth.tenant_id()
    );

-- roles
CREATE POLICY "roles_tenant_isolation" ON roles
    FOR ALL USING (
        tenant_id = auth.tenant_id()
    );

-- user_roles
CREATE POLICY "user_roles_tenant_isolation" ON user_roles
    FOR ALL USING (
        user_id IN (
            SELECT id FROM users WHERE tenant_id = auth.tenant_id()
        )
    );

-- permission_templates
CREATE POLICY "permission_templates_tenant_isolation" ON permission_templates
    FOR ALL USING (
        tenant_id = auth.tenant_id()
    );

-- message_templates
CREATE POLICY "message_templates_tenant_isolation" ON message_templates
    FOR ALL USING (
        tenant_id = auth.tenant_id()
    );

-- user_notification_settings
CREATE POLICY "user_notification_settings_tenant_isolation" ON user_notification_settings
    FOR ALL USING (
        user_id IN (
            SELECT id FROM users WHERE tenant_id = auth.tenant_id()
        )
    );

-- tenant_features
CREATE POLICY "tenant_features_tenant_isolation" ON tenant_features
    FOR ALL USING (
        tenant_id = auth.tenant_id()
    );

-- tenant_settings
CREATE POLICY "tenant_settings_tenant_isolation" ON tenant_settings
    FOR ALL USING (
        tenant_id = auth.tenant_id()
    );

-- customer_events (se existir)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customer_events') THEN
        EXECUTE 'CREATE POLICY IF NOT EXISTS "customer_events_tenant_isolation" ON customer_events
            FOR ALL USING (
                customer_id IN (
                    SELECT id FROM customers WHERE tenant_id = auth.tenant_id()
                )
            )';
    END IF;
END $$;

-- customer_documents (se existir)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customer_documents') THEN
        EXECUTE 'CREATE POLICY IF NOT EXISTS "customer_documents_tenant_isolation" ON customer_documents
            FOR ALL USING (
                customer_id IN (
                    SELECT id FROM customers WHERE tenant_id = auth.tenant_id()
                )
            )';
    END IF;
END $$;

-- global_identities - não precisa de tenant (dados globais)
-- loan_simulations - via loans
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'loan_simulations') THEN
        EXECUTE 'CREATE POLICY IF NOT EXISTS "loan_simulations_tenant_isolation" ON loan_simulations
            FOR ALL USING (
                tenant_id = auth.tenant_id()
            )';
    END IF;
END $$;

-- Templates table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'templates') THEN
        EXECUTE 'CREATE POLICY IF NOT EXISTS "templates_tenant_isolation" ON templates
            FOR ALL USING (
                tenant_id = auth.tenant_id()
            )';
    END IF;
END $$;

-- Guarantors table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guarantors') THEN
        EXECUTE 'CREATE POLICY IF NOT EXISTS "guarantors_tenant_isolation" ON guarantors
            FOR ALL USING (
                tenant_id = auth.tenant_id()
            )';
    END IF;
END $$;

-- Renegotiations table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'renegotiations') THEN
        EXECUTE 'CREATE POLICY IF NOT EXISTS "renegotiations_tenant_isolation" ON renegotiations
            FOR ALL USING (
                tenant_id = auth.tenant_id()
            )';
    END IF;
END $$;

-- Credit score tables
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'global_credit_profiles') THEN
        EXECUTE 'CREATE POLICY IF NOT EXISTS "global_credit_profiles_select" ON global_credit_profiles
            FOR SELECT USING (true)';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'credit_score_history') THEN
        EXECUTE 'CREATE POLICY IF NOT EXISTS "credit_score_history_select" ON credit_score_history
            FOR SELECT USING (true)';
    END IF;
END $$;

-- Garantir que a função auth.tenant_id() possa ser chamada por usuários autenticados
GRANT EXECUTE ON FUNCTION auth.tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION auth.tenant_id() TO anon;
GRANT EXECUTE ON FUNCTION auth.tenant_id() TO service_role;

GRANT EXECUTE ON FUNCTION auth.user_has_access(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION auth.user_has_access(uuid) TO anon;
GRANT EXECUTE ON FUNCTION auth.user_has_access(uuid) TO service_role;

-- Permissões nas tabelas
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

SELECT 'RLS policies corrigidas com sucesso!' AS status;
