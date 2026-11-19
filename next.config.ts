import type { NextConfig } from 'next';
import fs from 'fs';
import path from 'path';

// If a custom domain CNAME is present, GitHub Pages serves from root ('')
// Otherwise, on socialmediumben.github.io/hillel_app/ it uses '/hillel_app'
const hasCname = fs.existsSync(path.join(__dirname, 'public', 'CNAME')) || fs.existsSync(path.join(__dirname, 'CNAME'));
const isProd = process.env.NODE_ENV === 'production';
const basePath = hasCname ? '' : (process.env.NEXT_PUBLIC_BASE_PATH ?? (isProd ? '/hillel_app' : ''));

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
