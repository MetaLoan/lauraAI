# LauraAI 快速启动指南

## 前置要求

- Go 1.21+
- Node.js 18+
- PostgreSQL 12+

## 快速启动步骤

### 1. 后端设置

```bash
cd backend

# 创建 .env 文件
cat > .env << EOF
TELEGRAM_BOT_TOKEN=your_bot_token_here
GEMINI_API_KEY=AIzaSyAgMfnlyqV2T-tm0buF9VQEgafeffwFFc0
POSTGRES_DSN=host=localhost user=postgres password=your_password dbname=lauraai port=5432 sslmode=disable
PORT=8080
EOF

# 初始化数据库
./init-db.sh

# 启动后端服务
./start-server.sh
```

后端将在 `http://localhost:8080` 启动。

### 2. 前端设置

```bash
# 在项目根目录创建 .env.local
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:8080/api
EOF

# 启动前端开发服务器
npm run dev
```

前端将在 `http://localhost:3000` 启动。

### 3. 验证服务

**后端健康检查：**
```bash
curl http://localhost:8080/health
```

**前端访问：**
打开浏览器访问 `http://localhost:3000`

## 完整功能测试

1. **在 Telegram 中测试：**
   - 将前端部署到可访问的 URL
   - 在 Telegram Bot 中设置 Web App URL
   - 在 Telegram Mini App 中打开应用
   - 完成用户引导流程
   - 创建 AI 角色
   - 与角色聊天

2. **本地开发测试：**
   - 启动后端和前端服务
   - 在浏览器中打开前端
   - 注意：某些需要 Telegram 认证的功能可能无法正常工作

## 故障排除

### 后端无法连接数据库

1. 检查 PostgreSQL 是否运行：`pg_isready`
2. 检查 `.env` 中的 `POSTGRES_DSN` 配置
3. 确认数据库已创建：`psql -l | grep lauraai`

### 前端无法连接后端

1. 检查后端是否运行：`curl http://localhost:8080/health`
2. 检查 `.env.local` 中的 `NEXT_PUBLIC_API_URL` 配置
3. 检查浏览器控制台的错误信息

### Telegram 认证失败

1. 确认 `TELEGRAM_BOT_TOKEN` 已正确配置
2. 确认在 Telegram Mini App 环境中运行
3. 检查后端日志中的错误信息

## 下一步

- 查看 `backend/README.md` 了解 API 文档
- 查看 `backend/SETUP.md` 了解详细配置
- 查看 `FRONTEND_SETUP.md` 了解前端配置
