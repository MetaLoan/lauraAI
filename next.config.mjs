/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // GitHub Pages 部署配置
  output: 'export',
  // 如果使用自定义域名，取消下面的注释并设置正确的路径
  // basePath: process.env.NODE_ENV === 'production' ? '/lauraAI' : '',
  // assetPrefix: process.env.NODE_ENV === 'production' ? '/lauraAI' : '',
}

export default nextConfig
