-- Add new columns to late_fee_config table for new fields
-- Run this in Supabase SQL Editor

ALTER TABLE late_fee_config 
ADD COLUMN IF NOT EXISTS late_fee_charge_type VARCHAR(20) DEFAULT 'one_time',
ADD COLUMN IF NOT EXISTS late_interest_type VARCHAR(20) DEFAULT 'percentage',
ADD COLUMN IF NOT EXISTS late_interest_value DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS late_interest_charge_type VARCHAR(20) DEFAULT 'daily';

-- Update RLS policies if needed
ALTER TABLE late_fee_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their tenant's late fee config" ON late_fee_config;
DROP POLICY IF EXISTS "Users can insert their tenant's late fee config" ON late_fee_config;
DROP POLICY IF EXISTS "Users can update their tenant's late fee config" ON late_fee_config;

CREATE POLICY "Users can view their tenant's late fee config" ON late_fee_config FOR SELECT USING (true);
CREATE POLICY "Users can insert their tenant's late fee config" ON late_fee_config FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their tenant's late fee config" ON late_fee_config FOR UPDATE USING (true);
