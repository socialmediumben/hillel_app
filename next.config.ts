import type { NextConfig } from 'next';

// When deployed to https://socialmediumben.github.io/hillel_app/
// the base path must match the GitHub repository name.
const isProd = process.env.NODE_ENV === 'production';
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? (isProd ? '/hillel_app' : '');

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
