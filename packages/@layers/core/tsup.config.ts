import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'credits/index': 'src/credits/index.ts',
    'users/index': 'src/users/index.ts',
    'auth/index': 'src/auth/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
});
