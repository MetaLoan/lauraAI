# 后端服务设置指南

## 1. 环境变量配置

创建 `.env` 文件（从 `.env.example` 复制）：

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入你的配置：

```env
# Telegram Bot Token（从 @BotFather 获取）
TELEGRAM_BOT_TOKEN=your_bot_token_here

# Gemini API Key
GEMINI_API_KEY=AIzaSyAgMfnlyqV2T-tm0buF9VQEgafeffwFFc0

# PostgreSQL 数据库连接字符串
# 格式: host=localhost user=用户名 password=密码 dbname=数据库名 port=5432 sslmode=disable
POSTGRES_DSN=host=localhost user=postgres password=your_password dbname=soulface port=5432 sslmode=disable

# 服务器端口
PORT=8080
```

## 2. 数据库初始化

### 方法 1: 使用脚本（推荐）

```bash
./init-db.sh
```

### 方法 2: 手动创建

```bash
# 使用 postgres 用户
psql -U postgres -c "CREATE DATABASE soulface;"

# 或使用 createdb 命令
createdb soulface
```

## 3. 启动服务器

### 方法 1: 使用启动脚本

```bash
./start-server.sh
```

### 方法 2: 直接运行

```bash
go run cmd/server/main.go
```

服务器将在 `http://localhost:8080` 启动。

## 4. 验证服务

访问健康检查端点：

```bash
curl http://localhost:8080/health
```

应该返回：
```json
{"status":"ok"}
```

## 5. 常见问题

### PostgreSQL 连接失败

- 检查 PostgreSQL 服务是否运行：`pg_isready`
- 检查 `.env` 中的 `POSTGRES_DSN` 配置是否正确
- 确认数据库用户有权限访问数据库

### 端口被占用

- 修改 `.env` 中的 `PORT` 为其他端口
- 或停止占用 8080 端口的其他服务

### Telegram Bot Token 未配置

- 从 [@BotFather](https://t.me/botfather) 获取 Bot Token
- 在 `.env` 文件中配置 `TELEGRAM_BOT_TOKEN`

## 6. API 文档

API 端点列表请参考 `README.md`。
