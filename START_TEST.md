# 🚀 开始测试 - 快速指南

## ✅ 当前状态

- ✅ 后端服务已配置并可以启动
- ✅ 数据库表已自动创建（users, characters, messages）
- ✅ 所有 API 路由已注册
- ✅ 端口配置为 8081（避免与现有服务冲突）

## 🎯 立即开始测试

### 步骤 1: 启动后端服务

打开一个新的终端窗口，运行：

```bash
cd /Users/leo/Documents/soulface/backend
go run cmd/server/main.go
```

或者使用启动脚本：

```bash
cd /Users/leo/Documents/soulface/backend
./test-start.sh
```

你应该看到：
```
数据库连接成功
服务器启动在端口 8081
```

### 步骤 2: 验证后端服务

在另一个终端窗口运行：

```bash
curl http://localhost:8081/health
```

应该返回：
```json
{"status":"ok"}
```

或者在浏览器中打开：
```
http://localhost:8081/health
```

### 步骤 3: 启动前端服务

在项目根目录运行：

```bash
npm run dev
# 或
pnpm dev
```

前端将在 `http://localhost:3000` 启动。

### 步骤 4: 测试 API

使用测试脚本：

```bash
cd /Users/leo/Documents/soulface/backend
./test-api.sh
```

## 📋 已注册的 API 端点

### 公开端点（无需认证）

- `GET /health` - 健康检查

### 需要认证的端点

所有 `/api/*` 端点都需要 Telegram `initData` 认证：

- `POST /api/auth/telegram` - Telegram 认证
- `GET /api/users/me` - 获取当前用户
- `PUT /api/users/me` - 更新用户信息
- `POST /api/characters` - 创建角色
- `GET /api/characters` - 获取所有角色
- `GET /api/characters/:id` - 获取角色详情
- `POST /api/characters/:id/chat` - 发送消息（流式响应）
- `GET /api/characters/:id/messages` - 获取聊天历史
- `POST /api/characters/:id/generate-image` - 生成角色图片

## 🔧 配置说明

### 后端配置 (backend/.env)

```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
GEMINI_API_KEY=AIzaSyAgMfnlyqV2T-tm0buF9VQEgafeffwFFc0
POSTGRES_DSN=host=localhost user=postgres password= dbname=soulface port=5432 sslmode=disable
PORT=8081
```

**注意：** 如果 PostgreSQL 需要密码，请在 `POSTGRES_DSN` 中添加密码。

### 前端配置 (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:8081/api
```

## 🧪 测试场景

### 1. 基础功能测试

- [x] 后端服务启动
- [x] 数据库连接
- [x] 健康检查端点
- [ ] 前端连接后端
- [ ] Telegram 认证
- [ ] 用户创建/更新
- [ ] 角色创建
- [ ] 聊天功能
- [ ] 图片生成

### 2. 在浏览器中测试

1. 打开 `http://localhost:3000`
2. 注意：某些功能需要 Telegram 环境才能正常工作
3. 查看浏览器控制台的错误信息

### 3. 在 Telegram Mini App 中测试

1. 将前端部署到可访问的 URL（如 Vercel、Netlify）
2. 在 Telegram Bot 中设置 Web App URL
3. 在 Telegram Mini App 中打开应用
4. 完成完整的用户引导流程
5. 测试所有功能

## 📝 下一步

1. **完善前端集成**
   - 在用户引导流程完成后调用后端 API
   - 在角色创建时调用后端 API
   - 在 Dashboard 加载时从后端获取数据

2. **配置 Telegram Bot**
   - 从 [@BotFather](https://t.me/botfather) 获取 Bot Token
   - 更新 `.env` 中的 `TELEGRAM_BOT_TOKEN`
   - 设置 Web App URL

3. **测试完整流程**
   - 用户注册
   - 角色创建
   - AI 聊天
   - 图片生成

## 📚 相关文档

- `TEST_GUIDE.md` - 详细测试指南
- `backend/README.md` - API 文档
- `backend/NEXT_STEPS.md` - 下一步操作
- `QUICKSTART.md` - 快速启动指南

## ⚠️ 注意事项

1. **数据库密码**: 如果 PostgreSQL 需要密码，请更新 `.env` 中的 `POSTGRES_DSN`
2. **Telegram Bot Token**: 需要从 @BotFather 获取并配置
3. **端口冲突**: 如果 8081 也被占用，可以修改 `.env` 中的 `PORT`
4. **前端环境变量**: 确保 `.env.local` 中的 API URL 与后端端口一致

祝测试顺利！🎉
