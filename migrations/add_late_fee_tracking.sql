-- ============================================
-- Migration: Add late fee tracking columns to loan_installments
-- Run this in Supabase SQL Editor
-- ============================================

-- Add columns for tracking applied fees
ALTER TABLE loan_installments 
ADD COLUMN IF NOT EXISTS late_fee_applied DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS late_interest_applied DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS days_in_delay INTEGER DEFAULT 0;

-- Create index for efficient queries on late installments
CREATE INDEX IF NOT EXISTS idx_loan_installments_late_status 
ON loan_installments(status, due_date) 
WHERE status = 'late';

-- ============================================
-- Supabase Function: calculate_and_apply_daily_late_fees
-- This function should be called daily via cron
-- ============================================

CREATE OR REPLACE FUNCTION calculate_and_apply_daily_late_fees()
RETURNS void AS $$
DECLARE
    inst_record RECORD;
    config_record RECORD;
    days_late INTEGER;
    new_late_fee DECIMAL(15,2);
    new_late_interest DECIMAL(15,2);
    new_total DECIMAL(15,2);
    current_date DATE := CURRENT_DATE;
BEGIN
    -- Loop through all active late fee configurations
    FOR config_record IN 
        SELECT * FROM late_fee_config WHERE is_active = true
    LOOP
        -- Loop through late installments for this tenant
        FOR inst_record IN
            SELECT 
                li.id,
                li.amount,
                li.late_fee_applied,
                li.late_interest_applied,
                li.due_date,
                li.status
            FROM loan_installments li
            JOIN loans l ON li.loan_id = l.id
            WHERE l.tenant_id = config_record.tenant_id
              AND li.status = 'late'
              AND li.due_date < current_date
              AND (li.paid_amount IS NULL OR li.paid_amount < li.amount)
        LOOP
            -- Calculate days late
            days_late := EXTRACT(DAY FROM current_date - inst_record.due_date)::INTEGER;
            
            IF days_late <= 0 THEN
                CONTINUE;
            END IF;

            -- Calculate late fee (fixed, only first time)
            new_late_fee := inst_record.late_fee_applied;
            IF new_late_fee = 0 AND config_record.fixed_fee > 0 THEN
                new_late_fee := config_record.fixed_fee;
            END IF;

            -- Calculate daily interest (progressively)
            IF config_record.daily_interest > 0 THEN
                new_late_interest := inst_record.amount * config_record.daily_interest * days_late;
                
                -- Apply max rate limit
                IF config_record.max_interest_rate IS NOT NULL THEN
                    new_late_interest := LEAST(
                        new_late_interest,
                        inst_record.amount * config_record.max_interest_rate
                    );
                END IF;
            ELSE
                new_late_interest := inst_record.late_interest_applied;
            END IF;

            -- Calculate new total
            new_total := inst_record.amount + new_late_fee + new_late_interest;

            -- Update installment
            UPDATE loan_installments
            SET late_fee_applied = new_late_fee,
                late_interest_applied = new_late_interest,
                days_in_delay = days_late,
                amount = new_total,
                updated_at = NOW()
            WHERE id = inst_record.id;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Schedule daily execution in Supabase
-- Note: You need to enable pg_cron extension first
-- ============================================

-- Enable pg_cron (run once in Supabase SQL Editor)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily at 1:00 AM
-- SELECT cron.schedule(
--     'daily-late-fees',
--     '0 1 * * *',
--     'SELECT calculate_and_apply_daily_late_fees()'
-- );