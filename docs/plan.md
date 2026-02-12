# Mint/Image Closed-Loop Refactor Plan

## Goal
- Build a robust end-to-end flow for both normal roles and `mini_me`.
- Make UI/UX consistent when user leaves midway and comes back.
- Ensure paid-but-not-finished roles are always visible in Mint AI list with actionable states.

## Target Product Flow
1. User selects role in Mint AI page.
2. Backend creates/reuses character.
3. Backend creates/reuses mint order.
4. Frontend asks wallet for on-chain payment + mint transaction.
5. Backend verifies tx asynchronously and updates order state.
6. After order is `confirmed`, frontend/backend starts image generation.
7. Image generation finishes (`done`) or fails (`failed`) with retry path.

## Unified State Model
- Payment state (`mint_orders.status`): `pending` | `verifying` | `confirmed` | `failed`
- Image state (`characters.image_status`): `""` | `generating` | `done` | `failed`
- UI state (computed by backend):  
  - `new`
  - `minting`
  - `retry_mint`
  - `generating`
  - `retry_generation`
  - `done`

## Backend Changes (Phase 1)
- Compute and return `mint_ui_state` in `/characters` and `/characters/:id`.
- Keep no-image roles visible when mint has started (`verifying/failed/confirmed` or `tx_hash` exists).
- Return `mint_order_status`, `mint_paid`, `mint_has_tx` for frontend rendering.

## Frontend Changes (Phase 1)
- Mint AI role cards use backend `mint_ui_state` directly.
- Show explicit badge + helper text:
  - `minting`: payment/mint verifying in progress
  - `retry_mint`: paid flow failed before confirmation, tap to retry mint
  - `generating`: image generation in progress
  - `retry_generation`: paid confirmed but image failed, tap to retry generation
  - `done`: open detail
- Same behavior for normal roles and `mini_me`.

## Phase 2 (Next)
- Split wallet stage into explicit sub-steps: `awaiting_approve`, `awaiting_mint`, `mint_verifying`.
- Persist recovery queue server-side (DB job/cron) to survive process restarts.
- Parse mint event/tokenId and persist `on_chain_token_id` reliably.
- Optional architecture upgrade: switch to `pay -> generate -> final mint with final metadata`.

## Acceptance Criteria
- No-image role with paid/on-chain trace never disappears from Mint AI list.
- Retry action always available for:
  - mint failure after user signed tx flow
  - image generation failure after payment confirmed
- Returning user can continue flow from list card without re-paying.
