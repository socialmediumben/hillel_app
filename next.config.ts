import type { NextConfig } from 'next';

const isGithubPages = process.env.GITHUB_PAGES === 'true';
const repoName = process.env.NEXT_PUBLIC_BASE_PATH || '';

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath: repoName,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
