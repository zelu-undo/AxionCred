-- Fix RLS for loan_installments - Run in Supabase SQL Editor
-- Just drop and recreate

DROP POLICY IF EXISTS "loan_installments_full_access" ON loan_installments;
DROP POLICY IF EXISTS "loan_installments_authenticated" ON loan_installments;

CREATE POLICY "loan_installments_full_access" ON loan_installments
    FOR ALL 
    WITH CHECK (
        EXISTS (SELECT 1 FROM loans WHERE loans.id = loan_installments.loan_id)
    );
