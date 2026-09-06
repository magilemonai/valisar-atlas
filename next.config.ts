import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  // Navigation stays within this one page using hashes; only assets need a prefix.
  assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH || '',
  images: { unoptimized: true },
};

export default nextConfig;
