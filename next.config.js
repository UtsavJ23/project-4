/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Change from 'export' to 'standalone'
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
    domains: ['firebasestorage.googleapis.com'],
  },
};

module.exports = nextConfig;
