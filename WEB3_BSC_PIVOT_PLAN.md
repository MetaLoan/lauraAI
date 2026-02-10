# LauraAI - BSC Web3 转型与开发功能清单

## 📅 项目目标
将 LauraAI 从 Telegram Mini App 转型为基于 BSC (Binance Smart Chain) 的响应式 Web3 应用。核心叙事为“基于 Intent 的 AI 资产管理伴侣”。

---

## 🛠 第一阶段：基础设施改造 (Infrastructure Pivot)
**目标：** 移除 Telegram 依赖，建立标准的 Web3 连接环境。

- [ ] **清理 Telegram 遗留代码**
    - 移除 `@twa-dev/sdk`, `@telegram-apps/sdk-react` 等依赖。
    - 清理 `page.tsx` 中关于 `initData` 和 `BackButton` 的逻辑。
    - 移除 `layout.tsx` 中的 `TelegramProvider`。
- [ ] **集成 Web3 钱包 (RainbowKit + Wagmi)**
    - 安装依赖 (`rainbowkit`, `wagmi`, `viem`, `@tanstack/react-query`)。
    - 配置 `Web3Provider` 组件。
    - 配置区块链网络为 **BSC Mainnet** 和 **BSC Testnet**。
    - 实现全局 `ConnectButton` (连接钱包组件)。
- [ ] **身份认证系统升级 (Auth 2.0)**
    - 前端：实现 SIWE (Sign-In with Ethereum) 规范，使用钱包签名登录。
    - 后端：将 `Telegram initData` 验证替换为 `EVM 钱包签名` 验证。
    - 数据库：用户表 `users` 主键或索引需支持 `wallet_address` (0x...)。

---

## 🎨 第二阶段：UI/UX 响应式重构 (Responsive UI Overhaul)
**目标：** 兼容 PC 与 Mobile，采用 Dashboard 布局而非单页流。

- [ ] **全局布局开发 (App Layout)**
    - **Header**: 显示 Logo、导航菜单 (PC)、连接钱包按钮、当前网络状态。
    - **Sidebar (PC端)**: 左侧固定导航 (Dashboard, Market, Chat, Profile)。
    - **Bottom Nav (Mobile端)**: 底部固定导航，适配 iOS 安全区域。
    - **Container**: 实现 `max-w-7xl mx-auto` 等响应式约束，确保在大屏上不拉伸。
- [ ] **主要页面路由化 (Routing)**
    - 将单页 `steps` 拆分为 Next.js 路由：
        - `/`: 落地页 (Landing Page)，未连接钱包时展示。
        - `/dashboard`: 仪表盘，展示 AI 角色卡片和资产概览。
        - `/create`: 创建/铸造新 AI 的流程页面。
        - `/chat/[id]`: 具体的聊天界面 (核心功能)。
        - `/market`: 市场/发现页面 (浏览其他热门 AI)。
        - `/profile`: 用户设置与资产管理。

---

## 💎 第三阶段：核心业务功能 (Core Features)
**目标：** 实现业务闭环，让投资人看到“AI + 资产”的潜力。

- [ ] **功能 1: 铸造 AI 伴侣 (Minting AI)**
    - 表单重构：保留生辰八字输入，但增加 Web3 元素（如“消耗 BNB 铸造”）。
    - 智能合约交互（模拟或真实）：点击“Born”时调用钱包支付 Gas 费。
    - **高大上动效**：展示“链上基因合成中...”的动画。
- [ ] **功能 2: 聊天挖矿 (Chat-to-Earn)**
    - 积分系统：重新设计聊天界面，每条有效回复增加用户的 `LRA` 积分（模拟代币）。
    - 实时反馈：聊天框旁边增加一个悬浮的“收益计数器”。
- [ ] **功能 3: 资产管理面板 (DeFi Dashboard)**
    - 在 Dashboard 页增加“模拟资产”卡片。
    - 展示图表：由于是冲交易所，需要展示 APY (年化收益率)、TVL (总锁仓量) 等虚荣指标。

---

## 📱 第四阶段：移动端与细节打磨 (Polish)
- [ ] **PWA 支持**：添加 `manifest.json`，让网页可以像 App 一样添加到手机桌面。
- [ ] **交互优化**：
    - 解决 iOS Safari 地址栏遮挡问题 (`dvh` 单位)。
    - 优化 PC 端聊天窗口的滚动条美化。
- [ ] **SEO 优化**：针对 "AI DeFi Agent", "BSC AI" 等关键词优化 Meta 标签。

---

## 📝 待确认事项 (Open Questions)
1. 是否需要立即开发真实的智能合约 (Solidity)，还是通过后端模拟链上交互？(建议演示阶段先模拟，体验更流畅)
2. 是否已有新的 UI 设计稿，还是沿用目前的暗黑风格？
