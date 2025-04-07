/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['flavorinthejar.com'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: 'https://smakosz.flavorinthejar.com'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Accept, Content-Type, Authorization'
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true'
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig
