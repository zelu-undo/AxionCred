-- ============================================
-- AXION Cred - Audit Logs Triggers
-- Automatic audit trail for all major operations
-- ============================================

-- ============================================
-- Tabela de Audit Logs (verificar/colunas)
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'audit_logs' AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE audit_logs ADD COLUMN tenant_id UUID;
    END IF;
END $$;

-- ============================================
-- Função de auditoria genérica
-- ============================================

CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
  v_tenant_id UUID;
  v_user_id UUID;
BEGIN
  v_user_id := NULL;
  BEGIN
    v_user_id := current_setting('app.current_user_id', true)::uuid;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  -- Try to get tenant_id - will be NULL if not found
  IF TG_TABLE_NAME = 'customers' THEN
    v_tenant_id := NEW.tenant_id;
  ELSIF TG_TABLE_NAME = 'loans' THEN
    v_tenant_id := NEW.tenant_id;
  ELSIF TG_TABLE_NAME = 'loan_installments' THEN
    v_tenant_id := NEW.tenant_id;
  ELSIF TG_TABLE_NAME = 'payment_transactions' THEN
    v_tenant_id := NEW.tenant_id;
  ELSIF TG_TABLE_NAME = 'tenants' THEN
    v_tenant_id := NEW.id;
  ELSE
    v_tenant_id := NULL;
  END IF;
  
  INSERT INTO audit_logs (
    tenant_id,
    user_id,
    entity_type,
    entity_id,
    action,
    old_values,
    new_values,
    ip_address,
    created_at
  ) VALUES (
    v_tenant_id,
    v_user_id,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP = 'DELETE' THEN to_json(ROW(OLD.*)) ELSE NULL END,
    CASE WHEN TG_OP != 'DELETE' THEN to_json(ROW(NEW.*)) ELSE NULL END,
    NULL,
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Triggers de auditoria
-- ============================================

DROP TRIGGER IF EXISTS audit_customers ON customers;
CREATE TRIGGER audit_customers
AFTER UPDATE OR DELETE ON customers
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS audit_loans ON loans;
CREATE TRIGGER audit_loans
AFTER UPDATE OR DELETE ON loans
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS audit_loan_installments ON loan_installments;
CREATE TRIGGER audit_loan_installments
AFTER UPDATE OR DELETE ON loan_installments
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS audit_users ON users;
CREATE TRIGGER audit_users
AFTER UPDATE OR DELETE ON users
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS audit_payment_transactions ON payment_transactions;
CREATE TRIGGER audit_payment_transactions
AFTER INSERT OR UPDATE OR DELETE ON payment_transactions
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- ============================================
-- Notificações automáticas (simplificado)
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'type'
    ) THEN
        ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type VARCHAR(50);
        ALTER TABLE notifications ADD COLUMN IF NOT EXISTS title VARCHAR(255);
        ALTER TABLE notifications ADD COLUMN IF NOT EXISTS message TEXT;
        ALTER TABLE notifications ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}';
    END IF;
END $$;

CREATE OR REPLACE FUNCTION notification_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
  v_tenant_id UUID;
  v_notification_type TEXT;
  v_title TEXT;
  v_message TEXT;
BEGIN
  v_tenant_id := NEW.tenant_id;
  
  IF TG_TABLE_NAME = 'loan_installments' AND TG_OP = 'UPDATE' THEN
    IF OLD.status != 'paid' AND NEW.status = 'paid' THEN
      v_notification_type := 'payment_received';
      v_title := 'Pagamento Recebido';
      v_message := 'Uma parcela foi marcada como paga.';
    ELSIF OLD.status = 'pending' AND NEW.status = 'late' THEN
      v_notification_type := 'payment_overdue';
      v_title := 'Parcela Atrasada';
      v_message := 'Uma parcela entrou em atraso.';
    END IF;
  ELSIF TG_TABLE_NAME = 'loans' AND TG_OP = 'INSERT' THEN
    v_notification_type := 'loan_created';
    v_title := 'Novo Empréstimo';
    v_message := 'Um novo empréstimo foi criado.';
  ELSIF TG_TABLE_NAME = 'loans' AND TG_OP = 'UPDATE' AND NEW.status = 'paid' AND OLD.status != 'paid' THEN
    v_notification_type := 'loan_paid_off';
    v_title := 'Empréstimo Quitado';
    v_message := 'Um empréstimo foi quitado completamente.';
  END IF;
  
  IF v_notification_type IS NOT NULL AND v_tenant_id IS NOT NULL THEN
    INSERT INTO notifications (tenant_id, type, title, message, read, created_at)
    VALUES (v_tenant_id, v_notification_type, v_title, v_message, false, NOW());
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers de notificação
DROP TRIGGER IF EXISTS notify_installments ON loan_installments;
CREATE TRIGGER notify_installments
AFTER UPDATE ON loan_installments
FOR EACH ROW EXECUTE FUNCTION notification_trigger_function();

DROP TRIGGER IF EXISTS notify_loans ON loans;
CREATE TRIGGER notify_loans
AFTER INSERT ON loans
FOR EACH ROW EXECUTE FUNCTION notification_trigger_function();

DROP TRIGGER IF EXISTS notify_loans_update ON loans;
CREATE TRIGGER notify_loans_update
AFTER UPDATE ON loans
FOR EACH ROW EXECUTE FUNCTION notification_trigger_function();