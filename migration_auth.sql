-- Migration to add auth_id to users table for Supabase Auth integration

-- Add auth_id column
ALTER TABLE users 
ADD COLUMN auth_id UUID UNIQUE;

-- Add index for performance on lookups
CREATE INDEX idx_users_auth_id ON users(auth_id);

-- Add index for email lookup (if not already present, useful for linking)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
