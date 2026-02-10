-- Add staking-related fields to users table
-- Run this migration to add staking support

ALTER TABLE users ADD COLUMN IF NOT EXISTS staking_balance DOUBLE PRECISION DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS staking_multiplier DOUBLE PRECISION DEFAULT 1.0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS staked_at TIMESTAMP;

-- Create index for efficient staking queries
CREATE INDEX IF NOT EXISTS idx_users_staking_balance ON users(staking_balance) WHERE staking_balance > 0;

-- Comment for documentation
COMMENT ON COLUMN users.staking_balance IS 'Amount of LRA tokens staked by user';
COMMENT ON COLUMN users.staking_multiplier IS 'Chat-to-Earn multiplier based on staking (base 1.0)';
COMMENT ON COLUMN users.staked_at IS 'Timestamp when user last staked tokens';
