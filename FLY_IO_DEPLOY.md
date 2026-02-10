# Fly.io 部署：RPC 节点 + 后端（新建机器，减少本地开销）

将 **RPC 节点（Anvil）** 和 **后端（Go API）** 部署到 Fly.io，本地只需跑前端，减少电脑负载。

**一键部署**（需已 `fly launch` 过对应应用）：
```bash
./deploy-fly.sh all    # 先 RPC 再 Backend
./deploy-fly.sh rpc    # 仅 RPC
./deploy-fly.sh backend # 仅 Backend
```

---

## 前置要求

1. 安装 [Fly CLI](https://fly.io/docs/hands-on/install-flyctl/)：
   ```bash
   brew install flyctl   # macOS
   ```
2. 登录：
   ```bash
   fly auth login
   ```

---

## 一、部署 RPC 节点（新建应用）

RPC 使用 Anvil（与 Hardhat 链兼容，Chain ID 31337），供前端/钱包连接。

```bash
cd rpc-node
fly launch --no-deploy --name lauraai-rpc --region sin
# 若提示 Copy configuration from existing app? 选 No
fly deploy
```

部署成功后记下 RPC 地址，例如：
```
https://lauraai-rpc.fly.dev
```

**注意**：Anvil 当前为无状态运行，机器重启后链数据会清空，需重新在链上部署合约并打钱（见下文「首次/重启后：向云端 RPC 部署合约并打钱」）。

---

## 二、部署后端（新建应用）

```bash
cd backend
fly launch --no-deploy --name lauraai-backend --region sin
# 若已存在 lauraai-backend，可跳过 launch，直接做下面步骤
```

1. **创建 Volume（存上传文件）**  
   与 backend 同 region，例如 `sin`：
   ```bash
   fly volumes create uploads_data --size 10 --region sin
   ```

2. **设置 Secrets**（必填）：
   ```bash
   # 文字对话优先用 DeepSeek，未设置则回退 Gemini
   fly secrets set DEEPSEEK_API_KEY="你的_deepseek_api_key"
   fly secrets set GEMINI_API_KEY="你的_gemini_api_key"
   fly secrets set POSTGRES_DSN="host=xxx user=xxx password=xxx dbname=lauraai port=5432 sslmode=require"
   fly secrets set UPLOADS_DIR="/root/uploads"
   ```
   可选：`TELEGRAM_BOT_TOKEN`、`BASE_URL=https://lauraai-backend.fly.dev`

3. **部署**：
   ```bash
   fly deploy
   ```

后端地址示例：`https://lauraai-backend.fly.dev`，API 基础路径：`https://lauraai-backend.fly.dev/api`。

---

## 三、首次/重启后：向云端 RPC 部署合约并打钱

RPC 节点重启后链会重置，需要重新部署合约并给钱包地址打测试币。项目已配置 `fly` 网络（见 `contracts/hardhat.config.js`），默认指向 `https://lauraai-rpc.fly.dev`，也可用环境变量 `FLY_RPC_URL` 覆盖。

1. **部署合约**（使用 fly 网络）：
   ```bash
   cd contracts
   npx hardhat run scripts/deploy.js --network fly
   ```
   记下输出的 Token / Soulmate / Marketplace / Staking 地址。

2. **更新前端合约地址**  
   把 `lib/contracts.ts` 里的四个本地合约地址改成上一步输出的地址。

3. **更新打钱脚本里的 LRA 地址**  
   把 `contracts/scripts/fund-address.js` 里的 `LRA_TOKEN_ADDRESS` 改成本次部署的 Token 地址。

4. **打钱**：
   ```bash
   npx hardhat run scripts/fund-address.js --network fly
   ```

完成后，前端连接 `https://lauraai-rpc.fly.dev` 即可看到余额并正常 Mint。

---

## 四、前端配置

- **API**：`.env.local` 或生产环境里设置  
  `NEXT_PUBLIC_API_URL=https://lauraai-backend.fly.dev/api`
- **RPC（使用云端链时）**：设置  
  `NEXT_PUBLIC_RPC_URL=https://lauraai-rpc.fly.dev`  
  前端会优先用该地址作为 Chain ID 31337 的 RPC，无需本地节点。

---

## 常用命令

| 操作           | 命令 |
|----------------|------|
| 查看 RPC 状态  | `cd rpc-node && fly status` |
| 查看后端状态   | `cd backend && fly status` |
| 查看后端日志   | `cd backend && fly logs` |
| 查看 RPC 日志  | `cd rpc-node && fly logs` |
| 重启 RPC       | `cd rpc-node && fly apps restart` |
| 重启后端       | `cd backend && fly apps restart` |

---

## 费用说明

- Fly 有免费额度；超出后按用量计费。
- RPC 与后端都设置了 `min_machines_running = 0` 和 `auto_stop_machines = 'stop'`，空闲会被停掉，请求时再拉起，可减少开销。
