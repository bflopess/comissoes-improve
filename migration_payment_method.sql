
-- Migration: Add payment_method to sales table
ALTER TABLE sales ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- Verify
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'sales' AND column_name = 'payment_method';
