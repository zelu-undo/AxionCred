-- ============================================
-- AXION Database Schema - PostgreSQL/Supabase
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================
-- TENANCY
-- ============================================

CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    plan VARCHAR(50) DEFAULT 'starter',
    logo_url TEXT,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tenant_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    key VARCHAR(100) NOT NULL,
    value TEXT,
    UNIQUE(tenant_id, key)
);

-- ============================================
-- USERS AND PERMISSIONS
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
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    permissions JSONB DEFAULT '[]',
    UNIQUE(tenant_id, name)
);

-- ============================================
-- CUSTOMERS
-- ============================================

CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20) NOT NULL,
    document VARCHAR(20),
    address TEXT,
    notes TEXT,
    global_identity_id UUID,
    status VARCHAR(20) DEFAULT 'active',
    credit_limit DECIMAL(15,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE customer_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    file_url TEXT NOT NULL,
    file_name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE customer_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE consent_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    consent_type VARCHAR(100) NOT NULL,
    granted BOOLEAN NOT NULL,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- LOANS
-- ============================================

CREATE TABLE loans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    principal_amount DECIMAL(15,2) NOT NULL,
    interest_rate DECIMAL(5,2) DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL,
    paid_amount DECIMAL(15,2) DEFAULT 0,
    remaining_amount DECIMAL(15,2) NOT NULL,
    installments_count INTEGER NOT NULL,
    paid_installments INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending',
    notes TEXT,
    parent_loan_id UUID REFERENCES loans(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE loan_installments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loan_id UUID REFERENCES loans(id) ON DELETE CASCADE,
    installment_number INTEGER NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    paid_amount DECIMAL(15,2) DEFAULT 0,
    due_date DATE NOT NULL,
    paid_date DATE,
    status VARCHAR(20) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE payment_proofs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    loan_id UUID REFERENCES loans(id) ON DELETE CASCADE,
    installment_id UUID REFERENCES loan_installments(id) ON DELETE SET NULL,
    file_url TEXT NOT NULL,
    file_name VARCHAR(255),
    amount DECIMAL(15,2) NOT NULL,
    payment_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PAYMENTS
-- ============================================

CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    loan_id UUID REFERENCES loans(id) ON DELETE CASCADE,
    installment_id UUID REFERENCES loan_installments(id) ON DELETE SET NULL,
    method VARCHAR(20) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    gateway_id VARCHAR(100),
    gateway_response JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE payment_gateway_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    gateway VARCHAR(50) NOT NULL,
    api_key TEXT,
    api_secret TEXT,
    webhook_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- GLOBAL CREDIT NETWORK
-- ============================================

CREATE TABLE global_identities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hash VARCHAR(64) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE global_credit_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    global_identity_id UUID REFERENCES global_identities(id) ON DELETE CASCADE,
    total_loans INTEGER DEFAULT 0,
    total_paid INTEGER DEFAULT 0,
    total_late INTEGER DEFAULT 0,
    average_score INTEGER DEFAULT 500,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(global_identity_id)
);

CREATE TABLE credit_score_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    global_credit_profile_id UUID REFERENCES global_credit_profiles(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    calculated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- REMINDERS AND NOTIFICATIONS
-- ============================================

CREATE TABLE reminder_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    enabled BOOLEAN DEFAULT true,
    days_before INTEGER[] DEFAULT ARRAY[3, 1],
    hours INTEGER[] DEFAULT ARRAY[9, 14, 18],
    methods TEXT[] DEFAULT ARRAY['whatsapp'],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE reminder_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    loan_id UUID REFERENCES loans(id) ON DELETE CASCADE,
    installment_id UUID REFERENCES loan_installments(id) ON DELETE CASCADE,
    method VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'sent',
    sent_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    loan_id UUID REFERENCES loans(id) ON DELETE SET NULL,
    phone VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    whatsapp_id VARCHAR(100),
    sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CREDIT DECISIONS
-- ============================================

CREATE TABLE credit_decisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    recommended_amount DECIMAL(15,2) NOT NULL,
    recommended_rate DECIMAL(5,2) NOT NULL,
    recommended_installments INTEGER NOT NULL,
    score INTEGER NOT NULL,
    factors JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INTEREST AND BUSINESS RULES (Phase 1)
-- ============================================

CREATE TABLE loan_interest_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    installments_min INTEGER NOT NULL,
    installments_max INTEGER NOT NULL,
    interest_rate DECIMAL(5,2) NOT NULL,
    interest_type VARCHAR(20) DEFAULT 'monthly', -- 'weekly' or 'monthly'
    late_fee_percentage DECIMAL(5,2) DEFAULT 0,
    late_interest_type VARCHAR(20) DEFAULT 'daily', -- 'daily' or 'monthly'
    late_interest_percentage DECIMAL(5,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT install_min_max CHECK (installments_min <= installments_max),
    CONSTRAINT positive_rate CHECK (interest_rate >= 0),
    CONSTRAINT positive_late_fee CHECK (late_fee_percentage >= 0),
    CONSTRAINT positive_late_interest CHECK (late_interest_percentage >= 0)
);

CREATE TABLE loan_rule_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loan_id UUID REFERENCES loans(id) ON DELETE CASCADE,
    rule_id UUID REFERENCES loan_interest_rules(id) ON DELETE SET NULL,
    principal_amount DECIMAL(15,2) NOT NULL,
    interest_rate DECIMAL(5,2) NOT NULL,
    interest_type VARCHAR(20) NOT NULL,
    installments_count INTEGER NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    late_fee_percentage DECIMAL(5,2),
    late_interest_type VARCHAR(20),
    late_interest_percentage DECIMAL(5,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for interest rules
CREATE INDEX idx_loan_interest_rules_tenant ON loan_interest_rules(tenant_id);
CREATE INDEX idx_loan_interest_rules_active ON loan_interest_rules(tenant_id, is_active);
CREATE INDEX idx_loan_interest_rules_installments ON loan_interest_rules(tenant_id, installments_min, installments_max);
CREATE INDEX idx_loan_rule_snapshots_loan ON loan_rule_snapshots(loan_id);

-- ============================================
-- AUDIT AND NOTIFICATIONS
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

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_interest_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_rule_snapshots ENABLE ROW LEVEL SECURITY;

-- Tenants can only see their own data
CREATE POLICY " tenants_select" ON tenants
    FOR ALL USING (true);

CREATE POLICY "users_tenant_isolation" ON users
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "customers_tenant_isolation" ON customers
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "loans_tenant_isolation" ON loans
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "loan_interest_rules_tenant_isolation" ON loan_interest_rules
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "loan_rule_snapshots_tenant_isolation" ON loan_rule_snapshots
    FOR ALL USING (
        loan_id IN (
            SELECT id FROM loans WHERE tenant_id = current_setting('app.current_tenant_id', true)::uuid
        )
    );

-- ============================================
-- INDEXES
-- ============================================

-- Customers indexes
CREATE INDEX idx_customers_tenant ON customers(tenant_id);
CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_customers_name ON customers USING gin(name gin_trgm_ops);
CREATE INDEX idx_customers_document ON customers(document);

-- Loans indexes
CREATE INDEX idx_loans_tenant ON loans(tenant_id);
CREATE INDEX idx_loans_customer ON loans(customer_id);
CREATE INDEX idx_loans_status ON loans(status);

-- Installments indexes
CREATE INDEX idx_installments_loan ON loan_installments(loan_id);
CREATE INDEX idx_installments_due_date ON loan_installments(due_date);
CREATE INDEX idx_installments_status ON loan_installments(status);

-- Payments indexes
CREATE INDEX idx_payment_transactions_loan ON payment_transactions(loan_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);

-- Audit indexes
CREATE INDEX idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- Global credit indexes
CREATE INDEX idx_global_identities_hash ON global_identities(hash);
CREATE INDEX idx_credit_score_history_profile ON credit_score_history(global_credit_profile_id);

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for tenants
CREATE TRIGGER update_tenants_updated_at
    BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger for users
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger for customers
CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger for loans
CREATE TRIGGER update_loans_updated_at
    BEFORE UPDATE ON loans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger for installments
CREATE TRIGGER update_installments_updated_at
    BEFORE UPDATE ON loan_installments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to update loan totals
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
    WHERE loan_id = NEW.loan_id;
    
    UPDATE loans
    SET paid_amount = paid,
        remaining_amount = remaining,
        paid_installments = paid_count,
        status = CASE 
            WHEN paid_count = (SELECT installments_count FROM loans WHERE id = NEW.loan_id) THEN 'paid'
            WHEN paid_count > 0 THEN 'active'
            ELSE status
        END
    WHERE id = NEW.loan_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_loan_after_installment
    AFTER INSERT OR UPDATE ON loan_installments
    FOR EACH ROW EXECUTE FUNCTION update_loan_totals();

-- Function to check and update overdue installments
CREATE OR REPLACE FUNCTION check_overdue_installments()
RETURNS void AS $$
BEGIN
    UPDATE loan_installments
    SET status = 'late'
    WHERE status = 'pending'
    AND due_date < CURRENT_DATE;
    
    UPDATE loans
    SET status = 'active'
    WHERE status = 'pending'
    AND EXISTS (
        SELECT 1 FROM loan_installments 
        WHERE loan_id = loans.id 
        AND status = 'late'
    );
END;
$$ LANGUAGE plpgsql;

-- Function to generate installments
CREATE OR REPLACE FUNCTION generate_installments(
    p_loan_id UUID,
    p_amount DECIMAL,
    p_installments INTEGER,
    p_first_due DATE,
    p_interest_rate DECIMAL
)
RETURNS void AS $$
DECLARE
    i INTEGER;
    installment_amount DECIMAL(15,2);
    due_date DATE;
    monthly_rate DECIMAL(5,4);
BEGIN
    monthly_rate := p_interest_rate / 100;
    
    IF p_interest_rate > 0 THEN
        installment_amount := (p_amount * monthly_rate * POWER(1 + monthly_rate, p_installments)) 
            / (POWER(1 + monthly_rate, p_installments) - 1);
    ELSE
        installment_amount := p_amount / p_installments;
    END IF;
    
    due_date := p_first_due;
    
    FOR i IN 1..p_installments LOOP
        INSERT INTO loan_installments (loan_id, installment_number, amount, due_date)
        VALUES (p_loan_id, i, installment_amount, due_date);
        
        due_date := due_date + INTERVAL '1 month';
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to hash CPF for global identity
CREATE OR REPLACE FUNCTION hash_cpf(p_cpf VARCHAR)
RETURNS VARCHAR AS $$
BEGIN
    RETURN encode(digest(p_cpf, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate interest rules overlap
CREATE OR REPLACE FUNCTION validate_interest_rules_overlap(
    p_tenant_id UUID,
    p_installments_min INTEGER,
    p_installments_max INTEGER,
    p_rule_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_overlap INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_overlap
    FROM loan_interest_rules
    WHERE tenant_id = p_tenant_id
      AND is_active = true
      AND id <> COALESCE(p_rule_id, '00000000-0000-0000-0000-000000000000')
      AND (
          (installments_min <= p_installments_max AND installments_max >= p_installments_min)
      );
    
    RETURN v_overlap = 0;
END;
$$ LANGUAGE plpgsql;

-- Function to get applicable interest rule
CREATE OR REPLACE FUNCTION get_applicable_interest_rule(
    p_tenant_id UUID,
    p_installments INTEGER
)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    interest_rate DECIMAL,
    interest_type VARCHAR,
    late_fee_percentage DECIMAL,
    late_interest_type VARCHAR,
    late_interest_percentage DECIMAL,
    priority INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id,
        r.name,
        r.interest_rate,
        r.interest_type,
        r.late_fee_percentage,
        r.late_interest_type,
        r.late_interest_percentage,
        r.priority
    FROM loan_interest_rules r
    WHERE r.tenant_id = p_tenant_id
      AND r.is_active = true
      AND p_installments >= r.installments_min 
      AND p_installments <= r.installments_max
    ORDER BY r.priority DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to create loan rule snapshot (immutability)
CREATE OR REPLACE FUNCTION create_loan_rule_snapshot(
    p_loan_id UUID,
    p_rule_id UUID,
    p_principal_amount DECIMAL,
    p_interest_rate DECIMAL,
    p_interest_type VARCHAR,
    p_installments_count INTEGER,
    p_total_amount DECIMAL,
    p_late_fee_percentage DECIMAL,
    p_late_interest_type VARCHAR,
    p_late_interest_percentage DECIMAL
)
RETURNS UUID AS $$
DECLARE
    v_snapshot_id UUID;
BEGIN
    INSERT INTO loan_rule_snapshots (
        loan_id,
        rule_id,
        principal_amount,
        interest_rate,
        interest_type,
        installments_count,
        total_amount,
        late_fee_percentage,
        late_interest_type,
        late_interest_percentage
    ) VALUES (
        p_loan_id,
        p_rule_id,
        p_principal_amount,
        p_interest_rate,
        p_interest_type,
        p_installments_count,
        p_total_amount,
        p_late_fee_percentage,
        p_late_interest_type,
        p_late_interest_percentage
    )
    RETURNING id INTO v_snapshot_id;
    
    RETURN v_snapshot_id;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate late fee
CREATE OR REPLACE FUNCTION calculate_late_fee(
    p_installment_amount DECIMAL,
    p_late_fee_percentage DECIMAL
)
RETURNS DECIMAL AS $$
BEGIN
    RETURN p_installment_amount * (p_late_fee_percentage / 100);
END;
$$ LANGUAGE plpgsql;

-- Function to calculate late interest
CREATE OR REPLACE FUNCTION calculate_late_interest(
    p_installment_amount DECIMAL,
    p_late_interest_percentage DECIMAL,
    p_late_interest_type VARCHAR,
    p_days_late INTEGER
)
RETURNS DECIMAL AS $$
DECLARE
    v_daily_rate DECIMAL;
    v_monthly_rate DECIMAL;
BEGIN
    IF p_late_interest_type = 'daily' THEN
        v_daily_rate := p_late_interest_percentage / 100 / 30;
        RETURN p_installment_amount * v_daily_rate * p_days_late;
    ELSE
        -- Monthly
        v_monthly_rate := p_late_interest_percentage / 100;
        RETURN p_installment_amount * v_monthly_rate * CEIL(p_days_late / 30.0);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate customer score
CREATE OR REPLACE FUNCTION calculate_customer_score(p_customer_id UUID)
RETURNS INTEGER AS $$
DECLARE
    total_loans INTEGER;
    paid_loans INTEGER;
    late_loans INTEGER;
    score INTEGER;
BEGIN
    SELECT COUNT(*), 
           COUNT(*) FILTER (WHERE status = 'paid'),
           COUNT(*) FILTER (WHERE status = 'late')
    INTO total_loans, paid_loans, late_loans
    FROM loans
    WHERE customer_id = p_customer_id;
    
    IF total_loans = 0 THEN
        RETURN 500;
    END IF;
    
    score := 300 + (paid_loans::DECIMAL / total_loans * 500) - (late_loans::DECIMAL / total_loans * 200);
    RETURN GREATEST(300, LEAST(1000, ROUND(score)));
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SEEDS
-- ============================================

-- Insert default tenant (demo)
INSERT INTO tenants (id, name, slug, plan, settings)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'Demo Empresa', 'demo', 'professional', '{"currency": "BRL", "timezone": "America/Sao_Paulo"}')
ON CONFLICT (slug) DO NOTHING;

-- Insert demo user
INSERT INTO users (id, tenant_id, email, name, role, password_hash)
VALUES 
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'demo@axioncred.com.br', 'Demo User', 'owner', crypt('demo123', gen_salt('bf')))
ON CONFLICT (email) DO NOTHING;

-- Insert default reminder settings for demo tenant
INSERT INTO reminder_settings (tenant_id, enabled, days_before, hours, methods)
VALUES 
    ('00000000-0000-0000-0000-000000000001', true, ARRAY[3, 1], ARRAY[9, 14, 18], ARRAY['whatsapp'])
ON CONFLICT (tenant_id) DO NOTHING;
