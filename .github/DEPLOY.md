# 前端部署指南 - GitHub Pages

## 部署到 GitHub Pages

### 1. 启用 GitHub Pages

1. 访问仓库设置：`Settings > Pages`
2. 在 "Source" 部分选择：**Source**: `GitHub Actions`
3. 保存设置

### 2. 后端与 RPC（fly.io）

**构建时已写死为 fly.io，无需配置 Secrets：**

- **后端 API**：`https://soulface-backend.fly.dev/api`
- **RPC**：`https://soulface-rpc.fly.dev`

部署出的前端会固定请求上述后端，保证与 fly.io 一致。

### 3. 触发部署

- **自动部署**：推送到 `main` 或 `DESKTOP-BSC` 分支会触发部署
- **手动部署**：在 Actions 页选择「部署到 GitHub Pages」，点击 "Run workflow"

### 4. 访问网站

- **lauraAI 仓库**：`https://metaloan.github.io/lauraAI/`
- **lauradesktop 仓库**：`https://metaloan.github.io/lauradesktop/`

`basePath` 会根据当前仓库名自动设置（如 `MetaLoan/lauradesktop` → `/lauradesktop`）。

## 注意事项

1. **静态导出**：Pages 构建时使用 `output: 'export'`，产物在 `out` 目录
2. **API / RPC**：生产环境固定使用 fly.io 后端与 RPC，无需在仓库里配置 Secrets
3. **CORS**：后端需允许前端域名（如 `*.github.io`）访问
4. **部署时间**：首次部署约需数分钟
