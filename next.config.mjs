/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },

  basePath: '/dashboard',
  assetPrefix: '/dashboard',

  images: {
    unoptimized: true,
  },
};

export default nextConfig;