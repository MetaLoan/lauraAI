#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPT_DIR="$ROOT_DIR/scripts"
CONTRACTS_DIR="$ROOT_DIR/contracts"

ENV_FILE="${1:-$SCRIPT_DIR/.env.mainnet}"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing env file: $ENV_FILE"
  echo "Create it from template:"
  echo "  cp scripts/env.mainnet.template scripts/.env.mainnet"
  exit 1
fi

# shellcheck source=/dev/null
source "$ENV_FILE"

required_vars=(
  ETH_MAINNET_RPC_URL
  FF_TOKEN_ADDRESS
  MINT_TREASURY_WALLET
  MINT_PRICE_WEI
)

for v in "${required_vars[@]}"; do
  if [[ -z "${!v:-}" ]]; then
    echo "Missing required variable: $v"
    exit 1
  fi
done

if [[ -z "${PRIVATE_KEY:-}" && -z "${MNEMONIC:-}" ]]; then
  echo "Missing signer credentials: set PRIVATE_KEY or MNEMONIC"
  exit 1
fi

echo "==> Deploying LauraAISoulmate to Ethereum mainnet"
echo "    RPC: $ETH_MAINNET_RPC_URL"
echo "    FF token: $FF_TOKEN_ADDRESS"
echo "    Treasury: $MINT_TREASURY_WALLET"
echo "    Mint price (wei): $MINT_PRICE_WEI"

pushd "$CONTRACTS_DIR" >/dev/null
export PRIVATE_KEY="${PRIVATE_KEY:-}"
export MNEMONIC="${MNEMONIC:-}"
export ETH_MAINNET_RPC_URL
export MINT_TREASURY_WALLET
export MINT_PRICE_WEI

DEPLOY_LOG="$(mktemp)"
npx hardhat run scripts/deploy.js --network ethmainnet | tee "$DEPLOY_LOG"
popd >/dev/null

extract_addr() {
  local label="$1"
  local file="$2"
  grep -E "${label}" "$file" | tail -n1 | awk '{print $NF}'
}

TOKEN_ADDR="$(extract_addr "LauraAIToken deployed to:" "$DEPLOY_LOG")"
SOULMATE_ADDR="$(extract_addr "LauraAISoulmate deployed to:" "$DEPLOY_LOG")"
MARKET_ADDR="$(extract_addr "LauraAIMarketplace deployed to:" "$DEPLOY_LOG")"
STAKING_ADDR="$(extract_addr "LauraAIStaking deployed to:" "$DEPLOY_LOG")"

if [[ -z "${SOULMATE_ADDR:-}" ]]; then
  echo "Failed to parse deployed soulmate contract address."
  echo "Check deploy log at: $DEPLOY_LOG"
  exit 1
fi

echo
echo "==> Deploy done"
echo "FF token (deployed by script): ${TOKEN_ADDR:-<not parsed>}"
echo "Soulmate NFT: $SOULMATE_ADDR"
echo "Marketplace: ${MARKET_ADDR:-<not parsed>}"
echo "Staking: ${STAKING_ADDR:-<not parsed>}"

echo
echo "==> Next commands (copy/paste):"
echo "flyctl secrets set -a ${FLY_APP:-lauraai-backend} \\"
echo "  MINT_CONTRACT_ADDRESS=$SOULMATE_ADDR \\"
echo "  MINT_EXPECTED_CHAIN_ID=1 \\"
echo "  CHAIN_RPC_URL=$ETH_MAINNET_RPC_URL \\"
echo "  MINT_TREASURY_WALLET=$MINT_TREASURY_WALLET"
echo
echo "echo \"NEXT_PUBLIC_LAURA_AI_SOULMATE_ADDRESS=$SOULMATE_ADDR\" >> .env.local"
echo "echo \"NEXT_PUBLIC_FF_TOKEN_ADDRESS=$FF_TOKEN_ADDRESS\" >> .env.local"
echo
echo "Done. Keep deploy log: $DEPLOY_LOG"
