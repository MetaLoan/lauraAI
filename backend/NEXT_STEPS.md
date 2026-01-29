# 下一步操作指南

## ✅ 已完成的工作

1. ✅ Go 后端项目结构已创建
2. ✅ 数据库模型和 Repository 层已实现
3. ✅ Telegram 认证中间件已实现
4. ✅ 用户管理 API 已实现
5. ✅ 角色管理 API 已实现
6. ✅ Gemini Chat API 集成完成（支持流式响应）
7. ✅ Gemini Imagen 3 API 集成完成
8. ✅ 前端 API 客户端已创建
9. ✅ ChatWindow 组件已更新为使用真实 API
10. ✅ 数据库已创建（lauraai）
11. ✅ 后端代码编译成功

## 🚀 立即开始

### 1. 配置环境变量

在 `backend/` 目录下创建 `.env` 文件：

```bash
cd backend
cat > .env << 'EOF'
# 开发模式：本地测试时启用，跳过 Telegram 验证
DEV_MODE=true

# Telegram Bot Token（开发模式下可以留空）
TELEGRAM_BOT_TOKEN=your_bot_token_here

# Gemini API Key
GEMINI_API_KEY=AIzaSyAgMfnlyqV2T-tm0buF9VQEgafeffwFFc0

# PostgreSQL 数据库连接
POSTGRES_DSN=host=localhost user=postgres password=your_password dbname=lauraai port=5432 sslmode=disable

# 服务器端口
PORT=8080
EOF
```

**重要：** 请替换以下值：
- `DEV_MODE=true`: 本地开发时启用，跳过 Telegram 验证，使用默认测试账号
- `TELEGRAM_BOT_TOKEN`: 从 [@BotFather](https://t.me/botfather) 获取（开发模式下可以留空）
- `POSTGRES_DSN` 中的 `password`: 你的 PostgreSQL 密码
- `POSTGRES_DSN` 中的 `user`: 你的 PostgreSQL 用户名（通常是 `postgres`）

**开发模式说明**：
- 启用 `DEV_MODE=true` 后，所有 API 请求会自动使用默认测试账号（Telegram ID: 999999999）
- 无需提供 Telegram initData，方便本地开发和测试
- 详细说明请参考 `DEV_MODE.md`

### 2. 启动后端服务

**方法 1: 使用启动脚本**
```bash
cd backend
./start-server.sh
```

**方法 2: 使用 Makefile**
```bash
cd backend
make run
```

**方法 3: 直接运行**
```bash
cd backend
go run cmd/server/main.go
```

后端将在 `http://localhost:8080` 启动。

### 3. 配置前端

在项目根目录创建 `.env.local` 文件：

```bash
cd /Users/leo/Documents/lauraai
cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:8080/api
EOF
```

### 4. 启动前端

```bash
npm run dev
# 或
pnpm dev
```

前端将在 `http://localhost:3000` 启动。

## 🧪 测试验证

### 测试后端健康检查

```bash
curl http://localhost:8080/health
```

应该返回：
```json
{"status":"ok"}
```

### 测试数据库连接

后端启动时，如果数据库连接成功，会看到：
```
数据库连接成功
```

如果失败，检查：
1. PostgreSQL 服务是否运行：`pg_isready`
2. `.env` 中的 `POSTGRES_DSN` 配置是否正确
3. 数据库用户权限是否正确

## 📝 待完成的工作

### 前端集成（部分完成）

1. ✅ ChatWindow 组件已更新
2. ⏳ 用户引导流程完成后，需要调用后端 API 创建用户
3. ⏳ 角色创建流程需要调用后端 API
4. ⏳ Dashboard 需要从后端获取角色列表
5. ⏳ Profile 页面需要从后端获取用户信息

### 建议的集成点

1. **用户注册/更新** (`app/page.tsx`)
   - 在引导流程完成后（step 8），调用 `apiClient.updateMe()` 保存用户信息

2. **角色创建** (`components/soulmate-detail-page.tsx`)
   - 在角色创建时，调用 `apiClient.createCharacter()` 创建角色
   - 调用 `apiClient.generateImage()` 生成角色图片

3. **Dashboard** (`components/dashboard.tsx`)
   - 加载时调用 `apiClient.getCharacters()` 获取所有角色

4. **Profile** (`components/profile.tsx`)
   - 加载时调用 `apiClient.getMe()` 获取用户信息

## 🔧 开发工具

### 使用 Makefile

```bash
# 构建项目
make build

# 运行服务器
make run

# 初始化数据库
make init-db

# 安装依赖
make deps

# 完整设置
make setup
```

### 查看日志

后端日志会直接输出到控制台，包括：
- 数据库连接状态
- API 请求日志
- 错误信息

## 📚 相关文档

- `README.md` - API 文档
- `SETUP.md` - 详细设置指南
- `../QUICKSTART.md` - 快速启动指南
- `../FRONTEND_SETUP.md` - 前端配置指南

## ❓ 常见问题

### Q: 后端启动失败，提示数据库连接错误

A: 检查：
1. PostgreSQL 是否运行：`pg_isready`
2. `.env` 中的 `POSTGRES_DSN` 是否正确
3. 数据库用户是否有权限

### Q: Telegram 认证失败

A: 确保：
1. `TELEGRAM_BOT_TOKEN` 已正确配置
2. 在 Telegram Mini App 环境中运行
3. `initData` 正确传递到后端

### Q: Gemini API 调用失败

A: 检查：
1. `GEMINI_API_KEY` 是否正确
2. API 配额是否充足
3. 网络连接是否正常

## 🎉 开始开发

现在你可以：
1. 启动后端和前端服务
2. 在 Telegram Mini App 中测试完整流程
3. 逐步完善前端与后端的集成
4. 添加更多功能特性

祝开发顺利！
