# Mint Webhook Integration Guide

## Endpoint
- Method: `POST`
- URL: `https://lauraai-backend.fly.dev/api/mint/webhook/confirm`
- Content-Type: `application/json`

## Purpose
- Asynchronously confirm mint payment orders from an indexer/relayer callback.
- Move order state from `pending/failed` -> `verifying` -> `confirmed/failed`.

## Required Headers
- `X-Webhook-Id`: unique event id (idempotency key, must not repeat)
- `X-Webhook-Timestamp`: unix timestamp (seconds)
- `X-Webhook-Signature`: hex HMAC-SHA256 signature

If any header is missing, API returns `401`.

## Signature Algorithm
Sign the exact string:

`<timestamp>.<raw_body>`

Where:
- `timestamp` is `X-Webhook-Timestamp`
- `raw_body` is the exact request JSON string sent over the wire

HMAC:
- Algorithm: `HMAC-SHA256`
- Secret: `MINT_WEBHOOK_SECRET`
- Output: lowercase hex string (no `0x` prefix required)

## Payload Schema
Use either `order_id` or `order_no`, and always include `tx_hash`.

```json
{
  "order_id": 123,
  "tx_hash": "0xYOUR_REAL_TX_HASH"
}
```

or

```json
{
  "order_no": "MO-XXXXXXXX",
  "tx_hash": "0xYOUR_REAL_TX_HASH"
}
```

## Example (bash + curl)
```bash
WEBHOOK_URL="https://lauraai-backend.fly.dev/api/mint/webhook/confirm"
WEBHOOK_SECRET="REPLACE_WITH_YOUR_MINT_WEBHOOK_SECRET"

WEBHOOK_ID="mint-callback-$(date +%s)-001"
TS="$(date +%s)"
BODY='{"order_id":123,"tx_hash":"0xYOUR_REAL_TX_HASH"}'

SIG=$(printf "%s.%s" "$TS" "$BODY" \
  | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" -binary \
  | xxd -p -c 256)

curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Id: $WEBHOOK_ID" \
  -H "X-Webhook-Timestamp: $TS" \
  -H "X-Webhook-Signature: $SIG" \
  -d "$BODY"
```

## Response Behavior
- `200 + {"code":0,...}`: processed successfully
- `200 + {"code":0,"data":{"status":"ignored"}}`: duplicate `X-Webhook-Id` (replay blocked)
- `401`: missing/invalid auth headers, bad signature, or expired timestamp
- `404`: order not found
- `400`: invalid payload or tx verification failed

## Replay Protection
- Each `X-Webhook-Id` can only be accepted once.
- Duplicate event id is ignored (idempotent).
- Timestamp skew limit default: `300s` (`MINT_WEBHOOK_MAX_SKEW_SEC`).

## On-Chain Verification Performed
Webhook confirmation validates:
1. tx exists and is successful on-chain
2. sender matches order payer wallet
3. tx target/method matches mint tx expectations
4. metadata URI contains target character id
5. ERC20 `Transfer` log exists:
   - token = order token address
   - `from` = payer wallet
   - `to` = treasury wallet
   - amount = expected `token_amount_wei`

If any check fails, order becomes `failed`.

## Environment Variables
- `MINT_WEBHOOK_SECRET`: required for webhook auth
- `MINT_WEBHOOK_MAX_SKEW_SEC`: allowed timestamp drift (default `300`)
- `MINT_TREASURY_WALLET`: treasury address for FF receipt validation

## Recommended Retry Strategy
- Retry only on network/5xx errors.
- Do not retry on `401` (fix signing/clock first).
- For idempotent retries, reuse the same `X-Webhook-Id` and same body.

## Go-Live Checklist
- Set and store `MINT_WEBHOOK_SECRET` securely
- Ensure callback server clock is synced (NTP)
- Use stable unique event ids
- Verify one successful callback in staging and production
