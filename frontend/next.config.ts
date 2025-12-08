/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    proxyTimeout: 300000, // 300 seconds (5 minutes)
  },
  output: "standalone",
  async rewrites() {
    // Use environment variable to switch between local and Kubernetes
    const apiUrl = process.env.INTERNAL_API_URL || 'http://api:8999';
    
    return [
      // Auth routes stay in Next.js (NextAuth handles these)
      {
        source: '/api/auth/:path*', 
        destination: '/api/auth/:path*',
      },
      // All other /api routes go to middleware
      {
        source: '/api/:path*',
        destination: `${apiUrl}/:path*`,
      },
    ]
  },
};
export default nextConfig;