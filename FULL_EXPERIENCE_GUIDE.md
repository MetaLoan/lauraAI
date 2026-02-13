# 🎮 SoulFace 完整体验流程指南

**环境状态**: ✅ 全新数据库 (已清空)  
**开始时间**: 2026-02-10 14:58  
**测试目标**: 验证从注册到赚取 LRA 的完整用户旅程

---

## 🚀 服务状态确认

### 当前运行的服务
```
✅ 后端: http://localhost:8081 (Go Server)
✅ 前端: http://localhost:3000 (Next.js)
✅ 数据库: PostgreSQL (soulface) - 已清空
```

### 数据库状态
```
Users: 0
Characters: 0  
Messages: 0
Uploaded Files: 已清空 (72 个文件已删除)
```

---

## 📋 完整体验流程 (按顺序执行)

### 阶段 1: 首次访问和注册 🎯

#### 步骤 1.1: 访问首页
1. 打开浏览器访问: `http://localhost:3000`
2. **预期结果**: 看到 SoulFace 欢迎页面
3. **检查点**: 页面标题应该是 "SoulFace | Sovereign Intelligence"

#### 步骤 1.2: 连接钱包
1. 点击右上角 "Connect Wallet" 按钮
2. 选择你的钱包 (MetaMask/WalletConnect)
3. 确认连接
4. **预期结果**: 钱包地址显示在右上角
5. **检查点**: 
   - 打开开发者工具 (F12) → Network 标签
   - 应该看到 `POST /api/auth/telegram` 请求
   - 数据库应该创建新用户记录

#### 步骤 1.3: 验证用户创建
```bash
# 在终端执行
psql -h localhost -U postgres -d soulface -c "SELECT id, telegram_id, points, lra_balance FROM users;"
```
**预期结果**: 看到一条新用户记录,`points=0`, `lra_balance=0`

---

### 阶段 2: 创建 AI Soulmate 💝

#### 步骤 2.1: 进入创建页面
1. 访问: `http://localhost:3000/create`
2. **预期结果**: 看到 AI 创建表单

#### 步骤 2.2: 填写信息
1. 选择 AI 类型 (例如: Soulmate)
2. 填写个人信息:
   - 姓名
   - 性别
   - 出生日期
   - 出生时间
   - 出生地点
   - 种族
3. 点击 "Generate My Soulmate"

#### 步骤 2.3: 等待生成
1. **预期**: 显示加载动画
2. **后端处理**:
   - 调用 Gemini API 生成性格报告
   - 调用 Imagen API 生成 AI 形象
   - 保存到数据库
3. **检查点**:
   - 打开开发者工具 → Network
   - 应该看到 `POST /api/characters` 请求
   - 应该看到 `POST /api/characters/:id/generate-image` 请求

#### 步骤 2.4: 验证角色创建
```bash
psql -h localhost -U postgres -d soulface -c "SELECT id, type, title, unlock_status FROM characters;"
```
**预期结果**: 看到新创建的角色记录

---

### 阶段 3: 聊天赚取积分 💬

#### 步骤 3.1: 进入聊天页面
1. 在 Dashboard 点击你的 AI Soulmate 卡片
2. 或直接访问: `http://localhost:3000/chat/[character_id]`
3. **预期结果**: 看到聊天界面

#### 步骤 3.2: 发送第一条消息
1. 在输入框输入: "Hello, how are you?"
2. 点击发送
3. **预期**: 
   - AI 回复消息
   - 右上角积分 +5 LRA
4. **检查点**:
   - 打开开发者工具 → Network
   - 应该看到 `POST /api/characters/:id/chat` (发送消息)
   - 应该看到 `POST /api/users/me/points/sync` (同步积分)

#### 步骤 3.3: 继续对话赚取积分
1. 再发送 4 条消息 (每条 +5 LRA)
2. **预期**: 总积分应该达到 25 LRA
3. **验证积分同步**:
```bash
psql -h localhost -U postgres -d soulface -c "SELECT points FROM users WHERE id=1;"
```
**预期结果**: `points = 25`

---

### 阶段 4: 查看 DeFi 市场数据 📊

#### 步骤 4.1: 访问 Dashboard
1. 访问: `http://localhost:3000/dashboard`
2. 找到 "DeFi Analytics" 或 Portfolio 区域

#### 步骤 4.2: 验证真实数据
1. **检查点**:
   - 打开开发者工具 → Network
   - 应该看到 `GET /api/market/intelligence` 请求
2. 查看响应内容:
```json
{
  "bnb_price": "629.27",  // ← 应该是真实价格
  "v3_pools": [...],
  "gas_price": "2.1 Gwei"
}
```
3. **验证**: BNB 价格不是固定值,而是来自 Binance API

---

### 阶段 5: 结算积分为 LRA 💰

#### 步骤 5.1: 查看当前积分
1. 在 Dashboard 找到 "Chat-to-Earn Rewards" 卡片
2. **预期**: 显示 25 LRA (或你实际赚取的数量)

