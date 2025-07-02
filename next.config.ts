/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  basePath: "/hms",
  experimental: {
    serverActions: true
  }

  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has type errors.
    ignoreDuringBuilds: true,
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
