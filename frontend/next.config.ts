/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    proxyTimeout: 300000,
  },
  output: "standalone",
  async rewrites() {
    return [
      {
        source: '/api/search/:path*',
        destination: 'http://middleware-service:8999/search/:path*', // Strip /api prefix for kubernetes
      },
      {
        source: '/api/:path*',
        destination: 'http://middleware-service:8999/:path*', // For other endpoints
      },
    ]
  },
};
export default nextConfig;