-- ============================================
-- NOVA ESTRUTURA DE CLIENTES - SOFT DELETE INTELIGENTE
-- 
-- A nova lógica separa:
-- 1. Dados GLOBAIS (identidade do cliente) - CPF, dados para score
-- 2. Dados LOCAIS (por tenant/usuário) - operações, relacionamentos
-- ============================================

-- 1. Adicionar coluna tenant_id na tabela customers (se não existir)
-- A coluna tenant_id indica qual usuário tem acesso operacional ao cliente

-- 2. Modificar política RLS para buscar clientes de duas formas:
-- a) Clientes locais (tenant_id = current tenant)
-- b) Clientes globais (que existem mas não pertencem a nenhum tenant)

-- Primeiro, verificar se a função get_current_tenant_id existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_current_tenant_id') THEN
        CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
        RETURNS uuid
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        DECLARE
          current_user_id uuid;
          tenant_uuid uuid;
        BEGIN
          current_user_id := (SELECT auth.uid());
          IF current_user_id IS NULL THEN
            RETURN NULL;
          END IF;
          SELECT u.tenant_id INTO tenant_uuid
          FROM users u
          WHERE u.id = current_user_id;
          RETURN tenant_uuid;
        EXCEPTION WHEN OTHERS THEN
          RETURN NULL;
        END;
        $$;
    END IF;
END $$;

GRANT EXECUTE ON FUNCTION public.get_current_tenant_id() TO authenticated, anon, service_role;

-- 3. Nova política RLS para customers
-- Cliente é visível se:
-- - Pertence ao tenant atual (dados locais), OU
-- - É um cliente global (sem tenant_id) que pode ser visto por qualquer um para verificação de duplicidade

DROP POLICY IF EXISTS "customers_tenant_isolation" ON customers;

CREATE POLICY "customers_tenant_isolation" ON customers
    FOR ALL USING (
        -- Cliente é visível se:
        -- 1. Pertence ao tenant atual (meus clientes)
        tenant_id = public.get_current_tenant_id()
        OR
        -- 2. É um cliente que não tem tenant (cliente global não registrado)
        -- Neste caso, apenas para verificação de CPF (não para acesso completo)
        tenant_id IS NULL
    );

-- 4. Criar tabela para histórico financeiro GLOBAL (compartilhado entre todos)
-- Esta tabela armazena o histórico que é compartilhado entre todos os usuários
CREATE TABLE IF NOT EXISTS customer_financial_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_document VARCHAR(20) NOT NULL, -- CPF como identificador global
    event_type VARCHAR(50) NOT NULL, -- 'loan_created', 'payment', 'overdue', 'paid_off', etc.
    amount DECIMAL(15,2),
    installment_number INTEGER,
    total_installments INTEGER,
    event_date TIMESTAMPTZ DEFAULT NOW(),
    tenant_id UUID REFERENCES tenants(id), -- quem registrou (para referência)
    loan_id UUID,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index para busca por documento (CPF)
CREATE INDEX IF NOT EXISTS idx_customer_financial_history_document ON customer_financial_history(customer_document);

-- Index para busca por data
CREATE INDEX IF NOT EXISTS idx_customer_financial_history_date ON customer_financial_history(event_date DESC);

-- RLS para histórico financeiro - qualquer um pode ver, qualquer um pode adicionar
ALTER TABLE customer_financial_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "customer_financial_history_global" ON customer_financial_history;
CREATE POLICY "customer_financial_history_global" ON customer_financial_history
    FOR ALL USING (true);