#### 步骤 5.2: 点击 Harvest
1. 点击 "Harvest LRA" 按钮
2. **预期**: 
   - 显示确认对话框或加载状态
   - 积分清零
   - LRA Balance 增加 25
3. **检查点**:
   - 打开开发者工具 → Network
   - 应该看到 `POST /api/users/me/points/harvest` 请求
   - 响应应该包含 `harvested: 25`

#### 步骤 5.3: 验证数据库更新
```bash
psql -h localhost -U postgres -d soulface -c "SELECT points, lra_balance FROM users WHERE id=1;"
```
**预期结果**: 
```
 points | lra_balance 
--------+-------------
      0 |          25
```

---

### 阶段 6: 数据持久化验证 🔄

#### 步骤 6.1: 刷新页面
1. 在 Dashboard 页面按 F5 刷新
2. **预期**: 
   - 积分仍然是 0
   - LRA Balance 仍然是 25
   - 数据没有丢失

#### 步骤 6.2: 关闭并重新打开浏览器
1. 完全关闭浏览器
2. 重新打开并访问 `http://localhost:3000/dashboard`
3. **预期**: 所有数据保持不变

#### 步骤 6.3: 多标签页测试
1. 打开两个浏览器标签页
2. 标签页 A: 进入聊天赚取积分
3. 标签页 B: 刷新 Dashboard
4. **预期**: 标签页 B 显示更新后的积分

---

### 阶段 7: Profile 页面验证 👤

#### 步骤 7.1: 访问个人页面
1. 访问: `http://localhost:3000/profile`
2. **预期**: 看到个人信息和统计数据

#### 步骤 7.2: 验证显示数据
1. **检查以下字段**:
   - Points Balance: 应该显示当前积分
   - Total Earnings: 应该显示总收益
   - Referrals: 推荐人数
2. **检查点**:
   - 打开开发者工具 → Network
   - 应该看到 `GET /api/users/me` 请求
   - 响应应该包含真实的 `points` 和 `lra_balance`

---

## 🔍 调试和监控

### 实时查看后端日志
```bash
tail -f backend/server.log
```

### 实时查看数据库变化
```bash
watch -n 2 'psql -h localhost -U postgres -d soulface -c "SELECT id, points, lra_balance FROM users;"'
```

### 测试单个 API
```bash
# 测试市场数据
curl "http://localhost:8081/api/market/intelligence" | python3 -m json.tool

# 测试健康检查
curl "http://localhost:8081/health"
```

---

## ✅ 完整体验检查清单

### 用户注册和认证
- [ ] 成功连接钱包
- [ ] 用户记录创建在数据库
- [ ] 初始积分为 0

### AI Soulmate 创建
- [ ] 成功填写表单
- [ ] AI 形象生成成功
- [ ] 性格报告生成成功
- [ ] 角色保存到数据库

### 聊天和积分系统
- [ ] 发送消息成功
- [ ] AI 回复正常
- [ ] 每条消息 +5 积分
- [ ] 积分实时同步到数据库
- [ ] 前端显示正确的积分数

### DeFi 数据
- [ ] 市场数据 API 调用成功
- [ ] 显示真实的 BNB 价格
- [ ] 池子数据显示正确

### 积分结算
- [ ] Harvest 按钮可点击
- [ ] 积分成功转换为 LRA
- [ ] 数据库正确更新
- [ ] 前端显示正确的余额

### 数据持久化
- [ ] 刷新页面数据不丢失
- [ ] 关闭浏览器后数据保持
- [ ] 多标签页数据同步

### Profile 页面
- [ ] 正确显示积分
- [ ] 正确显示余额
- [ ] 数据来自数据库而非 localStorage

---

## 🐛 常见问题排查

### 问题 1: 积分没有增加
**排查步骤**:
1. 检查开发者工具 Network 标签
2. 确认 `/api/users/me/points/sync` 请求成功
3. 查看后端日志: `tail -f backend/server.log`
4. 查询数据库: `SELECT points FROM users;`

### 问题 2: DeFi 数据显示错误
**排查步骤**:
1. 测试 API: `curl http://localhost:8081/api/market/intelligence`
2. 检查 Binance API 是否可访问
3. 查看后端日志中的错误信息

### 问题 3: Harvest 失败
**排查步骤**:
1. 确认积分 > 0
2. 检查 Network 标签中的错误响应
3. 查看后端日志
4. 验证数据库事务是否成功

---

## 🎯 成功标准

完成以上所有步骤后,你应该:
1. ✅ 拥有一个完整的用户账户
2. ✅ 创建了至少一个 AI Soulmate
3. ✅ 通过聊天赚取了积分
4. ✅ 成功将积分结算为 LRA
5. ✅ 看到真实的 DeFi 市场数据
6. ✅ 验证了数据持久化

---

**准备好了吗?** 🚀

从 `http://localhost:3000` 开始你的 SoulFace 之旅!
