# 前端部署指南

## 部署到 GitHub Pages（推荐）

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
- `https://metaloan.github.io/lauraAI/`（如果仓库名是 lauraAI）
- 或查看 Actions 页面中的部署 URL

### 注意事项

- GitHub Pages 只支持静态网站，Next.js 会自动导出为静态文件
- 如果使用自定义域名，需要修改 `next.config.mjs` 中的 `basePath` 和 `assetPrefix`
- 首次部署可能需要几分钟时间

---

## 部署到 Vercel（备选方案）

### 1. 在 Vercel 创建项目

1. 访问 [Vercel](https://vercel.com)
2. 使用 GitHub 账号登录
3. 点击 "Add New Project"
4. 选择 `MetaLoan/lauraAI` 仓库
5. 配置项目：
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (默认)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next` (Next.js 默认)

### 2. 配置环境变量

在 Vercel 项目设置中添加以下环境变量：

- `NEXT_PUBLIC_API_URL`: 后端 API 地址（例如：`https://your-backend.com/api`）

### 3. 获取 Vercel 凭证

1. 访问 [Vercel Settings > Tokens](https://vercel.com/account/tokens)
2. 创建新的 Token，复制保存
3. 在项目设置中找到：
   - **Org ID**: 在项目设置页面 URL 中可以看到
   - **Project ID**: 在项目设置页面可以看到

### 4. 配置 GitHub Secrets

在 GitHub 仓库设置中添加以下 Secrets：

1. 访问 `Settings > Secrets and variables > Actions`
2. 添加以下 secrets：
   - `VERCEL_TOKEN`: Vercel Token
   - `VERCEL_ORG_ID`: Vercel 组织 ID
   - `VERCEL_PROJECT_ID`: Vercel 项目 ID
   - `NEXT_PUBLIC_API_URL`: 后端 API 地址（可选，如果已在 Vercel 中配置）

### 5. 触发部署

- **自动部署**: 推送到 `main` 分支会自动触发部署
- **手动部署**: 在 Actions 页面选择 "部署前端到 Vercel" workflow，点击 "Run workflow"

---

## 部署到 GitHub Pages（备选方案）

如果需要部署到 GitHub Pages，需要修改 `next.config.mjs`：

```javascript
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
}
```

然后创建 `.github/workflows/deploy-pages.yml`：

```yaml
name: 部署到 GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./out
```

---

## 注意事项

1. **环境变量**: 确保所有必要的环境变量都已配置
2. **API 地址**: 后端 API 需要支持 CORS，允许前端域名访问
3. **构建时间**: Vercel 免费版有构建时间限制
4. **域名**: Vercel 会自动提供 `your-project.vercel.app` 域名
