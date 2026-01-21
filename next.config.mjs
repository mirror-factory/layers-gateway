import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  // Transpile workspace packages
  transpilePackages: ['@layers/models', '@layers/credits'],
};

export default withMDX(config);
