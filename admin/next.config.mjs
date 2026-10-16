/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@staple/shared'],
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
