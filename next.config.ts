import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  // Pages mounts both exported routes at its repository path. Public links use
  // sitePath; assetPrefix handles the framework’s runtime assets.
  assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH || '',
  // Vinext redirects non-root prerender requests with trailingSlash enabled.
  // The Pages packaging step supplies directory indexes after the static export.
  images: { unoptimized: true },
};

export default nextConfig;
