-- ============================================
-- AXION Cred - Audit Logs Triggers
-- Automatic audit trail for all major operations
-- ============================================

-- ============================================
-- Função de auditoria genérica
-- ============================================

CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  -- Skip if it's an insert (old values would be null)
  IF TG_OP = 'INSERT' THEN
    RETURN NEW;
  END IF;
  
  -- Skip system tables
  IF TG_TABLE_NAME IN ('audit_logs', 'notifications', 'spatial_ref_sys') THEN
    RETURN NEW;
  END IF;
  
  -- Insert audit log
  INSERT INTO audit_logs (
    tenant_id,
    user_id,
    entity_type,
    entity_id,
    action,
    old_values,
    new_values,
    ip_address,
    user_agent,
    created_at
  ) VALUES (
    COALESCE(NEW.tenant_id, (SELECT tenant_id FROM users WHERE id = current_setting('app.current_user_id', true)::uuid)),
    current_setting('app.current_user_id', true)::uuid,
    TG_TABLE_NAME,
    NEW.id,
    TG_OP,
    to_json(ROW(OLD.*)),
    to_json(ROW(NEW.*)),
    current_setting('app.current_ip', true),
    current_setting('app.current_user_agent', true),
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Triggers de auditoria por tabela
-- ============================================

-- Customers audit
CREATE TRIGGER audit_customers
AFTER UPDATE OR DELETE ON customers
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Loans audit
CREATE TRIGGER audit_loans
AFTER UPDATE OR DELETE ON loans
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Loan Installments audit
CREATE TRIGGER audit_loan_installments
AFTER UPDATE OR DELETE ON loan_installments
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Users audit
CREATE TRIGGER audit_users
AFTER UPDATE OR DELETE ON users
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Payment Transactions audit
CREATE TRIGGER audit_payment_transactions
AFTER INSERT OR UPDATE OR DELETE ON payment_transactions
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- ============================================
-- Função para notificação automática
-- ============================================

CREATE OR REPLACE FUNCTION notification_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
  v_tenant_id UUID;
  v_user_id UUID;
  v_notification_type TEXT;
  v_title TEXT;
  v_message TEXT;
BEGIN
  -- Get tenant ID
  v_tenant_id := COALESCE(
    NEW.tenant_id,
    (SELECT tenant_id FROM users WHERE id = current_setting('app.current_user_id', true)::uuid)
  );
  
  -- Get user ID (created by)
  v_user_id := current_setting('app.current_user_id', true)::uuid;
  
  -- Determine notification type based on table and operation
  IF TG_TABLE_NAME = 'loan_installments' AND TG_OP = 'UPDATE' THEN
    -- Check for payment (paid_amount changed)
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
  ELSIF TG_TABLE_NAME = 'loan_renegotiations' AND TG_OP = 'INSERT' THEN
    v_notification_type := 'renegotiation_created';
    v_title := 'Nova Renegociação';
    v_message := 'Uma nova renegociação foi solicitada.';
  ELSIF TG_TABLE_NAME = 'loan_renegotiations' AND TG_OP = 'UPDATE' AND NEW.status = 'approved' THEN
    v_notification_type := 'renegotiation_approved';
    v_title := 'Renegociação Aprovada';
    v_message := 'Uma renegociação foi aprovada.';
  ELSIF TG_TABLE_NAME = 'loan_renegotiations' AND TG_OP = 'UPDATE' AND NEW.status = 'rejected' THEN
    v_notification_type := 'renegotiation_rejected';
    v_title := 'Renegociação Rejeitada';
    v_message := 'Uma renegociação foi rejeitada.';
  END IF;
  
  -- Insert notification if type was determined
  IF v_notification_type IS NOT NULL THEN
    INSERT INTO notifications (
      tenant_id,
      user_id,
      type,
      title,
      message,
      read,
      priority,
      created_at
    ) VALUES (
      v_tenant_id,
      v_user_id,
      v_notification_type,
      v_title,
      v_message,
      false,
      'medium',
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Triggers de notificação por tabela
-- ============================================

-- Installments notifications
CREATE TRIGGER notify_installments
AFTER UPDATE ON loan_installments
FOR EACH ROW EXECUTE FUNCTION notification_trigger_function();

-- Loans notifications
CREATE TRIGGER notify_loans
AFTER INSERT OR UPDATE ON loans
FOR EACH ROW EXECUTE FUNCTION notification_trigger_function();

-- Renegotiations notifications
CREATE TRIGGER notify_renegotiations
AFTER INSERT OR UPDATE ON loan_renegotiations
FOR EACH ROW EXECUTE FUNCTION notification_trigger_function();

-- ============================================
-- Função de lembrete automático
-- ============================================

CREATE OR REPLACE FUNCTION reminder_check_function()
RETURNS TABLE (
  customer_id UUID,
  installment_id UUID,
  days_until_due INTEGER,
  amount DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.customer_id,
    i.id,
    (i.due_date - CURRENT_DATE)::INTEGER as days_until_due,
    i.amount
  FROM loan_installments i
  JOIN loans l ON l.id = i.loan_id
  WHERE 
    i.status = 'pending'
    AND (i.due_date - CURRENT_DATE) IN (3, 1)  -- 3 days before and 1 day before
    AND l.tenant_id = current_setting('app.current_tenant_id', true)::uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Job para lembretes automáticos (daily)
-- ============================================

CREATE OR REPLACE FUNCTION daily_reminder_job()
RETURNS void AS $$
DECLARE
  v_reminder RECORD;
BEGIN
  -- Create reminders for installments due in 3 days
  FOR v_reminder IN
    SELECT 
      l.customer_id,
      l.tenant_id,
      i.id as installment_id,
      i.amount,
      c.name as customer_name
    FROM loan_installments i
    JOIN loans l ON l.id = i.loan_id
    JOIN customers c ON c.id = l.customer_id
    WHERE 
      i.status = 'pending'
      AND i.due_date = CURRENT_DATE + INTERVAL '3 days'
  LOOP
    INSERT INTO notifications (
      tenant_id,
      user_id,
      type,
      title,
      message,
      read,
      priority,
      created_at
    ) VALUES (
      v_reminder.tenant_id,
      v_reminder.customer_id,
      'reminder_sent',
      'Lembrete de Pagamento',
      format('Olá %s, sua parcela de R$ %s vence em 3 dias.', v_reminder.customer_name, v_reminder.amount),
      false,
      'low',
      NOW()
    );
  END LOOP;
  
  -- Create alerts for overdue installments
  FOR v_reminder IN
    SELECT 
      l.customer_id,
      l.tenant_id,
      i.id as installment_id,
      i.amount,
      c.name as customer_name,
      (CURRENT_DATE - i.due_date)::INTEGER as days_late
    FROM loan_installments i
    JOIN loans l ON l.id = i.loan_id
    JOIN customers c ON c.id = l.customer_id
    WHERE 
      i.status = 'late'
      AND (CURRENT_DATE - i.due_date) = 1  -- Just became late
  LOOP
    INSERT INTO notifications (
      tenant_id,
      user_id,
      type,
      title,
      message,
      read,
      priority,
      created_at
    ) VALUES (
      v_reminder.tenant_id,
      v_reminder.customer_id,
      'payment_overdue',
      'Parcela Atrasada',
      format('Olá %s, sua parcela de R$ %s está atrasada há %s dias.', v_reminder.customer_name, v_reminder.amount, v_reminder.days_late),
      false,
      'high',
      NOW()
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;