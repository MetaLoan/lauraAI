# Fly.io 部署指南

## 1. 安装 Fly CLI

```bash
# macOS
brew install flyctl

# 或使用官方脚本
curl -L https://fly.io/install.sh | sh
```

## 2. 登录 Fly.io

```bash
fly auth login
```

## 3. 首次部署（初始化应用）

```bash
cd backend
fly launch --no-deploy
```

按提示操作：
- App name: `lauraai-backend`（或自定义名称）
- Region: 选择 `hkg`（香港）或其他亚洲区域
- 不需要 PostgreSQL（使用外部数据库）
- 不需要 Redis

## 4. 创建持久化存储卷（Volume）

```bash
# 创建 uploads 数据卷（用于存储生成的图片）
fly volumes create uploads_data --size 10 --region sin
```

注意：`fly.toml` 中已配置将 volume 挂载到 `/root/uploads`。

## 5. 设置环境变量（Secrets）

```bash
# 设置 Telegram Bot Token
fly secrets set TELEGRAM_BOT_TOKEN="你的_bot_token"

# 设置 Gemini API Key
fly secrets set GEMINI_API_KEY="你的_gemini_api_key"

# 设置 PostgreSQL 连接字符串（使用外部数据库如 Supabase、Neon 等）
fly secrets set POSTGRES_DSN="host=xxx user=xxx password=xxx dbname=lauraai port=5432 sslmode=require"

# 设置上传目录路径（必须与 fly.toml 中的 volume 挂载路径一致）
fly secrets set UPLOADS_DIR="/root/uploads"
```

## 6. 部署

```bash
fly deploy
```

## 7. 查看日志

```bash
fly logs
```

## 8. 获取应用 URL

部署成功后，你的 API 地址是：
```
https://lauraai-backend.fly.dev/api
```

## 9. 更新前端配置

创建 `.env.production` 文件：
```bash
NEXT_PUBLIC_API_URL=https://lauraai-backend.fly.dev/api
```

## 常用命令

```bash
# 查看应用状态
fly status

# 查看日志
fly logs

# SSH 进入容器
fly ssh console

# 重启应用
fly apps restart

# 查看 secrets
fly secrets list

# 扩容
fly scale count 2
```

## 注意事项

1. **数据库**: Fly.io 的免费 PostgreSQL 有限制，建议使用 Supabase 或 Neon 的免费 PostgreSQL
2. **区域**: 选择离用户最近的区域（亚洲用户建议 hkg 或 sin）
3. **HTTPS**: Fly.io 自动提供 HTTPS 证书
4. **持久化存储**: 必须创建 volume 并设置 `UPLOADS_DIR` 环境变量，否则生成的图片会在容器重启后丢失
5. **Volume 区域**: Volume 必须与应用部署在同一区域（region）