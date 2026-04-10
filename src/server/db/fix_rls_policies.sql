-- ============================================
-- CORREÇÃO DAS POLÍTICAS RLS
-- O problema original: current_setting('app.current_tenant_id') nunca é configurado
-- Solução: Usar função que busca tenant_id do usuário logado (via auth.uid())
-- ============================================

-- 1. Criar função auxiliar para obter o tenant_id do usuário atual
--    Vamos criar no schema public para evitar problemas de permissão
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
  tenant_uuid uuid;
BEGIN
  -- Obter o ID do usuário atual logado no Supabase
  current_user_id := (SELECT auth.uid());
  
  IF current_user_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Buscar o tenant_id na tabela users
  SELECT u.tenant_id INTO tenant_uuid
  FROM users u
  WHERE u.id = current_user_id;
  
  RETURN tenant_uuid;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$;

-- Conceder permissão para usar a função
GRANT EXECUTE ON FUNCTION public.get_current_tenant_id() TO authenticated, anon, service_role;

-- 2. Recriar políticas RLS usando a nova função

-- Drop políticas existentes (se houver)
DROP POLICY IF EXISTS "users_tenant_isolation" ON users;
DROP POLICY IF EXISTS "customers_tenant_isolation" ON customers;
DROP POLICY IF EXISTS "loans_tenant_isolation" ON loans;
DROP POLICY IF EXISTS "loan_interest_rules_tenant_isolation" ON loan_interest_rules;
DROP POLICY IF EXISTS "loan_rule_snapshots_tenant_isolation" ON loan_rule_snapshots;

-- Criar novas políticas
CREATE POLICY "users_tenant_isolation" ON users
    FOR ALL USING (
        tenant_id = public.get_current_tenant_id()
    );

CREATE POLICY "customers_tenant_isolation" ON customers
    FOR ALL USING (
        tenant_id = public.get_current_tenant_id()
    );

CREATE POLICY "loans_tenant_isolation" ON loans
    FOR ALL USING (
        tenant_id = public.get_current_tenant_id()
    );

CREATE POLICY "loan_interest_rules_tenant_isolation" ON loan_interest_rules
    FOR ALL USING (
        tenant_id = public.get_current_tenant_id()
    );

CREATE POLICY "loan_rule_snapshots_tenant_isolation" ON loan_rule_snapshots
    FOR ALL USING (
        loan_id IN (
            SELECT id FROM loans WHERE tenant_id = public.get_current_tenant_id()
        )
    );

-- 4. Adicionar políticas para outras tabelas que precisam de tenant_id

-- loan_installments - access via tenant_id with WITH CHECK for insert
DROP POLICY IF EXISTS "loan_installments_tenant_isolation" ON loan_installments;
CREATE POLICY "loan_installments_tenant_isolation" ON loan_installments
    FOR ALL
    USING (tenant_id = public.get_current_tenant_id())
    WITH CHECK (tenant_id = public.get_current_tenant_id());

-- payment_transactions
DROP POLICY IF EXISTS "payment_transactions_tenant_isolation" ON payment_transactions;
CREATE POLICY "payment_transactions_tenant_isolation" ON payment_transactions
    FOR ALL USING (
        tenant_id = public.get_current_tenant_id()
    );

-- audit_logs
DROP POLICY IF EXISTS "audit_logs_tenant_isolation" ON audit_logs;
CREATE POLICY "audit_logs_tenant_isolation" ON audit_logs
    FOR ALL USING (
        tenant_id = public.get_current_tenant_id()
    );

-- notifications
DROP POLICY IF EXISTS "notifications_tenant_isolation" ON notifications;
CREATE POLICY "notifications_tenant_isolation" ON notifications
    FOR ALL USING (
        tenant_id = public.get_current_tenant_id()
    );

-- interest_rules
DROP POLICY IF EXISTS "interest_rules_tenant_isolation" ON interest_rules;
CREATE POLICY "interest_rules_tenant_isolation" ON interest_rules
    FOR ALL USING (
        tenant_id = public.get_current_tenant_id()
    );

-- late_fee_config
DROP POLICY IF EXISTS "late_fee_config_tenant_isolation" ON late_fee_config;
CREATE POLICY "late_fee_config_tenant_isolation" ON late_fee_config
    FOR ALL USING (
        tenant_id = public.get_current_tenant_id()
    );

-- loan_config
DROP POLICY IF EXISTS "loan_config_tenant_isolation" ON loan_config;
CREATE POLICY "loan_config_tenant_isolation" ON loan_config
    FOR ALL USING (
        tenant_id = public.get_current_tenant_id()
    );

-- roles
DROP POLICY IF EXISTS "roles_tenant_isolation" ON roles;
CREATE POLICY "roles_tenant_isolation" ON roles
    FOR ALL USING (
        tenant_id = public.get_current_tenant_id()
    );

