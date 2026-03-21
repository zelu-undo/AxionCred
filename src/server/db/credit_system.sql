-- ============================================
-- SISTEMA DE ALOCAÇÃO DE CAIXA E CRÉDITO
-- ============================================

-- Remover funções existentes para evitar conflitos
DROP FUNCTION IF EXISTS calculate_credit_score(UUID, VARCHAR(20));
DROP FUNCTION IF EXISTS calculate_client_credit_limit(UUID, VARCHAR(20), DECIMAL);
DROP FUNCTION IF EXISTS calculate_tenant_credit_cash(UUID);

-- 1. Tabela de configurações de crédito por tenant
CREATE TABLE IF NOT EXISTS credit_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE UNIQUE,
    
    -- Configurações de caixa
    max_box_percentage DECIMAL(5,2) DEFAULT 80.00,
    block_on_box_limit BOOLEAN DEFAULT true,
    
    -- Configurações de score
    min_score_for_approval INTEGER DEFAULT 500,
    below_score_action VARCHAR(20) DEFAULT 'deny',
    block_on_low_score BOOLEAN DEFAULT true,
    
    -- Pesos do cálculo de score (cada owner configura seu próprio peso)
    score_payment_weight INTEGER DEFAULT 30,
    score_time_weight INTEGER DEFAULT 25,
    score_default_weight INTEGER DEFAULT 20,
    score_usage_weight INTEGER DEFAULT 15,
    score_stability_weight INTEGER DEFAULT 10,
    
    -- Configurações de limite por cliente
    max_box_percentage_per_client DECIMAL(5,2) DEFAULT 20.00,
    client_limit_mandatory BOOLEAN DEFAULT false,
    
    -- Configurações de empréstimo
    max_active_loans_per_customer INTEGER DEFAULT 5,
    allow_refinancing BOOLEAN DEFAULT true,
    refinancing_strategy VARCHAR(20) DEFAULT 'pay_off',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de score do cliente
CREATE TABLE IF NOT EXISTS customer_score (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_document VARCHAR(20) NOT NULL,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    
    payment_score INTEGER DEFAULT 500,
    time_score INTEGER DEFAULT 0,
    default_score INTEGER DEFAULT 1000,
    credit_usage_score INTEGER DEFAULT 1000,
    stability_score INTEGER DEFAULT 500,
    
    final_score INTEGER DEFAULT 500,
    risk_level VARCHAR(20) DEFAULT 'medium',
    risk_factor DECIMAL(4,2) DEFAULT 0.70,
    
    total_loans INTEGER DEFAULT 0,
    total_paid INTEGER DEFAULT 0,
    total_defaulted INTEGER DEFAULT 0,
    months_as_customer INTEGER DEFAULT 0,
    active_loans INTEGER DEFAULT 0,
    recent_loans_30d INTEGER DEFAULT 0,
    
    last_calculated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(customer_document, tenant_id)
);

-- 3. Tabela de auditoria de decisões de crédito
CREATE TABLE IF NOT EXISTS credit_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    
    loan_id UUID,
    customer_document VARCHAR(20),
    customer_name VARCHAR(255),
    
    decision_type VARCHAR(50) NOT NULL,
    decision_result VARCHAR(20) NOT NULL,
    
    box_available DECIMAL(15,2),
    box_utilizable DECIMAL(15,2),
    requested_amount DECIMAL(15,2),
    client_limit DECIMAL(15,2),
    client_limit_used DECIMAL(15,2),
    customer_score INTEGER,
    customer_risk_level VARCHAR(20),
    active_loans_count INTEGER,
    
    box_limit_check BOOLEAN,
    client_limit_check BOOLEAN,
    score_check BOOLEAN,
    max_loans_check BOOLEAN,
    
    override_by VARCHAR(255),
    override_reason TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabela de caixa do tenant
