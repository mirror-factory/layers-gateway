/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  // Transpile workspace packages
  transpilePackages: ['@layers/models', '@layers/credits'],
};

export default config;