-- user_roles
DROP POLICY IF EXISTS "user_roles_tenant_isolation" ON user_roles;
CREATE POLICY "user_roles_tenant_isolation" ON user_roles
    FOR ALL USING (
        user_id IN (
            SELECT id FROM users WHERE tenant_id = public.get_current_tenant_id()
        )
    );

-- permission_templates
DROP POLICY IF EXISTS "permission_templates_tenant_isolation" ON permission_templates;
CREATE POLICY "permission_templates_tenant_isolation" ON permission_templates
    FOR ALL USING (
        tenant_id = public.get_current_tenant_id()
    );

-- message_templates
DROP POLICY IF EXISTS "message_templates_tenant_isolation" ON message_templates;
CREATE POLICY "message_templates_tenant_isolation" ON message_templates
    FOR ALL USING (
        tenant_id = public.get_current_tenant_id()
    );

-- user_notification_settings
DROP POLICY IF EXISTS "user_notification_settings_tenant_isolation" ON user_notification_settings;
CREATE POLICY "user_notification_settings_tenant_isolation" ON user_notification_settings
    FOR ALL USING (
        user_id IN (
            SELECT id FROM users WHERE tenant_id = public.get_current_tenant_id()
        )
    );

-- tenant_features
DROP POLICY IF EXISTS "tenant_features_tenant_isolation" ON tenant_features;
CREATE POLICY "tenant_features_tenant_isolation" ON tenant_features
    FOR ALL USING (
        tenant_id = public.get_current_tenant_id()
    );

-- tenant_settings
DROP POLICY IF EXISTS "tenant_settings_tenant_isolation" ON tenant_settings;
CREATE POLICY "tenant_settings_tenant_isolation" ON tenant_settings
    FOR ALL USING (
        tenant_id = public.get_current_tenant_id()
    );

-- customer_events (se existir)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customer_events') THEN
        EXECUTE 'DROP POLICY IF EXISTS "customer_events_tenant_isolation" ON customer_events';
        EXECUTE 'CREATE POLICY "customer_events_tenant_isolation" ON customer_events
            FOR ALL USING (
                customer_id IN (
                    SELECT id FROM customers WHERE tenant_id = public.get_current_tenant_id()
                )
            )';
    END IF;
END $$;

-- customer_documents (se existir)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customer_documents') THEN
        EXECUTE 'DROP POLICY IF EXISTS "customer_documents_tenant_isolation" ON customer_documents';
        EXECUTE 'CREATE POLICY "customer_documents_tenant_isolation" ON customer_documents
            FOR ALL USING (
                customer_id IN (
                    SELECT id FROM customers WHERE tenant_id = public.get_current_tenant_id()
                )
            )';
    END IF;
END $$;

-- global_identities - não precisa de tenant (dados globais)
-- loan_simulations - via loans
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'loan_simulations') THEN
        EXECUTE 'DROP POLICY IF EXISTS "loan_simulations_tenant_isolation" ON loan_simulations';
        EXECUTE 'CREATE POLICY "loan_simulations_tenant_isolation" ON loan_simulations
            FOR ALL USING (
                tenant_id = public.get_current_tenant_id()
            )';
    END IF;
END $$;

-- Templates table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'templates') THEN
        EXECUTE 'DROP POLICY IF EXISTS "templates_tenant_isolation" ON templates';
        EXECUTE 'CREATE POLICY "templates_tenant_isolation" ON templates
            FOR ALL USING (
                tenant_id = public.get_current_tenant_id()
            )';
    END IF;
END $$;

-- Guarantors table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guarantors') THEN
        EXECUTE 'DROP POLICY IF EXISTS "guarantors_tenant_isolation" ON guarantors';
        EXECUTE 'CREATE POLICY "guarantors_tenant_isolation" ON guarantors
            FOR ALL USING (
                tenant_id = public.get_current_tenant_id()
            )';
    END IF;
END $$;

-- Renegotiations table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'renegotiations') THEN
        EXECUTE 'DROP POLICY IF EXISTS "renegotiations_tenant_isolation" ON renegotiations';
        EXECUTE 'CREATE POLICY "renegotiations_tenant_isolation" ON renegotiations
            FOR ALL USING (
                tenant_id = public.get_current_tenant_id()
            )';
    END IF;
END $$;

-- Credit score tables
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'global_credit_profiles') THEN
        EXECUTE 'DROP POLICY IF EXISTS "global_credit_profiles_select" ON global_credit_profiles';
        EXECUTE 'CREATE POLICY "global_credit_profiles_select" ON global_credit_profiles
            FOR SELECT USING (true)';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'credit_score_history') THEN
        EXECUTE 'DROP POLICY IF EXISTS "credit_score_history_select" ON credit_score_history';
        EXECUTE 'CREATE POLICY "credit_score_history_select" ON credit_score_history
            FOR SELECT USING (true)';
    END IF;
END $$;

SELECT 'RLS policies corrigidas com sucesso!' AS status;
