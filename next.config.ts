import type { NextConfig } from 'next';

// Custom domain app.hillel818.org is active, so basePath is root ''
const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath: '',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
