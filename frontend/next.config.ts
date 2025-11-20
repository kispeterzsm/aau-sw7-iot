import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  async rewrites() {
    return [
      {
        // Intercepts any request to /api/* from the client
        source: '/api/:path*',
        
        // Proxies it internally to the Docker service 'api' on port 8999.
        // This address is only reachable by the Next.js server running in the container.
        destination: 'http://api:8999/:path*', 
      },
    ];
  },
};

export default nextConfig;