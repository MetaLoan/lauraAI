# 前端部署指南 - GitHub Pages

## 部署到 GitHub Pages

### 1. 启用 GitHub Pages

1. 访问仓库设置：`Settings > Pages`
2. 在 "Source" 部分选择：
   - **Source**: `GitHub Actions`
3. 保存设置

### 2. 配置环境变量（可选）

如果需要配置后端 API 地址：

1. 访问 `Settings > Secrets and variables > Actions`
2. 添加 secret：
   - `NEXT_PUBLIC_API_URL`: 后端 API 地址（例如：`https://your-backend.com/api`）

### 3. 触发部署

- **自动部署**: 推送到 `main` 分支会自动触发部署
- **手动部署**: 在 Actions 页面选择 "部署到 GitHub Pages" workflow，点击 "Run workflow"

### 4. 访问网站

部署完成后，网站将在以下地址可用：
- `https://metaloan.github.io/lauraAI/`
- 或查看 Actions 页面中的部署 URL

**重要：** 如果您的 GitHub Pages URL 路径不同（例如 `/lauraAl/`），需要修改 `next.config.mjs` 中的 `basePath` 值以匹配实际路径。

## 注意事项

1. **静态网站**: GitHub Pages 只支持静态网站，Next.js 会自动导出为静态文件
2. **basePath**: 如果使用自定义域名，需要修改 `next.config.mjs` 中的 `basePath` 和 `assetPrefix`
3. **部署时间**: 首次部署可能需要几分钟时间
4. **环境变量**: 确保所有必要的环境变量都已配置
5. **API 地址**: 后端 API 需要支持 CORS，允许前端域名访问
6. **构建输出**: 构建后的文件在 `out` 目录中
