/** @type {import('next').NextConfig} */

// CAPACITOR_BUILD=true のとき静的エクスポートモードでビルド
// 通常の Vercel デプロイには影響しない
const isCapacitorBuild = process.env.CAPACITOR_BUILD === 'true'

const nextConfig = {
  // Capacitorビルド時は静的HTMLとしてエクスポート
  // Vercelデプロイ時はSSRのまま（API Routes が動く）
  ...(isCapacitorBuild ? { output: 'export' } : {}),

  images: {
    remotePatterns: [],
    // Capacitorビルド時は画像最適化を無効化（静的エクスポートでは必須）
    unoptimized: isCapacitorBuild,
  },
  experimental: {
    serverComponentsExternalPackages: ['@anthropic-ai/sdk', 'stripe'],
  },
}

module.exports = nextConfig
