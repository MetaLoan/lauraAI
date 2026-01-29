/** @type {import('next').NextConfig} */
const isGitHubPages = process.env.GITHUB_PAGES === 'true'
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
}

export default nextConfig
