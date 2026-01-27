/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },

  // Important: make Next generate all URLs and assets under /dashboard
  basePath: '/dashboard',
  assetPrefix: '/dashboard',

  images: {
    unoptimized: true,
  },
};

export default nextConfig;