/** @type {import('next').NextConfig} */
const isGitHubPages = process.env.GITHUB_PAGES === 'true'
// GitHub Pages basePath 必须与仓库名完全一致（区分大小写）
const basePath = isGitHubPages ? '/lauraAI' : ''

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // GitHub Pages 部署配置
  output: 'export',
  basePath: basePath,
  assetPrefix: basePath,
  trailingSlash: true,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
    NEXT_PUBLIC_API_URL: 'https://lauraai-backend.fly.dev/api',
  },
}

export default nextConfig
