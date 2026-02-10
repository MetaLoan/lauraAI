# Fly.io 部署结果

已完成的步骤：

## 1. RPC 节点（Anvil）

- **应用名**: `lauraai-rpc`
- **地址**: https://lauraai-rpc.fly.dev
- **状态**: 已部署，监听 0.0.0.0:8545
- **链**: Chain ID 31337（与 Hardhat 兼容）

## 2. 后端（Go API）

- **应用名**: `lauraai-backend`
- **API 基础地址**: https://lauraai-backend.fly.dev/api
- **状态**: 已部署（沿用你之前的 volume 与 secrets）

---

## 你本地只需做 3 件事

### 一、前端用云端 API + 云端 RPC

在项目根目录的 `.env.local` 里加上或改成：

```env
NEXT_PUBLIC_API_URL=https://lauraai-backend.fly.dev/api
NEXT_PUBLIC_RPC_URL=https://lauraai-rpc.fly.dev
```

保存后重启前端（`npm run dev`）。之后前端会请求云端 API 和云端 RPC，**本地不用再开后端和 Hardhat 节点**。

### 二、给云端链部署合约并打钱（仅第一次或 RPC 重启后）

云端 RPC 重启后链会清空，需要重新部署合约并给钱包打钱。在**一个**终端里**连续**执行（不要中间关掉）：

```bash
cd contracts
npx hardhat run scripts/deploy.js --network fly
```

把终端里输出的 **4 个合约地址**记下来（Token、Soulmate、Marketplace、Staking），然后：

1. 打开 `contracts/scripts/fund-address.js`，把 `LRA_TOKEN_ADDRESS` 改成上面 **Token** 的地址。
2. 执行打钱：
   ```bash
   npx hardhat run scripts/fund-address.js --network fly
   ```
3. 打开 `lib/contracts.ts`，把开头的 4 个本地合约地址（`LAURA_AI_TOKEN_ADDRESS`、`LAURA_AI_SOULMATE_ADDRESS`、`LAURA_AI_MARKETPLACE_ADDRESS`、`LAURA_AI_STAKING_ADDRESS`）改成上面记下的 4 个地址。

这样钱包连接「云端 RPC」时就能看到余额并正常 Mint。

### 三、钱包里添加「云端链」

- 网络名称：随意，例如 `Laura Cloud`
- RPC URL：`https://lauraai-rpc.fly.dev`
- Chain ID：`31337`
- 符号：`ETH` 或 `GO` 均可

连上该网络后，用你在第二步打过钱的地址即可使用。

---

## 常用命令

```bash
# 查看 RPC 状态
cd rpc-node && fly status

# 查看后端状态
cd backend && fly status

# 查看后端日志
cd backend && fly logs

# 重新部署 RPC
cd rpc-node && fly deploy

# 重新部署后端
cd backend && fly deploy
```

---

**总结**：RPC 和后端已在 Fly.io 上跑好。你本地只保留「前端 + 部署/打钱脚本」，需要时按上面第二步对云端链部署合约并打钱即可。