CREATE TABLE IF NOT EXISTS tenant_cash_flow (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE UNIQUE,
    
    total_received DECIMAL(15,2) DEFAULT 0,
    total_disbursed DECIMAL(15,2) DEFAULT 0,
    total_received_pending DECIMAL(15,2) DEFAULT 0,
    
    gross_cash DECIMAL(15,2) DEFAULT 0,
    available_cash DECIMAL(15,2) DEFAULT 0,
    usable_cash DECIMAL(15,2) DEFAULT 0,
    
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Função para calcular score do cliente
CREATE OR REPLACE FUNCTION calculate_credit_score(
    p_tenant_id UUID,
    p_customer_document VARCHAR(20)
)
RETURNS TABLE (
    final_score INTEGER,
    risk_level VARCHAR(20),
    risk_factor DECIMAL(4,2),
    payment_score INTEGER,
    time_score INTEGER,
    default_score INTEGER,
    credit_usage_score INTEGER,
    stability_score INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_payment_score INTEGER;
    v_time_score INTEGER;
    v_default_score INTEGER;
    v_credit_usage_score INTEGER;
    v_stability_score INTEGER;
    v_final_score INTEGER;
    v_risk_level VARCHAR(20);
    v_risk_factor DECIMAL(4,2);
    
    v_total_parcelas INTEGER;
    v_parcelas_pagas INTEGER;
    v_parcelas_atrasadas INTEGER;
    v_meses_cadastro INTEGER;
    v_inadimplencias INTEGER;
    v_emprestimos_ativos INTEGER;
    v_emprestimos_30d INTEGER;
BEGIN
    -- 1. Score de Pagamento (peso 30%)
    SELECT 
        COALESCE(SUM(total_installments), 0),
        COALESCE(SUM(CASE WHEN status = 'paid' THEN total_installments ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END), 0)
    INTO v_total_parcelas, v_parcelas_pagas, v_parcelas_atrasadas
    FROM loans l
    WHERE l.customer_document = p_customer_document AND l.tenant_id = p_tenant_id;
    
    IF v_total_parcelas > 0 THEN
        v_payment_score := LEAST(1000, GREATEST(0, 
            (v_parcelas_pagas::DECIMAL / v_total_parcelas::DECIMAL * 1000) - 
            (v_parcelas_atrasadas::DECIMAL / v_total_parcelas::DECIMAL * 300)
        ));
    ELSE
        v_payment_score := 500;
    END IF;
    
    -- 2. Score de Tempo de Relacionamento (peso 25%)
    SELECT COALESCE(EXTRACT(MONTH FROM AGE(NOW(), MIN(created_at))), 0)::INTEGER
    INTO v_meses_cadastro
    FROM customers
    WHERE document = p_customer_document AND tenant_id = p_tenant_id;
    
    v_time_score := LEAST(1000, (v_meses_cadastro::DECIMAL / 24 * 1000))::INTEGER;
    
    -- 3. Score de Inadimplência (peso 20%)
    SELECT COALESCE(COUNT(*), 0)
    INTO v_inadimplencias
    FROM loans
    WHERE customer_document = p_customer_document 
      AND tenant_id = p_tenant_id 
      AND status = 'defaulted';
    
    v_default_score := GREATEST(0, 1000 - (v_inadimplencias * 250));
    
    -- 4. Score de Uso de Crédito (peso 15%)
    SELECT COALESCE(COUNT(*), 0)
    INTO v_emprestimos_ativos
    FROM loans
    WHERE customer_document = p_customer_document 
      AND tenant_id = p_tenant_id 
      AND status IN ('active', 'overdue');
    
    SELECT COALESCE(COUNT(*), 0)
    INTO v_emprestimos_30d
    FROM loans
    WHERE customer_document = p_customer_document 
      AND tenant_id = p_tenant_id 
      AND created_at >= NOW() - INTERVAL '30 days';
    
    v_credit_usage_score := 1000;
    IF v_emprestimos_ativos > 3 THEN
        v_credit_usage_score := v_credit_usage_score - ((v_emprestimos_ativos - 3) * 100);
    END IF;
    IF v_emprestimos_30d > 3 THEN
        v_credit_usage_score := v_credit_usage_score - ((v_emprestimos_30d - 3) * 150);
    END IF;
    v_credit_usage_score := GREATEST(0, v_credit_usage_score);
    
    -- 5. Score de Estabilidade (peso 10%)
    IF v_total_parcelas > 0 THEN
        v_stability_score := GREATEST(0, 1000 - (
            ABS(v_parcelas_pagas - v_parcelas_atrasadas)::DECIMAL / v_total_parcelas::DECIMAL * 500
        ));
    ELSE
        v_stability_score := 500;
    END IF;
    
    -- Buscar pesos do cálculo de score das configurações do tenant
    DECLARE
        v_payment_weight DECIMAL(5,2) DEFAULT 0.30;
        v_time_weight DECIMAL(5,2) DEFAULT 0.25;
        v_default_weight DECIMAL(5,2) DEFAULT 0.20;
        v_usage_weight DECIMAL(5,2) DEFAULT 0.15;
        v_stability_weight DECIMAL(5,2) DEFAULT 0.10;
    BEGIN
    -- Buscar pesos das configurações do tenant
    SELECT 
        COALESCE(cs.score_payment_weight / 100.0, 0.30),
        COALESCE(cs.score_time_weight / 100.0, 0.25),
        COALESCE(cs.score_default_weight / 100.0, 0.20),
        COALESCE(cs.score_usage_weight / 100.0, 0.15),
        COALESCE(cs.score_stability_weight / 100.0, 0.10)
    INTO v_payment_weight, v_time_weight, v_default_weight, v_usage_weight, v_stability_weight
    FROM credit_settings cs
    WHERE cs.tenant_id = p_tenant_id;
    
    -- Cálculo do Score Final usando pesos configuráveis
    v_final_score := ROUND(
        (v_payment_weight * v_payment_score) +
        (v_time_weight * v_time_score) +
        (v_default_weight * v_default_score) +
        (v_usage_weight * v_credit_usage_score) +
        (v_stability_weight * v_stability_score)
    )::INTEGER;
    END;
    
    v_final_score := GREATEST(0, LEAST(1000, v_final_score));
    
    -- Classificação de Risco
    CASE 
        WHEN v_final_score >= 801 THEN 
            v_risk_level := 'low';
            v_risk_factor := 0.90 + (v_final_score - 801)::DECIMAL / 200;
        WHEN v_final_score >= 601 THEN 
            v_risk_level := 'medium';
            v_risk_factor := 0.70 + (v_final_score - 601)::DECIMAL / 200;
        WHEN v_final_score >= 301 THEN 
            v_risk_level := 'high';
            v_risk_factor := 0.40 + (v_final_score - 301)::DECIMAL / 300;
        ELSE 
            v_risk_level := 'very_high';
            v_risk_factor := 0.20 + (v_final_score::DECIMAL / 300 * 0.20);
    END CASE;
    
    v_risk_factor := ROUND(GREATEST(0.20, LEAST(1.0, v_risk_factor))::NUMERIC, 2);
    
    RETURN QUERY SELECT 
        v_final_score, v_risk_level, v_risk_factor,
        v_payment_score, v_time_score, v_default_score, 
        v_credit_usage_score, v_stability_score;
END;
$$;

-- 6. Função para calcular limite do cliente
CREATE OR REPLACE FUNCTION calculate_client_credit_limit(
    p_tenant_id UUID,
    p_customer_document VARCHAR(20),
    p_monthly_income DECIMAL(15,2) DEFAULT 0
)
RETURNS DECIMAL(15,2)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_risk_factor DECIMAL(4,2);
    v_income_percentage DECIMAL(5,2) DEFAULT 30.00;
    v_max_limit DECIMAL(15,2) DEFAULT 10000;
    v_limit DECIMAL(15,2);
    v_settings RECORD;
    v_cash RECORD;
BEGIN
    SELECT * INTO v_settings 
    FROM credit_settings 
    WHERE tenant_id = p_tenant_id;
    
    SELECT * INTO v_cash
    FROM calculate_tenant_credit_cash(p_tenant_id);
    
    IF v_settings.max_box_percentage_per_client IS NOT NULL AND v_cash.usable_cash IS NOT NULL THEN
        v_max_limit := v_cash.usable_cash * v_settings.max_box_percentage_per_client / 100;
    END IF;
    
    SELECT risk_factor INTO v_risk_factor 
    FROM customer_score 
    WHERE customer_document = p_customer_document AND tenant_id = p_tenant_id;
    
    IF v_risk_factor IS NULL THEN
        v_risk_factor := 0.70;
    END IF;
    
    v_limit := p_monthly_income * v_income_percentage / 100 * v_risk_factor;
    v_limit := LEAST(v_limit, v_max_limit);
    v_limit := GREATEST(v_limit, 100);
    
    RETURN ROUND(v_limit, 2);
END;
$$;

-- 7. Função para calcular caixa do tenant
CREATE OR REPLACE FUNCTION calculate_tenant_credit_cash(p_tenant_id UUID)
RETURNS TABLE (
    gross_cash DECIMAL(15,2),
    available_cash DECIMAL(15,2),
    usable_cash DECIMAL(15,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_received DECIMAL(15,2);
    v_total_disbursed DECIMAL(15,2);
    v_gross_cash DECIMAL(15,2);
    v_available_cash DECIMAL(15,2);
    v_usable_cash DECIMAL(15,2);
    v_max_percentage DECIMAL(5,2);
BEGIN
    SELECT COALESCE(SUM(amount), 0) INTO v_total_received
    FROM payment_transactions
    WHERE tenant_id = p_tenant_id AND status = 'completed';
    
    SELECT COALESCE(SUM(amount), 0) INTO v_total_disbursed
    FROM loans
    WHERE tenant_id = p_tenant_id AND status IN ('active', 'overdue', 'paid');
    
    v_gross_cash := v_total_received - v_total_disbursed;
    v_available_cash := GREATEST(0, v_gross_cash);
    
    SELECT COALESCE(max_box_percentage, 80) INTO v_max_percentage
    FROM credit_settings WHERE tenant_id = p_tenant_id;
    
    v_usable_cash := v_available_cash * v_max_percentage / 100;
    
    RETURN QUERY SELECT v_gross_cash, v_available_cash, v_usable_cash;
END;
$$;

-- Habilitar RLS
ALTER TABLE credit_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_score ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_cash_flow ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
DROP POLICY IF EXISTS "credit_settings_tenant" ON credit_settings;
CREATE POLICY "credit_settings_tenant" ON credit_settings FOR ALL USING (true);

DROP POLICY IF EXISTS "customer_score_tenant" ON customer_score;
CREATE POLICY "customer_score_tenant" ON customer_score FOR ALL USING (true);

DROP POLICY IF EXISTS "credit_audit_log_tenant" ON credit_audit_log;
CREATE POLICY "credit_audit_log_tenant" ON credit_audit_log FOR ALL USING (true);

DROP POLICY IF EXISTS "tenant_cash_flow_tenant" ON tenant_cash_flow;
CREATE POLICY "tenant_cash_flow_tenant" ON tenant_cash_flow FOR ALL USING (true);

-- Conceder permissões
GRANT SELECT ON credit_settings TO authenticated;
GRANT SELECT, INSERT ON customer_score TO authenticated;
GRANT SELECT, INSERT ON credit_audit_log TO authenticated;
GRANT SELECT ON tenant_cash_flow TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_credit_score TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_client_credit_limit TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_tenant_credit_cash TO authenticated;

SELECT 'Sistema de crédito implementado com sucesso!' AS status;