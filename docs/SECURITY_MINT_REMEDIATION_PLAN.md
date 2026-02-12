# LauraAI 安全与 Mint 闭环改造计划

## 背景问题
- 当前钱包鉴权使用固定文案签名，可被重放。
- 后端存在测试钱包降级路径，生产误开会被绕过。
- Mint 流程缺少订单闭环与链上验真，无法稳定对账。

## 改造目标
- 鉴权改为一次性挑战签名 + 短期 token，会话可撤销、可过期。
- Mint 改为订单驱动，形成 `下单 -> 支付 -> 验链 -> 入账 -> 生成` 闭环。
- 所有关键链路可追溯（用户、角色、交易、订单状态、时间线）。

## 范围
- 前端：登录签名流程、鉴权头、Mint 调用与订单确认。
- 后端：Auth API、中间件、订单模型/仓储/接口、链上验签、生图前校验。
- 配置：禁用不安全默认值，新增 token 密钥和回滚开关。

## Phase 1: 鉴权加固（P0）
### 1.1 后端认证接口
- `POST /api/auth/nonce`
  - 输入：`wallet_address`
  - 输出：`nonce`、`message`（包含 nonce + 时间戳 + 域名标识）
- `POST /api/auth/verify`
  - 输入：`wallet_address`、`nonce`、`signature`
  - 行为：验签成功后作废 nonce，签发 `access_token`

### 1.2 token 中间件
- 改造 `WalletAuthMiddleware` 优先验证 `Authorization: Bearer <token>`。
- token 校验失败返回 `401`，不再接受固定签名头直通。
- `WEB_APP_MODE` 默认改为 `false`。
- 保留 `ALLOW_LEGACY_SIGNATURE_AUTH` 灰度回退开关，默认 `false`。

### 1.3 前端接入
- `use-wallet-auth` 改为：
  - 拉取 nonce/message
  - 钱包签名
  - 调用 verify 获取 token
  - 存储 token（sessionStorage）
- `lib/api.ts` 移除 `X-Wallet-*` 头，统一走 Bearer token。

### 1.4 验收标准
- 无 token 请求受保护接口必须失败。
- nonce 一次性使用，重放签名无效。
- token 过期后必须重新签名。

## Phase 2: Mint 订单闭环（P0）
### 2.1 数据模型
- 新增 `mint_orders`：
  - 主键：`id`
  - 关联：`user_id`、`character_id`
  - 订单：`order_no`、`status(pending/confirmed/failed)`
  - 支付：`chain_id`、`token_address`、`token_symbol`、`token_amount`
  - 交易：`tx_hash`、`payer_wallet`、`block_number`、`verified_at`
  - 扩展：`fail_reason`、`metadata(json)`

### 2.2 后端接口
- `POST /api/mint/orders`：创建 pending 订单。
- `POST /api/mint/orders/:id/confirm`：提交 txHash 并链上验真，更新 confirmed/failed。
- `GET /api/mint/orders/:id`：查询订单状态。

### 2.3 闭环约束
- `generate-image` 前必须检查该角色存在 `confirmed` 订单。
- 同一角色重复 mint：
  - 若已存在 confirmed 订单，直接返回角色详情，不重复扣费。

### 2.4 验收标准
- 每笔生成请求可追溯到唯一确认订单。
- 交易校验失败明确返回原因，不进入生成队列。

## Phase 3: 对账与运营可观测（P1）
- 审计日志：记录 `request_id/order_id/user_id/tx_hash`。
- 管理查询：按状态筛选订单，导出 CSV。
- 定时补偿：扫描 `pending` 超时订单并重验。

## 配置与安全基线
- 新增环境变量：
  - `AUTH_TOKEN_SECRET`
  - `AUTH_TOKEN_TTL_MINUTES`（默认 120）
  - `ALLOW_LEGACY_SIGNATURE_AUTH`（默认 false）
- 调试/危险接口仅在 `DEV_MODE=true` 生效。

## 回滚策略
- 若前端未同步导致登录失败，可临时开启 `ALLOW_LEGACY_SIGNATURE_AUTH=true`。
- 订单逻辑可先启用“软校验模式”（仅告警不拦截），观察后切硬拦截。

## 里程碑与交付
1. `M1` 鉴权上线：接口 + 中间件 + 前端改造 + 验证脚本。
2. `M2` Mint 闭环上线：订单模型 + 验链 + 生成前校验。
3. `M3` 对账工具上线：查询页/API + 补偿任务。

## 本次立即执行顺序
1. 提交本计划文档。
2. 实施 `M1`，本地联调并提交。
3. 实施 `M2`，跑构建并提交。
