# 部署指南

## 本地部署测试

### 快速测试
```bash
# 运行部署测试脚本
./test-deploy.sh
```

### 手动测试
```bash
# 1. 安装依赖
npm install

# 2. 运行代码检查
npm run lint

# 3. 构建项目
npm run build

# 4. 启动生产服务器
npm run start
```

## 部署到 Vercel

### 方法 1: 通过 Vercel CLI
```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel

# 生产环境部署
vercel --prod
```

### 方法 2: 通过 GitHub 集成
1. 访问 [vercel.com](https://vercel.com)
2. 导入你的 GitHub 仓库
3. Vercel 会自动检测 Next.js 项目并配置部署

## 部署到其他平台

### Netlify
项目已配置为 Next.js，Netlify 会自动识别。

### Docker
```bash
# 构建 Docker 镜像
docker build -t laura-ai-clone .

# 运行容器
docker run -p 3000:3000 laura-ai-clone
```

## CI/CD

项目包含 GitHub Actions 工作流 (`.github/workflows/deploy-test.yml`)，会在以下情况自动运行：
- 推送到 main/master/develop 分支
- 创建 Pull Request
- 手动触发

## 环境变量

如果需要环境变量，创建 `.env.local` 文件：
```env
# 示例
NEXT_PUBLIC_API_URL=https://api.example.com
```

**注意**: `.env.local` 文件已在 `.gitignore` 中，不会被提交到仓库。

## 构建配置

- **框架**: Next.js 16
- **Node 版本**: 20+
- **包管理器**: npm/pnpm/yarn
- **构建输出**: `.next` 目录
- **TypeScript**: 已配置，构建时忽略类型错误（可在 `next.config.mjs` 中修改）
