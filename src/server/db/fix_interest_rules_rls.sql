-- =====================================================
-- FIX RLS POLICIES FOR interest_rules TABLE
-- Run this in Supabase SQL Editor
-- =====================================================

-- First, check if RLS is enabled and drop existing policies
ALTER TABLE interest_rules ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their tenant's interest rules" ON interest_rules;
DROP POLICY IF EXISTS "Users can insert their tenant's interest rules" ON interest_rules;
DROP POLICY IF EXISTS "Users can update their tenant's interest rules" ON interest_rules;
DROP POLICY IF EXISTS "Users can delete their tenant's interest rules" ON interest_rules;

-- Create SELECT policy - allow users to read their tenant's rules
CREATE POLICY "Users can view their tenant's interest rules" ON interest_rules
  FOR SELECT
  USING (tenant_id IN (
    SELECT tenant_id FROM users WHERE id = auth.uid()
  ));

-- Create INSERT policy - allow users to insert for their tenant
CREATE POLICY "Users can insert their tenant's interest rules" ON interest_rules
  FOR INSERT
  WITH CHECK (tenant_id IN (
    SELECT tenant_id FROM users WHERE id = auth.uid()
  ));

-- Create UPDATE policy - allow users to update their tenant's rules
CREATE POLICY "Users can update their tenant's interest rules" ON interest_rules
  FOR UPDATE
  USING (tenant_id IN (
    SELECT tenant_id FROM users WHERE id = auth.uid()
  ));

-- Create DELETE policy - allow users to delete their tenant's rules
CREATE POLICY "Users can delete their tenant's interest rules" ON interest_rules
  FOR DELETE
  USING (tenant_id IN (
    SELECT tenant_id FROM users WHERE id = auth.uid()
  ));

-- =====================================================
-- ALSO FIX late_fee_config TABLE (if needed)
-- =====================================================

ALTER TABLE late_fee_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their tenant's late fee config" ON late_fee_config;
DROP POLICY IF EXISTS "Users can insert their tenant's late fee config" ON late_fee_config;
DROP POLICY IF EXISTS "Users can update their tenant's late fee config" ON late_fee_config;

CREATE POLICY "Users can view their tenant's late fee config" ON late_fee_config
  FOR SELECT
  USING (tenant_id IN (
    SELECT tenant_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Users can insert their tenant's late fee config" ON late_fee_config
  FOR INSERT
  WITH CHECK (tenant_id IN (
    SELECT tenant_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update their tenant's late fee config" ON late_fee_config
  FOR UPDATE
  USING (tenant_id IN (
    SELECT tenant_id FROM users WHERE id = auth.uid()
  ));

-- =====================================================
-- ALTERNATIVE: If users table doesn't have tenant_id linked to auth.uid()
-- Use a simpler policy based on user_metadata
-- =====================================================

-- Run this instead if the above doesn't work:
/*
-- For interest_rules
DROP POLICY IF EXISTS "Users can view their tenant's interest rules" ON interest_rules;
DROP POLICY IF EXISTS "Users can insert their tenant's interest rules" ON interest_rules;
DROP POLICY IF EXISTS "Users can update their tenant's interest rules" ON interest_rules;
DROP POLICY IF EXISTS "Users can delete their tenant's interest rules" ON interest_rules;

CREATE POLICY "Users can view their tenant's interest rules" ON interest_rules
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their tenant's interest rules" ON interest_rules
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their tenant's interest rules" ON interest_rules
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete their tenant's interest rules" ON interest_rules
  FOR DELETE USING (true);
*/
