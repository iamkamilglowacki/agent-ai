import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  reactStrictMode: true,
  experimental: {
    // Poprawia obsługę hydratacji
    optimizeCss: true,
    // Redukuje problemy z hydratacją
    scrollRestoration: true,
  },
  // Dodajemy konfigurację dla obrazów
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/**',
      },
    ],
  },
  // Poprawiamy obsługę hydratacji
  compiler: {
    styledComponents: true,
  },
};

export default nextConfig;
