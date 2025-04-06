/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['flavorinthejar.com'],
  },
  experimental: {
    serverActions: true,
  },
}

module.exports = nextConfig
