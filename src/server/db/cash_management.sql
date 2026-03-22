-- ============================================
-- SISTEMA DE GESTÃO DE CAIXA BASEADO EM TRANSAÇÕES
-- ============================================

-- 1. Tabela de transações do caixa
CREATE TABLE IF NOT EXISTS cash_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
    
    -- Tipo de transação
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('entrada', 'saida')),
    
    -- Categoria da transação
    categoria VARCHAR(50) NOT NULL CHECK (
        categoria IN (
            'aporte',              -- Depósito inicial ou investimento
            'pagamento_recebido',  -- Pagamento de parcela
            'emprestimo_liberado', -- Valor entregue ao cliente
            'retirada',            -- Sangria / retirada de lucro
            'ajuste'               -- Correção manual
        )
    ),
    
    -- Valores
    valor DECIMAL(15,2) NOT NULL CHECK (valor > 0),
    
    -- Data e descrição
    data_transacao TIMESTAMPTZ DEFAULT NOW(),
    descricao TEXT,
    
    -- Responsável pela transação
    usuario_responsavel VARCHAR(255),
    
    -- Saldo antes e depois (snapshots)
    saldo_antes DECIMAL(15,2) NOT NULL DEFAULT 0,
    saldo_depois DECIMAL(15,2) NOT NULL DEFAULT 0,
    
    -- Para ajustes manuais - justificativa obrigatória
    justificativa TEXT,
    
    -- Referência opcional (para vincular a empréstimo ou pagamento)
    referencia_id UUID,
    referencia_tipo VARCHAR(50),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Adicionar índice para consultas por data e tenant
CREATE INDEX IF NOT EXISTS idx_cash_transactions_tenant_date 
ON cash_transactions(tenant_id, data_transacao DESC);

CREATE INDEX IF NOT EXISTS idx_cash_transactions_tenant_tipo 
ON cash_transactions(tenant_id, tipo);

CREATE INDEX IF NOT EXISTS idx_cash_transactions_tenant_categoria 
ON cash_transactions(tenant_id, categoria);

-- 3. Função para obter saldo atual do caixa
CREATE OR REPLACE FUNCTION get_cash_balance(p_tenant_id UUID)
RETURNS DECIMAL(15,2)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_saldo DECIMAL(15,2);
BEGIN
    SELECT COALESCE(SUM(
        CASE 
            WHEN tipo = 'entrada' THEN valor 
            WHEN tipo = 'saida' THEN -valor 
            ELSE 0 
        END
    ), 0) INTO v_saldo
    FROM cash_transactions
    WHERE tenant_id = p_tenant_id;
    
    RETURN v_saldo;
END;
$$;

-- 4. Função para obter saldo em uma data específica
CREATE OR REPLACE FUNCTION get_cash_balance_at_date(p_tenant_id UUID, p_date TIMESTAMPTZ)
RETURNS DECIMAL(15,2)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_saldo DECIMAL(15,2);
BEGIN
    SELECT COALESCE(SUM(
        CASE 
            WHEN tipo = 'entrada' THEN valor 
            WHEN tipo = 'saida' THEN -valor 
            ELSE 0 
        END
    ), 0) INTO v_saldo
    FROM cash_transactions
    WHERE tenant_id = p_tenant_id
    AND data_transacao <= p_date;
    
    RETURN v_saldo;
END;
$$;

