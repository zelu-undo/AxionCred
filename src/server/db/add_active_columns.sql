-- Add is_active column to tenants
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update existing tenants to be active
UPDATE tenants SET is_active = true WHERE is_active IS NULL;

-- Add comment
COMMENT ON COLUMN tenants.is_active IS 'Whether the tenant is active. Inactive tenants cannot be accessed';

-- Verify the column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tenants' AND column_name = 'is_active';