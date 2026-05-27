/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [],
  },
  experimental: {
    serverComponentsExternalPackages: ['@anthropic-ai/sdk', 'stripe'],
  },
  async redirects() {
    return [
      // /login → /signin に永続リダイレクト（PRERENDERキャッシュ回避）
      {
        source: '/login',
        destination: '/signin',
        permanent: false,
      },
    ]
  },
}

module.exports = nextConfig
