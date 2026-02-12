/** @type {import('next').NextConfig} */
// Only enable static export when explicitly requested.
// This app contains dynamic routes like /chat/[id] that are incompatible with output: 'export'.
const isGitHubPages = process.env.NEXT_OUTPUT_EXPORT === 'true'
const normalizeBasePath = (input = '') => {
  if (!input) return ''
  const prefixed = input.startsWith('/') ? input : `/${input}`
  return prefixed.replace(/\/+$/, '')
}
const explicitBasePath = normalizeBasePath(process.env.NEXT_BASE_PATH || process.env.NEXT_PUBLIC_BASE_PATH || '')
const repoBasePath = normalizeBasePath(
  process.env.GITHUB_REPOSITORY ? process.env.GITHUB_REPOSITORY.split('/')[1] : ''
)
// GitHub Pages basePath: explicit env takes precedence, then repository name.
const basePath = isGitHubPages ? (explicitBasePath || repoBasePath) : ''

const nextConfig = {
  // GitHub Pages 需静态导出生成 out 目录
  ...(isGitHubPages && { output: 'export' }),
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
  basePath: basePath,
  assetPrefix: basePath,
  trailingSlash: true,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
    // API URL 由 .env.local 或环境变量控制，生产环境默认使用 fly.dev
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://lauraai-backend.fly.dev/api',
  },
  // 静态导出时不能用 rewrites；仅非 Pages 时代理本地 Hardhat
  ...(!isGitHubPages && {
    async rewrites() {
      return [{ source: '/hardhat-rpc', destination: 'http://127.0.0.1:8545' }]
    },
  }),
}

export default nextConfig
