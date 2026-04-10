-- Add late fee columns to loan_installments table
-- ============================================
-- This adds columns for storing applied late fees and interest on each installment

ALTER TABLE loan_installments
ADD COLUMN IF NOT EXISTS late_fee_applied DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS late_interest_applied DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS days_in_delay INTEGER DEFAULT 0;

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_installments_status_with_delay 
ON loan_installments(status, due_date);

-- ============================================
-- Function to calculate and update late fees for a loan
-- ============================================
CREATE OR REPLACE FUNCTION calculate_installment_late_fees(p_installment_id UUID)
RETURNS void AS $$
DECLARE
    v_due_date DATE;
    v_today DATE := CURRENT_DATE;
    v_days INTEGER;
    v_amount DECIMAL(15,2);
    v_fixed_fee DECIMAL(15,2) := 0;
    v_daily_interest DECIMAL(10,6) := 0;
    v_late_fee DECIMAL(15,2) := 0;
    v_late_interest DECIMAL(15,2) := 0;
    v_late_fee_config RECORD;
BEGIN
    -- Get installment details
    SELECT due_date, amount INTO v_due_date, v_amount
    FROM loan_installments
    WHERE id = p_installment_id;
    
    -- Skip if already paid or not yet due
    IF v_due_date >= v_today THEN
        RETURN;
    END IF;
    
    -- Calculate days overdue
    v_days := v_today - v_due_date;
    
    -- Get late fee config
    SELECT * INTO v_late_fee_config
    FROM late_fee_config
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF NOT FOUND THEN
        -- Default values if no config
        v_fixed_fee := 0;
        v_daily_interest := 0.002; -- 0.2% per day default
    ELSE
        v_fixed_fee := COALESCE(v_late_fee_config.fixed_fee, 0);
        v_daily_interest := COALESCE(v_late_fee_config.daily_interest, 0.002);
    END IF;
    
    -- Calculate late fee
    v_late_fee := v_fixed_fee;
    
    -- Calculate daily interest (compound formula)
    -- Interest = Principal * ((1 + rate)^days - 1)
    v_late_interest := v_amount * ((POWER(1 + v_daily_interest, v_days) - 1));
    
    -- Update the installment
    UPDATE loan_installments
    SET late_fee_applied = v_late_fee,
        late_interest_applied = v_late_interest,
        days_in_delay = v_days,
        amount = v_amount + v_late_fee + v_late_interest
    WHERE id = p_installment_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Function to check and update all overdue installments
-- ============================================
CREATE OR REPLACE FUNCTION check_overdue_installments()
RETURNS void AS $$
BEGIN
    -- Update overdue status
    UPDATE loan_installments
    SET status = 'late'
    WHERE status = 'pending'
    AND due_date < CURRENT_DATE;
    
    -- Calculate late fees for newly late installments
    PERFORM calculate_installment_late_fees(id)
    FROM loan_installments
    WHERE status = 'late'
    AND due_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Function to update loan status from late installments
-- ============================================
CREATE OR REPLACE FUNCTION update_loan_status_from_late_installments()
RETURNS void AS $$
BEGIN
    UPDATE loans
    SET status = 'late'
    WHERE status IN ('pending', 'active')
    AND EXISTS (
        SELECT 1 FROM loan_installments 
        WHERE loan_id = loans.id 
        AND status = 'late'
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Grant permissions
-- ============================================
GRANT EXECUTE ON FUNCTION calculate_installment_late_fees TO authenticated;
GRANT EXECUTE ON FUNCTION check_overdue_installments TO authenticated;
GRANT EXECUTE ON FUNCTION update_loan_status_from_late_installments TO authenticated;