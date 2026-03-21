-- ============================================
-- RLS POLICIES FIX - Security Enhancement
-- ============================================

-- Drop weak policies first
DROP POLICY IF EXISTS "Users can view their tenant's late fee config" ON late_fee_config;
DROP POLICY IF EXISTS "Users can insert their tenant's late fee config" ON late_fee_config;
DROP POLICY IF EXISTS "Users can update their tenant's late fee config" ON late_fee_config;

-- Late Fee Config - Proper tenant isolation
CREATE POLICY "late_fee_config_tenant_isolation_select" ON late_fee_config
  FOR SELECT USING (tenant_id = (
    SELECT tenant_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "late_fee_config_tenant_isolation_insert" ON late_fee_config
  FOR INSERT WITH CHECK (tenant_id = (
    SELECT tenant_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "late_fee_config_tenant_isolation_update" ON late_fee_config
  FOR UPDATE USING (tenant_id = (
    SELECT tenant_id FROM users WHERE id = auth.uid()
  ));

-- Interest Rules - Proper tenant isolation  
DROP POLICY IF EXISTS "Users can view their tenant's interest rules" ON interest_rules;
DROP POLICY IF EXISTS "Users can insert their tenant's interest rules" ON interest_rules;
DROP POLICY IF EXISTS "Users can update their tenant's interest rules" ON interest_rules;
DROP POLICY IF EXISTS "Users can delete their tenant's interest rules" ON interest_rules;

CREATE POLICY "interest_rules_tenant_isolation_select" ON interest_rules
  FOR SELECT USING (tenant_id = (
    SELECT tenant_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "interest_rules_tenant_isolation_insert" ON interest_rules
  FOR INSERT WITH CHECK (tenant_id = (
    SELECT tenant_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "interest_rules_tenant_isolation_update" ON interest_rules
  FOR UPDATE USING (tenant_id = (
    SELECT tenant_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "interest_rules_tenant_isolation_delete" ON interest_rules
  FOR DELETE USING (tenant_id = (
    SELECT tenant_id FROM users WHERE id = auth.uid()
  ));

-- ============================================
-- ADD MISSING INDEXES
-- ============================================

-- Customer events index
CREATE INDEX IF NOT EXISTS idx_customer_events_customer_id 
  ON customer_events(customer_id);

-- Consent logs index
CREATE INDEX IF NOT EXISTS idx_consent_logs_customer_id 
  ON consent_logs(customer_id);

-- Composite index for installments overdue queries
CREATE INDEX IF NOT EXISTS idx_loan_installments_status_due_date 
  ON loan_installments(status, due_date);

-- Payment proofs index
CREATE INDEX IF NOT EXISTS idx_payment_proofs_loan_id 
  ON payment_proofs(loan_id);

-- Tenant settings index
CREATE INDEX IF NOT EXISTS idx_tenant_settings_tenant_id 
  ON tenant_settings(tenant_id);

-- ============================================
-- ADD CONSTRAINTS
-- ============================================

-- Ensure paid_amount cannot exceed amount
ALTER TABLE loan_installments 
  ADD CONSTRAINT chk_paid_amount 
  CHECK (paid_amount <= amount);

-- Ensure installments_count is positive
ALTER TABLE loans 
  ADD CONSTRAINT chk_installments_count_positive 
  CHECK (installments_count > 0);

-- Ensure principal_amount is positive
ALTER TABLE loans 
  ADD CONSTRAINT chk_principal_amount_positive 
  CHECK (principal_amount > 0);
