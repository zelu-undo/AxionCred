-- ============================================
-- ÍNDICES PARA OTIMIZAÇÃO DE PERFORMANCE
-- ============================================

-- Users: índice para auth
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);

-- Customers: índices para listagem
CREATE INDEX IF NOT EXISTS idx_customers_tenant_id ON customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_name_gin ON customers USING gin(name gin_trgm_ops);

-- Loans: índices para consultas
CREATE INDEX IF NOT EXISTS idx_loans_tenant_id ON loans(tenant_id);
CREATE INDEX IF NOT EXISTS idx_loans_customer_id ON loans(customer_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
CREATE INDEX IF NOT EXISTS idx_loans_created_at ON loans(created_at DESC);

-- Loan installments: índices para cálculo
CREATE INDEX IF NOT EXISTS idx_loan_installments_loan_id ON loan_installments(loan_id);
CREATE INDEX IF NOT EXISTS idx_loan_installments_status ON loan_installments(status);
CREATE INDEX IF NOT EXISTS idx_loan_installments_due_date ON loan_installments(due_date);

-- Payments: índices
CREATE INDEX IF NOT EXISTS idx_payments_tenant_id ON payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_loan_id ON payments(loan_id);
CREATE INDEX IF NOT EXISTS idx_payments_installment_id ON payments(installment_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);

-- Interest rules: índices
CREATE INDEX IF NOT EXISTS idx_interest_rules_tenant_id ON interest_rules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_interest_rules_is_active ON interest_rules(is_active);

-- System config: índices
CREATE INDEX IF NOT EXISTS idx_system_config_tenant_id ON system_config(tenant_id);

-- Indexes for auth (RLS)
CREATE INDEX IF NOT EXISTS idx_customers_tenant_id_status ON customers(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_loans_tenant_id_status ON loans(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_loan_installments_loan_id_status ON loan_installments(loan_id, status);

-- Composite index for customer search
CREATE INDEX IF NOT EXISTS idx_customers_search ON customers(tenant_id, name, email, phone);
