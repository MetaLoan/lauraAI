# API 配置说明

## 当前 API 地址

**ngrok 公网地址：**
```
https://nathalie-clothlike-urgently.ngrok-free.dev/api
```

## 配置方法

### 方式一：使用启动脚本（推荐）

运行 `./start-dev-with-ngrok.sh`，脚本会自动：
- 启动 ngrok
- 获取最新的公网 URL
- 创建 `.env.local` 文件并配置 API 地址

### 方式二：手动配置

1. 创建 `.env.local` 文件（如果不存在）：
   ```bash
   echo "NEXT_PUBLIC_API_URL=https://nathalie-clothlike-urgently.ngrok-free.dev/api" > .env.local
   ```

2. 重启前端开发服务器：
   ```bash
   npm run dev
   ```

## 环境变量说明

- **本地开发（无 ngrok）**: `http://localhost:8081/api`
- **ngrok 内网穿透**: `https://your-ngrok-url.ngrok-free.dev/api`
- **生产环境**: `https://your-production-api.com/api`

## 注意事项

⚠️ **ngrok 免费版限制：**
- URL 每次重启 ngrok 都会变化
- 如果 URL 变化，需要更新 `.env.local` 文件
- 建议使用 ngrok 付费版获得固定域名

## 查看当前配置

```bash
# 查看前端 API 配置
cat .env.local 2>/dev/null || echo "未配置"

# 查看 ngrok URL（如果正在运行）
curl -s http://localhost:4040/api/tunnels | python3 -c "import sys, json; data = json.load(sys.stdin); print(data['tunnels'][0]['public_url'] if data.get('tunnels') else 'ngrok 未运行')"
```
