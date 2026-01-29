/** @type {import('next').NextConfig} */
const isGitHubPages = process.env.GITHUB_PAGES === 'true'
// GitHub Pages basePath 应该与实际的 GitHub Pages URL 路径一致
// 根据错误信息，实际路径是 /lauraAl/，所以这里需要匹配
const basePath = isGitHubPages ? '/lauraAl' : ''

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
}

export default nextConfig
