/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [],
  },
  experimental: {
    serverComponentsExternalPackages: ['@anthropic-ai/sdk', 'stripe'],
  },
}

module.exports = nextConfig
