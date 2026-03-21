-- ============================================
-- Migration: Add score weights columns
-- Run this in Supabase SQL Editor
-- ============================================

-- Add columns to credit_settings table if they don't exist
ALTER TABLE credit_settings 
ADD COLUMN IF NOT EXISTS score_payment_weight INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS score_time_weight INTEGER DEFAULT 25,
ADD COLUMN IF NOT EXISTS score_default_weight INTEGER DEFAULT 20,
ADD COLUMN IF NOT EXISTS score_usage_weight INTEGER DEFAULT 15,
ADD COLUMN IF NOT EXISTS score_stability_weight INTEGER DEFAULT 10;

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'credit_settings' 
AND column_name LIKE 'score_%';
