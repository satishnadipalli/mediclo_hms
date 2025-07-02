/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  basePath: "/hms",
  assetPrefix: '/hms',
  trailingSlash: true,
  experimental: {
    serverActions: true,
    outputFileTracingRoot: undefined,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
