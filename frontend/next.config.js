/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['flavorinthejar.com'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://agent-ai.up.railway.app/api/:path*',
      },
    ]
  }
}

module.exports = nextConfig
