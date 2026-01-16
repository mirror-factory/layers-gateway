/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  transpilePackages: ['@layers/models', '@layers/credits', '@layers/ui', '@layers/core'],
};

export default config;
