-- Add late_fee_type column to late_fee_config
-- Run this in Supabase SQL Editor

ALTER TABLE late_fee_config 
ADD COLUMN IF NOT EXISTS late_fee_type VARCHAR(20) DEFAULT 'fixed';