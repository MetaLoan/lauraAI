# ETH Mainnet Deploy Script

## 1) Prepare env file

```bash
cp scripts/env.mainnet.template scripts/.env.mainnet
```

Fill `scripts/.env.mainnet`:
- `PRIVATE_KEY` 或 `MNEMONIC`（二选一）
- `ETH_MAINNET_RPC_URL`
- `FF_TOKEN_ADDRESS`
- `MINT_TREASURY_WALLET`
- `MINT_PRICE_WEI` (default `1e18` for 1 FF)
- `DEPLOY_GAS_LIMIT` (optional, default `5000000`; useful when public RPC limits `eth_estimateGas`)

## 2) Run deploy

```bash
chmod +x scripts/deploy_eth_mainnet.sh
./scripts/deploy_eth_mainnet.sh
```

## 3) Apply printed follow-up commands

Script prints:
- `flyctl secrets set ...` for backend verification config
- `.env.local` append lines for frontend contract addresses

Run those commands directly.

## 4) Deploy backend/frontend

```bash
cd backend && flyctl deploy --remote-only
git push origin DESKTOP-BSC
git push lauradesktop DESKTOP-BSC
```

## Notes
- Script uses `contracts/scripts/deploy.js`.
- If `FF_TOKEN_ADDRESS` is provided in env, deploy script reuses that token and skips new token deployment.
- If `FF_TOKEN_ADDRESS` is empty, script deploys a fresh `SoulFaceToken`.
