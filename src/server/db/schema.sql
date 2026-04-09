-- ============================================
-- AXION Cred - Banco de Dados Completo v2
-- Execute este arquivo inteiro no Supabase SQL Editor
-- ============================================

-- ============================================
-- EXTENSÕES
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- ============================================
-- TENANTS (Empresas)
-- ============================================
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    document VARCHAR(20),
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(2),
    zip_code VARCHAR(10),
    logo_url TEXT,
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- USERS (Usuários/Funcionários)
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255),
    role VARCHAR(50) DEFAULT 'operator',
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    status VARCHAR(20) DEFAULT 'active',
    invite_token TEXT,
    invite_expires_at TIMESTAMPTZ,
    invited_by UUID,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);

-- ============================================
-- CUSTOMERS (Clientes)
-- ============================================
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    name_normalized TEXT,
    document VARCHAR(20),
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(2),
    zip_code VARCHAR(10),
    notes TEXT,
    tags TEXT[],
    credit_limit DECIMAL(15,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customers_tenant ON customers(tenant_id);
CREATE INDEX idx_customers_name_gin ON customers USING gin(name_normalized gin_trgm_ops);
CREATE INDEX idx_customers_document ON customers(document) WHERE document IS NOT NULL;
CREATE INDEX idx_customers_status ON customers(status);

-- ============================================
-- LOANS (Empréstimos)
-- ============================================
CREATE TABLE loans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    amount DECIMAL(15,2) NOT NULL,
    interest_rate DECIMAL(5,2) DEFAULT 0,
    interest_type VARCHAR(20) DEFAULT 'simple',
    installments INTEGER NOT NULL,
    installment_amount DECIMAL(15,2),
    total_amount DECIMAL(15,2),
    total_interest DECIMAL(15,2),
    first_due_date DATE,
    status VARCHAR(20) DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_loans_tenant ON loans(tenant_id);
CREATE INDEX idx_loans_customer ON loans(customer_id);
CREATE INDEX idx_loans_status ON loans(status);
CREATE INDEX idx_loans_created_at ON loans(created_at DESC);

-- ============================================
-- LOAN_INSTALLMENTS (Parcelas)
-- ============================================
CREATE TABLE loan_installments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    loan_id UUID REFERENCES loans(id) ON DELETE CASCADE,
    installment_number INTEGER NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    due_date DATE NOT NULL,
    paid_amount DECIMAL(15,2) DEFAULT 0,
    paid_date DATE,
    status VARCHAR(20) DEFAULT 'pending',
    payment_method VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_installments_tenant ON loan_installments(tenant_id);
CREATE INDEX idx_installments_loan ON loan_installments(loan_id);
CREATE INDEX idx_installments_status ON loan_installments(status);
CREATE INDEX idx_installments_due_date ON loan_installments(due_date);

-- ============================================
-- PAYMENT_TRANSACTIONS (Transações de Pagamento)
-- ============================================
CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    loan_id UUID REFERENCES loans(id) ON DELETE CASCADE,
    installment_id UUID REFERENCES loan_installments(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    amount DECIMAL(15,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method VARCHAR(20) DEFAULT 'cash',
    status VARCHAR(20) DEFAULT 'completed',
    proof_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_tenant ON payment_transactions(tenant_id);
CREATE INDEX idx_payments_date ON payment_transactions(payment_date);
CREATE INDEX idx_payments_loan ON payment_transactions(loan_id);

-- ============================================
-- GUARANTORS (Fiadores/Garantias)
-- ============================================
CREATE TABLE guarantors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    loan_id UUID REFERENCES loans(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    document VARCHAR(20),
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    guarantee_type VARCHAR(20) DEFAULT 'personal',
    guarantee_value DECIMAL(15,2),
    status VARCHAR(20) DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_guarantors_tenant ON guarantors(tenant_id);
CREATE INDEX idx_guarantors_loan ON guarantors(loan_id);

-- ============================================
-- RENEGOTIATIONS (Renegociações)
-- ============================================
CREATE TABLE loan_renegotiations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    loan_id UUID REFERENCES loans(id) ON DELETE CASCADE,
    original_loan_id UUID REFERENCES loans(id),
    user_id UUID REFERENCES users(id),
    new_amount DECIMAL(15,2) NOT NULL,
    new_installments INTEGER NOT NULL,
    new_installment_amount DECIMAL(15,2),
    interest_rate DECIMAL(5,2),
    status VARCHAR(20) DEFAULT 'pending',
    reason TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_renegotiations_tenant ON loan_renegotiations(tenant_id);
CREATE INDEX idx_renegotiations_loan ON loan_renegotiations(loan_id);
CREATE INDEX idx_renegotiations_status ON loan_renegotiations(status);

-- ============================================
-- AUDIT_LOGS (Logs de Auditoria)
-- ============================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_tenant ON audit_logs(tenant_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);

-- ============================================
-- NOTIFICATIONS (Notificações)
-- ============================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_tenant ON notifications(tenant_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);

-- ============================================
-- REMINDER_SETTINGS (Configurações de Lembretes)
-- ============================================
CREATE TABLE reminder_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    days_before INTEGER DEFAULT 3,
    days_after INTEGER DEFAULT 1,
    is_enabled BOOLEAN DEFAULT true,
    message_template TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- REMINDER_LOGS (Logs de Lembretes Enviados)
-- ============================================
CREATE TABLE reminder_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    installment_id UUID REFERENCES loan_installments(id) ON DELETE CASCADE,
    message_sent TEXT,
    status VARCHAR(20),
    sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CUSTOMER_EVENTS (Eventos do Cliente)
-- ============================================
CREATE TABLE customer_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    event_type VARCHAR(50) NOT NULL,
    description TEXT,
    data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customer_events_tenant ON customer_events(tenant_id);
CREATE INDEX idx_customer_events_customer ON customer_events(customer_id);

-- ============================================
-- USER_ROLES (Roles de Usuário)
-- ============================================
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO user_roles (name, description, permissions) VALUES
    ('admin', 'Administrador', '["all"]'),
    ('manager', 'Gerente', '["read", "write", "approve"]'),
    ('collector', 'Cobrador', '["read", "write", "collection"]'),
    ('analyst', 'Analista', '["read", "reports"]'),
    ('viewer', 'Visualizador', '["read"]')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- MESSAGE_TEMPLATES (Templates de Mensagem)
-- ============================================
CREATE TABLE message_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FUNÇÕES E TRIGGERS
-- ============================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_tenants_updated_at
    BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_loans_updated_at
    BEFORE UPDATE ON loans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_installments_updated_at
    BEFORE UPDATE ON loan_installments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Função para normalizar nome (para busca)
CREATE OR REPLACE FUNCTION normalize_name(name TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN unaccent(LOWER(TRIM(name)));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger para normalizar nome do cliente
CREATE OR REPLACE FUNCTION normalize_customer_name()
RETURNS TRIGGER AS $$
BEGIN
    NEW.name_normalized := normalize_name(NEW.name);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER normalize_customers_name
    BEFORE INSERT OR UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION normalize_customer_name();

-- Função para verificar parcelas atrasadas
CREATE OR REPLACE FUNCTION check_installments_status()
RETURNS void AS $$
BEGIN
    UPDATE loan_installments
    SET status = 'late'
    WHERE status = 'pending'
    AND due_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar totais do empréstimo
CREATE OR REPLACE FUNCTION update_loan_totals()
RETURNS TRIGGER AS $$
DECLARE
    paid DECIMAL(15,2);
    remaining DECIMAL(15,2);
    paid_count INTEGER;
BEGIN
    SELECT COALESCE(SUM(paid_amount), 0),
           COALESCE(SUM(amount), 0) - COALESCE(SUM(paid_amount), 0),
           COUNT(*) FILTER (WHERE status = 'paid')
    INTO paid, remaining, paid_count
    FROM loan_installments
    WHERE loan_id = COALESCE(NEW.loan_id, OLD.loan_id);

    UPDATE loans
    SET total_amount = COALESCE(amount, 0) + COALESCE(total_interest, 0),
        paid_amount = paid,
        remaining_amount = remaining,
        paid_installments = paid_count,
        status = CASE WHEN remaining <= 0 THEN 'paid' ELSE status END
    WHERE id = COALESCE(NEW.loan_id, OLD.loan_id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_loan_after_installment
    AFTER INSERT OR UPDATE OR DELETE ON loan_installments
    FOR EACH ROW EXECUTE FUNCTION update_loan_totals();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE guarantors ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_renegotiations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminder_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminder_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CRIAR TENANT E USUÁRIO DE TESTE
-- ============================================
INSERT INTO tenants (name, email, is_active) 
VALUES ('Minha Empresa', 'admin@exemplo.com', true);

-- Agora insira o usuário (substitua o UUID do tenant)
-- INSERT INTO users (tenant_id, email, name, password_hash, role)
-- VALUES ('UUID_DO_TENANT', 'admin@exemplo.com', 'Admin', '$2a$10$...', 'admin');

-- ============================================
-- FIM - Banco completo criado!
-- ============================================