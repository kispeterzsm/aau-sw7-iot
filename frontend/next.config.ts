/** @type {import('next').NextConfig} */
const nextConfig = {
  // Add this experimental flag to increase proxy timeout
  experimental: {
    proxyTimeout: 300000, // 300 seconds (5 minutes)
  },
  output: "standalone",
  async rewrites() {
    return [
    {
      source: '/api/auth/:path*', 
      destination: '/api/auth/:path*',
    },
    {
      source: '/api/:path*',
      destination: 'http://api:8999/:path*',
    },
  ]
  },
};

export default nextConfig;