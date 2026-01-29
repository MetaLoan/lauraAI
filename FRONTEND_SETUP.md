# 前端配置指南

## 1. 配置后端 API URL

在项目根目录创建 `.env.local` 文件：

```bash
# 后端 API 地址
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

如果后端运行在其他端口，请相应修改。

## 2. 启动前端开发服务器

```bash
npm run dev
# 或
pnpm dev
```

前端将在 `http://localhost:3000` 启动。

## 3. 测试 API 连接

确保后端服务已启动（`http://localhost:8080`），然后：

1. 在 Telegram Mini App 中打开应用
2. 完成用户引导流程
3. 尝试与 AI 角色聊天

## 4. 开发模式

如果需要在浏览器中测试（非 Telegram 环境），API 客户端会自动处理缺少 `initData` 的情况，但某些需要认证的接口可能会失败。

## 5. 注意事项

- 确保后端服务已启动
- 确保 `.env.local` 中的 `NEXT_PUBLIC_API_URL` 配置正确
- 在 Telegram Mini App 环境中，`initData` 会自动从 `window.Telegram.WebApp.initData` 获取
