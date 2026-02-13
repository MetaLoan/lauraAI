# 本地开发环境设置指南

## 前置要求

1. **Node.js** (v20+)
2. **Go** (v1.20+)
3. **PostgreSQL** (运行中)
4. **ngrok** (用于内网穿透)

### 安装 ngrok

```bash
# macOS
brew install ngrok/ngrok/ngrok

# 或访问 https://ngrok.com/download 下载
```

### 配置 ngrok（首次使用）

1. 访问 https://ngrok.com 注册账号
2. 获取 authtoken
3. 运行：`ngrok config add-authtoken YOUR_TOKEN`

## 快速开始

### 方式一：使用 ngrok 内网穿透（推荐用于移动端测试）

```bash
# 1. 确保后端 .env 文件已配置
cd backend
cp .env.example .env  # 如果存在
# 编辑 .env 文件，配置数据库和 API keys

# 2. 回到项目根目录，运行启动脚本
cd ..
chmod +x start-dev-with-ngrok.sh
./start-dev-with-ngrok.sh
```

脚本会自动：
- ✅ 启动后端服务器（端口 8081）
- ✅ 启动 ngrok 内网穿透
- ✅ 获取 ngrok 公网 URL
- ✅ 创建 `.env.local` 文件，配置前端 API 地址
- ✅ 启动前端开发服务器（端口 3000）

**访问地址：**
- 前端：http://localhost:3000
- 后端 API：ngrok 提供的公网 URL（会在终端显示）
- ngrok 控制台：http://localhost:4040

### 方式二：仅本地开发（不使用 ngrok）

```bash
# 1. 启动后端
cd backend
chmod +x run-server.sh
./run-server.sh

# 2. 启动前端（新终端）
cd ..
npm install
npm run dev
```

**访问地址：**
- 前端：http://localhost:3000
- 后端 API：http://localhost:8081/api

## 服务端运行脚本

### 生产环境或简单测试

```bash
cd backend
chmod +x run-server.sh
./run-server.sh
```

这个脚本会：
- ✅ 检查环境配置
- ✅ 编译 Go 服务器
- ✅ 启动服务器
- ✅ 显示配置信息

## 环境变量配置

### 后端 (.env)

```bash
# Telegram Bot Token（生产环境必需）
TELEGRAM_BOT_TOKEN=your_bot_token

# Gemini API Key
GEMINI_API_KEY=your_gemini_api_key

# PostgreSQL 连接字符串
POSTGRES_DSN=host=localhost user=postgres password=your_password dbname=soulface port=5432 sslmode=disable

# 服务器端口
PORT=8081

# 开发模式（跳过 Telegram 验证）
DEV_MODE=true
```

### 前端 (.env.local)

使用 ngrok 脚本会自动创建，或手动创建：

```bash
# 当前 ngrok API 地址
NEXT_PUBLIC_API_URL=https://nathalie-clothlike-urgently.ngrok-free.dev/api
```

**注意：** ngrok 免费版的 URL 每次重启都会变化，如果 URL 变化了，需要更新 `.env.local` 文件。

## 常见问题

### 1. 端口被占用

```bash
# 查看占用端口的进程
lsof -i :8081
lsof -i :3000

# 关闭进程
kill -9 <PID>
```

### 2. ngrok 无法启动

- 检查 ngrok 是否已安装：`which ngrok`
- 检查 authtoken 是否配置：`ngrok config check`
- 查看 ngrok 日志：`cat /tmp/soulface-dev/ngrok.log`

### 3. 后端无法连接数据库

- 检查 PostgreSQL 是否运行：`pg_isready`
- 检查连接字符串是否正确
- 检查数据库是否存在：`psql -l | grep soulface`

### 4. 前端无法连接后端

- 检查 `.env.local` 中的 `NEXT_PUBLIC_API_URL` 是否正确
- 检查后端是否正常运行
- 检查 CORS 配置

## 停止服务

### 使用 ngrok 脚本启动的

按 `Ctrl+C` 会自动停止所有服务

### 手动停止

```bash
# 停止后端
pkill -f "./server"

# 停止前端
pkill -f "next dev"

# 停止 ngrok
pkill -f "ngrok"
```

## 开发工作流

1. **启动开发环境**
   ```bash
   ./start-dev-with-ngrok.sh
   ```

2. **修改代码**
   - 前端代码修改会自动热重载
   - 后端代码修改需要重启服务器

3. **查看日志**
   - 后端日志：`cat /tmp/soulface-dev/backend.log`
   - ngrok 日志：`cat /tmp/soulface-dev/ngrok.log`
   - ngrok URL：`cat /tmp/soulface-dev/ngrok_url.txt`

4. **测试**
   - 本地浏览器：http://localhost:3000
   - 移动端：使用 ngrok URL（在终端显示）

## 生产部署

生产环境请使用：
- 后端：`backend/run-server.sh`（配合进程管理器如 systemd、supervisor）
- 前端：部署到 Vercel 或 GitHub Pages（参考 `.github/DEPLOY.md`）