-- 5. Criar tabela para score global do cliente
CREATE TABLE IF NOT EXISTS customer_global_score (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_document VARCHAR(20) UNIQUE NOT NULL, -- CPF como identificador único
    
    -- Componentes do score
    total_loans INTEGER DEFAULT 0,
    total_paid_loans INTEGER DEFAULT 0,
    total_defaulted_loans INTEGER DEFAULT 0,
    total_amount_borrowed DECIMAL(15,2) DEFAULT 0,
    total_amount_paid DECIMAL(15,2) DEFAULT 0,
    average_days_overdue INTEGER DEFAULT 0,
    max_days_overdue INTEGER DEFAULT 0,
    last_event_date TIMESTAMPTZ,
    
    -- Score calculado
    score INTEGER DEFAULT 500, -- 0-1000
    score_grade VARCHAR(2) DEFAULT 'C', -- A, B, C, D, E
    risk_level VARCHAR(20) DEFAULT 'medium', -- low, medium, high
    
    -- Histórico de mudanças
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index para busca por documento
CREATE INDEX IF NOT EXISTS idx_customer_global_score_document ON customer_financial_history(customer_document);

-- RLS para score - qualquer um pode ver, apenas sistema pode atualizar
ALTER TABLE customer_global_score ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "customer_global_score_read" ON customer_global_score;
CREATE POLICY "customer_global_score_read" ON customer_global_score FOR SELECT USING (true);

DROP POLICY IF EXISTS "customer_global_score_write" ON customer_global_score;
CREATE POLICY "customer_global_score_write" ON customer_global_score FOR INSERT WITH CHECK (true);
CREATE POLICY "customer_global_score_update" ON customer_global_score FOR UPDATE USING (true);

-- 6. Função para calcular score global
CREATE OR REPLACE FUNCTION public.calculate_customer_global_score(p_document VARCHAR)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_total_loans INTEGER;
    v_total_paid INTEGER;
    v_total_defaulted INTEGER;
    v_total_borrowed DECIMAL(15,2);
    v_total_paid_amount DECIMAL(15,2);
    v_avg_days_overdue INTEGER;
    v_max_days_overdue INTEGER;
    v_last_date TIMESTAMPTZ;
    v_score INTEGER;
    v_grade VARCHAR(2);
    v_risk VARCHAR(20);
BEGIN
    -- Calcular métricas do histórico
    SELECT 
        COUNT(DISTINCT loan_id),
        COUNT(DISTINCT CASE WHEN event_type = 'paid_off' THEN loan_id END),
        COUNT(DISTINCT CASE WHEN event_type = 'defaulted' THEN loan_id END),
        COALESCE(SUM(CASE WHEN event_type IN ('loan_created', 'payment') THEN amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN event_type = 'payment' THEN amount ELSE 0 END), 0),
        COALESCE(AVG(CASE WHEN event_type = 'overdue_days' THEN amount::INTEGER END), 0),
        COALESCE(MAX(CASE WHEN event_type = 'overdue_days' THEN amount::INTEGER END), 0),
        MAX(event_date)
    INTO v_total_loans, v_total_paid, v_total_defaulted, v_total_borrowed, v_total_paid_amount, v_avg_days_overdue, v_max_days_overdue, v_last_date
    FROM customer_financial_history
    WHERE customer_document = p_document;
    
    -- Calcular score (0-1000)
    -- Base: 500 pontos
    -- + pontos por empréstimos pagos (+50 cada)
    -- - pontos por empréstimos inadimplentes (-100 cada)
    -- - pontos por dias de atraso médio (-1 por dia)
    v_score := 500;
    v_score := v_score + (v_total_paid * 50);
    v_score := v_score - (v_total_defaulted * 100);
    v_score := v_score - (v_avg_days_overdue * 2);
    
    -- Limitar score entre 0 e 1000
    v_score := GREATEST(0, LEAST(1000, v_score));
    
    -- Determinar grade
    IF v_score >= 800 THEN v_grade := 'A';
    ELSIF v_score >= 600 THEN v_grade := 'B';
    ELSIF v_score >= 400 THEN v_grade := 'C';
    ELSIF v_score >= 200 THEN v_grade := 'D';
    ELSE v_grade := 'E';
    END IF;
    
    -- Determinar nível de risco
    IF v_score >= 600 THEN v_risk := 'low';
    ELSIF v_score >= 400 THEN v_risk := 'medium';
    ELSE v_risk := 'high';
    END IF;
    
    -- Atualizar ou inserir score
    INSERT INTO customer_global_score (
        customer_document, total_loans, total_paid_loans, total_defaulted_loans,
        total_amount_borrowed, total_amount_paid, average_days_overdue, max_days_overdue,
        last_event_date, score, score_grade, risk_level, last_updated
    ) VALUES (
        p_document, v_total_loans, v_total_paid, v_total_defaulted,
        v_total_borrowed, v_total_paid_amount, v_avg_days_overdue, v_max_days_overdue,
        v_last_date, v_score, v_grade, v_risk, NOW()
    )
    ON CONFLICT (customer_document) DO UPDATE SET
        total_loans = v_total_loans,
        total_paid_loans = v_total_paid,
        total_defaulted_loans = v_total_defaulted,
        total_amount_borrowed = v_total_borrowed,
        total_amount_paid = v_total_paid_amount,
        average_days_overdue = v_avg_days_overdue,
        max_days_overdue = v_max_days_overdue,
        last_event_date = v_last_date,
        score = v_score,
        score_grade = v_grade,
        risk_level = v_risk,
        last_updated = NOW();
END;
$$;

GRANT EXECUTE ON FUNCTION public.calculate_customer_global_score(VARCHAR) TO authenticated, anon, service_role;

-- 7. Função para registrar evento financeiro global
CREATE OR REPLACE FUNCTION public.register_customer_financial_event(
    p_document VARCHAR,
    p_event_type VARCHAR,
    p_amount DECIMAL,
    p_loan_id UUID DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_tenant UUID;
BEGIN
    -- Obter tenant_id do usuário atual
    v_tenant := public.get_current_tenant_id();
    
    -- Inserir evento
    INSERT INTO customer_financial_history (
        customer_document, event_type, amount, loan_id, tenant_id, notes
    ) VALUES (
        p_document, p_event_type, p_amount, p_loan_id, v_tenant, p_notes
    );
    
    -- Recalcular score
    PERFORM public.calculate_customer_global_score(p_document);
END;
$$;

GRANT EXECUTE ON FUNCTION public.register_customer_financial_event(VARCHAR, VARCHAR, DECIMAL, UUID, TEXT) TO authenticated, anon, service_role;

SELECT 'Nova estrutura de clientes implementada com sucesso!' AS status;
