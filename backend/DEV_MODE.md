# 本地开发模式说明

## 概述

在本地开发环境中，由于没有 Telegram Mini App 的 initData，无法进行正常的 Telegram 认证。开发模式允许你跳过 Telegram 验证，使用默认的测试账号进行开发和测试。

## 启用开发模式

### 方法 1: 环境变量（推荐）

在 `backend/.env` 文件中添加：

```env
DEV_MODE=true
```

### 方法 2: 启动时设置

```bash
export DEV_MODE=true
go run cmd/server/main.go
```

或者在 Windows 上：

```cmd
set DEV_MODE=true
go run cmd/server/main.go
```

## 默认测试账号

开发模式启用后，系统会自动使用以下默认测试账号：

- **Telegram ID**: 999999999
- **用户名**: Test User

如果该测试账号不存在，系统会自动创建。

## 使用说明

1. **启用开发模式**：在 `backend/.env` 中添加 `DEV_MODE=true`

2. **启动后端服务**：
   ```bash
   cd backend
   go run cmd/server/main.go
   ```

3. **验证开发模式**：启动时应该看到日志：
   ```
   开发模式已启用: 将跳过 Telegram 验证，使用默认测试账号
   ```

4. **测试 API**：现在所有需要认证的 API 都会自动使用测试账号，无需提供 Telegram initData。

## 注意事项

⚠️ **重要**：
- 开发模式**仅用于本地开发环境**
- **不要**在生产环境中启用 `DEV_MODE=true`
- 开发模式下，所有请求都会使用同一个测试账号
- 测试账号的 Telegram ID 是固定的：`999999999`

## 完整配置示例

`backend/.env` 文件示例：

```env
# 开发模式（本地测试时启用）
DEV_MODE=true

# Telegram Bot Token（开发模式下可以留空）
TELEGRAM_BOT_TOKEN=

# Gemini API Key
GEMINI_API_KEY=your_gemini_api_key

# PostgreSQL 数据库连接
POSTGRES_DSN=host=localhost user=postgres password=your_password dbname=lauraai port=5432 sslmode=disable

# 服务器端口
PORT=8080
```

## 测试

启动服务后，可以测试 API：

```bash
# 健康检查
curl http://localhost:8080/health

# 获取用户信息（无需认证，自动使用测试账号）
curl http://localhost:8080/api/users/me

# 创建角色（无需认证，自动使用测试账号）
curl -X POST http://localhost:8080/api/characters \
  -H "Content-Type: application/json" \
  -d '{
    "type": "soulmate",
    "title": "Your Soulmate",
    "gender": "Female",
    "ethnicity": "East Asian"
  }'
```

## 禁用开发模式

要禁用开发模式，只需：

1. 从 `.env` 文件中删除 `DEV_MODE=true`，或
2. 设置 `DEV_MODE=false`

禁用后，所有 API 将恢复正常的 Telegram 认证流程。
