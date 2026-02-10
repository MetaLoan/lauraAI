-- Add marketplace-related fields to characters table
-- Run this migration to add market listing support

ALTER TABLE characters ADD COLUMN IF NOT EXISTS is_listed BOOLEAN DEFAULT FALSE;
ALTER TABLE characters ADD COLUMN IF NOT EXISTS list_price DOUBLE PRECISION DEFAULT 0;
ALTER TABLE characters ADD COLUMN IF NOT EXISTS listed_at TIMESTAMP;
ALTER TABLE characters ADD COLUMN IF NOT EXISTS on_chain_token_id BIGINT;

-- Create indexes for efficient marketplace queries
CREATE INDEX IF NOT EXISTS idx_characters_is_listed ON characters(is_listed) WHERE is_listed = TRUE;
CREATE INDEX IF NOT EXISTS idx_characters_list_price ON characters(list_price) WHERE is_listed = TRUE;
CREATE INDEX IF NOT EXISTS idx_characters_on_chain_token_id ON characters(on_chain_token_id) WHERE on_chain_token_id IS NOT NULL;

-- Comment for documentation
COMMENT ON COLUMN characters.is_listed IS 'Whether the character NFT is listed for sale on marketplace';
COMMENT ON COLUMN characters.list_price IS 'Listing price in BNB';
COMMENT ON COLUMN characters.listed_at IS 'Timestamp when the character was listed for sale';
COMMENT ON COLUMN characters.on_chain_token_id IS 'NFT Token ID on blockchain (if minted)';
