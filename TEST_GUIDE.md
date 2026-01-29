# 测试指南

## 当前配置状态

- ✅ PostgreSQL 数据库已创建 (`lauraai`)
- ✅ 后端配置文件已创建 (`.env`)
- ✅ 前端配置文件已创建 (`.env.local`)
- ⚠️  端口 8080 被占用，已改为 8081
- ✅ 数据库连接正常

## 快速测试步骤

### 1. 启动后端服务

```bash
cd backend
./test-start.sh
```

或者：

```bash
cd backend
go run cmd/server/main.go
```

后端将在 `http://localhost:8081` 启动。

### 2. 验证后端服务

**方法 1: 使用测试脚本**
```bash
cd backend
./test-api.sh
```

**方法 2: 使用 curl**
```bash
curl http://localhost:8081/health
```

应该返回：
```json
{"status":"ok"}
```

**方法 3: 在浏览器中打开**
```
http://localhost:8081/health
```

### 3. 启动前端服务

```bash
npm run dev
# 或
pnpm dev
```

前端将在 `http://localhost:3000` 启动。

### 4. 测试完整流程

1. **在浏览器中打开前端**
   - 访问 `http://localhost:3000`
   - 注意：某些功能需要 Telegram 环境

2. **在 Telegram Mini App 中测试**
   - 将前端部署到可访问的 URL
   - 在 Telegram Bot 中设置 Web App URL
   - 在 Telegram Mini App 中打开应用
   - 完成用户引导流程
   - 创建 AI 角色
   - 与角色聊天

## API 测试

### 健康检查（无需认证）

```bash
curl http://localhost:8081/health
```

### 需要认证的端点

这些端点需要 Telegram `initData`，在 Telegram Mini App 环境中会自动提供：

```bash
# 获取当前用户信息
curl -H "X-Telegram-Init-Data: <initData>" \
     http://localhost:8081/api/users/me

# 获取所有角色
curl -H "X-Telegram-Init-Data: <initData>" \
     http://localhost:8081/api/characters

# 创建角色
curl -X POST \
     -H "X-Telegram-Init-Data: <initData>" \
     -H "Content-Type: application/json" \
     -d '{"type":"soulmate","gender":"Female","ethnicity":"East Asian"}' \
     http://localhost:8081/api/characters
```

## 常见问题

### Q: 后端启动失败，提示数据库连接错误

**解决方案：**
1. 检查 PostgreSQL 是否运行：
   ```bash
   pg_isready
   ```

2. 检查 `.env` 文件中的 `POSTGRES_DSN`：
   ```bash
   cat backend/.env | grep POSTGRES_DSN
   ```

3. 测试数据库连接：
   ```bash
   psql -h localhost -U postgres -d lauraai -c "SELECT 1;"
   ```

4. 如果使用密码，确保 `.env` 中的密码正确：
   ```env
   POSTGRES_DSN=host=localhost user=postgres password=your_password dbname=lauraai port=5432 sslmode=disable
   ```

### Q: 端口被占用

**解决方案：**
1. 查看占用端口的进程：
   ```bash
   lsof -i:8081
   ```

2. 停止占用端口的服务，或修改 `.env` 中的 `PORT` 为其他端口

3. 同时更新 `.env.local` 中的 `NEXT_PUBLIC_API_URL`

### Q: 前端无法连接后端

**解决方案：**
1. 确认后端服务已启动：
   ```bash
   curl http://localhost:8081/health
   ```

2. 检查 `.env.local` 中的 `NEXT_PUBLIC_API_URL`：
   ```bash
   cat .env.local
   ```

3. 检查浏览器控制台的错误信息

### Q: Telegram 认证失败

**解决方案：**
1. 确保在 Telegram Mini App 环境中运行
2. 检查 `TELEGRAM_BOT_TOKEN` 是否正确配置
3. 查看后端日志中的错误信息

## 下一步

- 查看 `backend/README.md` 了解完整的 API 文档
- 查看 `backend/NEXT_STEPS.md` 了解前端集成建议
- 开始完善前端与后端的集成
