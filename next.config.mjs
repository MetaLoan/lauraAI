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
  // 只打包用到的子模块，显著加快编译（Radix/图标等）
  experimental: {
    optimizePackageImports: [
      '@radix-ui/react-accordion',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-avatar',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-label',
      '@radix-ui/react-popover',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-select',
      '@radix-ui/react-separator',
      '@radix-ui/react-slider',
      '@radix-ui/react-slot',
      '@radix-ui/react-switch',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
      '@radix-ui/react-tooltip',
      'recharts',
    ],
  },
  // GitHub Pages 部署配置
  // output: 'export', // Removed for dynamic routing support in Web3 App pivot
  basePath: basePath,
  assetPrefix: basePath,
  trailingSlash: true,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
    // API URL 由 .env.local 或环境变量控制，生产环境默认使用 fly.dev
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://lauraai-backend.fly.dev/api',
  },
  // 仅代理本地 Hardhat；云端 RPC 由 app/cloud-rpc/route.ts 处理，避免 rewrite 的 TLS 不稳定
  async rewrites() {
    return [{ source: '/hardhat-rpc', destination: 'http://127.0.0.1:8545' }]
  },
}

export default nextConfig
