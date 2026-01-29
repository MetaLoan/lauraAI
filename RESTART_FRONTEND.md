# 重启前端开发服务器

## 问题
前端仍在使用旧的 `http://localhost:8081/api` 地址，而不是 ngrok 地址。

## 解决方案

### 方法一：重启开发服务器（推荐）

1. **停止当前运行的前端服务器**
   - 在运行 `npm run dev` 的终端按 `Ctrl+C`

2. **重新启动前端服务器**
   ```bash
   npm run dev
   ```

3. **验证配置**
   - 打开浏览器开发者工具
   - 查看 Network 标签
   - 确认 API 请求使用的是 ngrok 地址

### 方法二：使用启动脚本（自动重启）

```bash
# 停止所有服务
pkill -f "next dev"
pkill -f "ngrok"

# 使用启动脚本（会自动配置）
./start-dev-with-ngrok.sh
```

## 验证配置

重启后，检查浏览器控制台：
- ✅ 应该看到 API 请求使用：`https://nathalie-clothlike-urgently.ngrok-free.dev/api`
- ❌ 不应该看到：`http://localhost:8081/api`

## 当前配置

```bash
NEXT_PUBLIC_API_URL=https://nathalie-clothlike-urgently.ngrok-free.dev/api
```

**注意：** Next.js 在启动时读取环境变量，修改 `.env.local` 后必须重启服务器才能生效。
