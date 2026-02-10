-- Add points and lra_balance columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS points BIGINT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS lra_balance DOUBLE PRECISION DEFAULT 0;

-- Update existing users to have default values
UPDATE users SET points = 0 WHERE points IS NULL;
UPDATE users SET lra_balance = 0 WHERE lra_balance IS NULL;