-- 5. Função para criar transação de caixa (genérica)
CREATE OR REPLACE FUNCTION create_cash_transaction(
    p_tenant_id UUID,
    p_tipo VARCHAR(20),
    p_categoria VARCHAR(50),
    p_valor DECIMAL(15,2),
    p_descricao TEXT,
    p_usuario_responsavel VARCHAR(255),
    p_justificativa TEXT DEFAULT NULL,
    p_referencia_id UUID DEFAULT NULL,
    p_referencia_tipo VARCHAR(50) DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_saldo_atual DECIMAL(15,2);
    v_transacao_id UUID;
BEGIN
    -- Obter saldo atual
    v_saldo_atual := get_cash_balance(p_tenant_id);
    
    -- Calcular saldo depois
    DECLARE
        v_saldo_depois DECIMAL(15,2);
    BEGIN
        IF p_tipo = 'entrada' THEN
            v_saldo_depois := v_saldo_atual + p_valor;
        ELSIF p_tipo = 'saida' THEN
            v_saldo_depois := v_saldo_atual - p_valor;
        ELSE
            v_saldo_depois := v_saldo_atual;
        END IF;
        
        -- Inserir transação
        INSERT INTO cash_transactions (
            tenant_id,
            tipo,
            categoria,
            valor,
            descricao,
            usuario_responsavel,
            saldo_antes,
            saldo_depois,
            justificativa,
            referencia_id,
            referencia_tipo
        ) VALUES (
            p_tenant_id,
            p_tipo,
            p_categoria,
            p_valor,
            p_descricao,
            p_usuario_responsavel,
            v_saldo_atual,
            v_saldo_depois,
            p_justificativa,
            p_referencia_id,
            p_referencia_tipo
        )
        RETURNING id INTO v_transacao_id;
    END;
    
    RETURN v_transacao_id;
END;
$$;

-- 6. Função para registrar aporte (entrada de dinheiro)
CREATE OR REPLACE FUNCTION register_cash_contribution(
    p_tenant_id UUID,
    p_valor DECIMAL(15,2),
    p_descricao TEXT,
    p_usuario_responsavel VARCHAR(255)
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN create_cash_transaction(
        p_tenant_id,
        'entrada',
        'aporte',
        p_valor,
        p_descricao,
        p_usuario_responsavel,
        NULL,  -- justificativa não obrigatória para aporte
        NULL,
        NULL
    );
END;
$$;

-- 7. Função para registrar retirada (saída de dinheiro)
CREATE OR REPLACE FUNCTION register_cash_withdrawal(
    p_tenant_id UUID,
    p_valor DECIMAL(15,2),
    p_descricao TEXT,
    p_usuario_responsavel VARCHAR(255),
    p_justificativa TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN create_cash_transaction(
        p_tenant_id,
        'saida',
        'retirada',
        p_valor,
        p_descricao,
        p_usuario_responsavel,
        p_justificativa,  -- justificativa obrigatória
        NULL,
        NULL
    );
END;
$$;

-- 8. Função para ajuste manual
CREATE OR REPLACE FUNCTION register_cash_adjustment(
    p_tenant_id UUID,
    p_valor DECIMAL(15,2),
    p_descricao TEXT,
    p_usuario_responsavel VARCHAR(255),
    p_justificativa TEXT,
    p_positivo BOOLEAN DEFAULT true  -- true = entrada, false = saída
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tipo VARCHAR(20);
BEGIN
    v_tipo := CASE WHEN p_positivo THEN 'entrada' ELSE 'saida' END;
    
    RETURN create_cash_transaction(
        p_tenant_id,
        v_tipo,
        'ajuste',
        p_valor,
        p_descricao,
        p_usuario_responsavel,
        p_justificativa,  -- justificativa obrigatória para ajuste
        NULL,
        NULL
    );
END;
$$;

-- 9. Função para registrar liberação de empréstimo (saída automática)
CREATE OR REPLACE FUNCTION register_loan_disbursement(
    p_tenant_id UUID,
    p_loan_id UUID,
    p_valor DECIMAL(15,2),
    p_usuario_responsavel VARCHAR(255)
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN create_cash_transaction(
        p_tenant_id,
        'saida',
        'emprestimo_liberado',
        p_valor,
        'Liberação de empréstimo',
        p_usuario_responsavel,
        NULL,  -- não precisa justificativa
        p_loan_id,
        'loan'
    );
END;
$$;

-- 10. Função para registrar pagamento recebido (entrada automática)
CREATE OR REPLACE FUNCTION register_payment_received(
    p_tenant_id UUID,
    p_payment_id UUID,
    p_valor DECIMAL(15,2),
    p_usuario_responsavel VARCHAR(255)
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN create_cash_transaction(
        p_tenant_id,
        'entrada',
        'pagamento_recebido',
        p_valor,
        'Recebimento de parcela',
        p_usuario_responsavel,
        NULL,  -- não precisa justificativa
        p_payment_id,
        'payment'
    );
END;
$$;

-- 11. Função para obter histórico de transações
CREATE OR REPLACE FUNCTION get_cash_transactions(
    p_tenant_id UUID,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0,
    p_tipo VARCHAR(20) DEFAULT NULL,
    p_categoria VARCHAR(50) DEFAULT NULL,
    p_data_inicio TIMESTAMPTZ DEFAULT NULL,
    p_data_fim TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    tipo VARCHAR(20),
    categoria VARCHAR(50),
    valor DECIMAL(15,2),
    data_transacao TIMESTAMPTZ,
    descricao TEXT,
    usuario_responsavel VARCHAR(255),
    saldo_antes DECIMAL(15,2),
    saldo_depois DECIMAL(15,2),
    justificativa TEXT,
    referencia_id UUID,
    referencia_tipo VARCHAR(50)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ct.id,
        ct.tipo,
        ct.categoria,
        ct.valor,
        ct.data_transacao,
        ct.descricao,
        ct.usuario_responsavel,
        ct.saldo_antes,
        ct.saldo_depois,
        ct.justificativa,
        ct.referencia_id,
        ct.referencia_tipo
    FROM cash_transactions ct
    WHERE ct.tenant_id = p_tenant_id
    AND (p_tipo IS NULL OR ct.tipo = p_tipo)
    AND (p_categoria IS NULL OR ct.categoria = p_categoria)
    AND (p_data_inicio IS NULL OR ct.data_transacao >= p_data_inicio)
    AND (p_data_fim IS NULL OR ct.data_transacao <= p_data_fim)
    ORDER BY ct.data_transacao DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- 12. Função para obter resumo do caixa
CREATE OR REPLACE FUNCTION get_cash_summary(p_tenant_id UUID)
RETURNS TABLE (
    saldo_atual DECIMAL(15,2),
    total_entradas DECIMAL(15,2),
    total_saidas DECIMAL(15,2),
    total_aportes DECIMAL(15,2),
    total_retiradas DECIMAL(15,2),
    total_emprestimos_liberados DECIMAL(15,2),
    total_pagamentos_recebidos DECIMAL(15,2),
    total_ajustes DECIMAL(15,2),
    total_transactions BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        get_cash_balance(p_tenant_id) AS saldo_atual,
        COALESCE(SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE 0 END), 0) AS total_entradas,
        COALESCE(SUM(CASE WHEN tipo = 'saida' THEN valor ELSE 0 END), 0) AS total_saidas,
        COALESCE(SUM(CASE WHEN categoria = 'aporte' THEN valor ELSE 0 END), 0) AS total_aportes,
        COALESCE(SUM(CASE WHEN categoria = 'retirada' THEN valor ELSE 0 END), 0) AS total_retiradas,
        COALESCE(SUM(CASE WHEN categoria = 'emprestimo_liberado' THEN valor ELSE 0 END), 0) AS total_emprestimos_liberados,
        COALESCE(SUM(CASE WHEN categoria = 'pagamento_recebido' THEN valor ELSE 0 END), 0) AS total_pagamentos_recebidos,
        COALESCE(SUM(CASE WHEN categoria = 'ajuste' THEN valor ELSE 0 END), 0) AS total_ajustes,
        COUNT(*)::BIGINT AS total_transactions
    FROM cash_transactions
    WHERE tenant_id = p_tenant_id;
END;
$$;

-- 13. Habilitar RLS
ALTER TABLE cash_transactions ENABLE ROW LEVEL SECURITY;

-- 14. Políticas RLS
DROP POLICY IF EXISTS "cash_transactions_tenant" ON cash_transactions;
CREATE POLICY "cash_transactions_tenant" ON cash_transactions FOR ALL USING (true);

-- 15. Conceder permissões
GRANT SELECT ON cash_transactions TO authenticated;
GRANT ALL ON cash_transactions TO authenticated;
GRANT ALL ON cash_transactions TO anon;

GRANT EXECUTE ON FUNCTION get_cash_balance TO authenticated;
GRANT EXECUTE ON FUNCTION get_cash_balance_at_date TO authenticated;
GRANT EXECUTE ON FUNCTION create_cash_transaction TO authenticated;
GRANT EXECUTE ON FUNCTION register_cash_contribution TO authenticated;
GRANT EXECUTE ON FUNCTION register_cash_withdrawal TO authenticated;
GRANT EXECUTE ON FUNCTION register_cash_adjustment TO authenticated;
GRANT EXECUTE ON FUNCTION register_loan_disbursement TO authenticated;
GRANT EXECUTE ON FUNCTION register_payment_received TO authenticated;
GRANT EXECUTE ON FUNCTION get_cash_transactions TO authenticated;
GRANT EXECUTE ON FUNCTION get_cash_summary TO authenticated;
