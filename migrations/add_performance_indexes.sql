-- ============================================
-- AXION Cred - Database Indexes
-- Performance optimization indexes
-- ============================================

-- Primeiro, garantir que as colunas necessárias existam
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- ============================================
-- Indexes para Customers
-- ============================================

-- Index para busca por nome (acentos ignorados)
CREATE INDEX IF NOT EXISTS idx_customers_name_gin 
ON customers USING gin(name_normalized gin_trgm_ops);

-- Index para busca por documento
CREATE INDEX IF NOT EXISTS idx_customers_document 
ON customers(document) WHERE document IS NOT NULL;

-- Index para status
CREATE INDEX IF NOT EXISTS idx_customers_status 
ON customers(status);

-- Index para tenant isolation
CREATE INDEX IF NOT EXISTS idx_customers_tenant 
ON customers(tenant_id);

-- Composite index para buscas frequentes
CREATE INDEX IF NOT EXISTS idx_customers_tenant_status 
ON customers(tenant_id, status);

-- ============================================
-- Indexes para Loans
-- ============================================

-- Index para busca por customer
CREATE INDEX IF NOT EXISTS idx_loans_customer 
ON loans(customer_id);

-- Index para status
CREATE INDEX IF NOT EXISTS idx_loans_status 
ON loans(status);

-- Index para tenant isolation
CREATE INDEX IF NOT EXISTS idx_loans_tenant 
ON loans(tenant_id);

-- Index para datas (para relatórios)
CREATE INDEX IF NOT EXISTS idx_loans_created_at 
ON loans(created_at DESC);

-- Composite index para relatórios financeiros
CREATE INDEX IF NOT EXISTS idx_loans_tenant_status 
ON loans(tenant_id, status) WHERE status = 'active';

-- ============================================
-- Indexes para Installments
-- ============================================

-- Index para busca por loan
CREATE INDEX IF NOT EXISTS idx_installments_loan 
ON loan_installments(loan_id);

-- Index para status
CREATE INDEX IF NOT EXISTS idx_installments_status 
ON loan_installments(status);

-- Index para data de vencimento (muito usado em relatórios)
CREATE INDEX IF NOT EXISTS idx_installments_due_date 
ON loan_installments(due_date);

-- Index para tenant
CREATE INDEX IF NOT EXISTS idx_installments_tenant 
ON loan_installments(tenant_id);

-- Composite para cobranças - parcelas atrasadas
CREATE INDEX IF NOT EXISTS idx_installments_tenant_status_due
ON loan_installments(tenant_id, status, due_date) 
WHERE status IN ('pending', 'late');

-- ============================================
-- Indexes para Payments
-- ============================================

-- Index para data de pagamento
CREATE INDEX IF NOT EXISTS idx_payments_date 
ON payment_transactions(payment_date);

-- Index para status
CREATE INDEX IF NOT EXISTS idx_payments_status 
ON payment_transactions(status);

-- Index para tenant
CREATE INDEX IF NOT EXISTS idx_payments_tenant 
ON payment_transactions(tenant_id);

-- ============================================
-- Indexes para Users
-- ============================================

-- Index para tenant
CREATE INDEX IF NOT EXISTS idx_users_tenant 
ON users(tenant_id);

-- Index para email
CREATE INDEX IF NOT EXISTS idx_users_email 
ON users(email);

-- ============================================
-- Indexes para Notifications
-- ============================================

-- Index para buscas por usuário
CREATE INDEX IF NOT EXISTS idx_notifications_user 
ON notifications(user_id);

-- Index para não lidas
CREATE INDEX IF NOT EXISTS idx_notifications_unread 
ON notifications(user_id, is_read) WHERE is_read = false;

-- Index para tenant
CREATE INDEX IF NOT EXISTS idx_notifications_tenant 
ON notifications(tenant_id);

-- ============================================
-- Indexes para Audit Logs
-- ============================================

-- Index para entidade
CREATE INDEX IF NOT EXISTS idx_audit_entity 
ON audit_logs(entity_type, entity_id);

-- Index para usuário
CREATE INDEX IF NOT EXISTS idx_audit_user 
ON audit_logs(user_id);

-- Index para data
CREATE INDEX IF NOT EXISTS idx_audit_created 
ON audit_logs(created_at DESC);

-- Index para tenant
CREATE INDEX IF NOT EXISTS idx_audit_tenant 
ON audit_logs(tenant_id);

-- ============================================
-- Indexes para Fiadores
-- ============================================

-- Index para tenant
CREATE INDEX IF NOT EXISTS idx_guarantors_tenant 
ON guarantors(tenant_id);

-- Index para documento
CREATE INDEX IF NOT EXISTS idx_guarantors_document 
ON guarantors(document);

-- Index para status
CREATE INDEX IF NOT EXISTS idx_guarantors_status 
ON guarantors(status);

-- ============================================
-- Indexes para Renegociações
-- ============================================

-- Index para tenant
CREATE INDEX IF NOT EXISTS idx_renegotiations_tenant 
ON loan_renegotiations(tenant_id);

-- Index para status
CREATE INDEX IF NOT EXISTS idx_renegotiations_status 
ON loan_renegotiations(status);

-- Index para loan
CREATE INDEX IF NOT EXISTS idx_renegotiations_loan 
ON loan_renegotiations(loan_id);

-- ============================================
-- Funções de análise de queries (opcional)
-- ============================================

-- Habilitar contagem de estatísticas
ALTER TABLE customers ALTER COLUMN name SET STATISTICS 100;
ALTER TABLE loans ALTER COLUMN created_at SET STATISTICS 100;
ALTER TABLE loan_installments ALTER COLUMN due_date SET STATISTICS 100;

-- Comment explaining indexes
COMMENT ON INDEX idx_customers_name_gin IS 'Gin index for full-text search on customer names';
COMMENT ON INDEX idx_installments_due_date IS 'Index for date-based reporting on installments';
COMMENT ON INDEX idx_payments_date IS 'Index for cash flow reports by payment date';