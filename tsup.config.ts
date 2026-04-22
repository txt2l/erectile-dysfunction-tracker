import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    server: 'server/_core/index.ts'
  },
  format: ['cjs'],
  outDir: 'dist',
  minify: false,
  platform: 'node',
  skipLibCheck: true,
  clean: false,
  dts: false,
  sourcemap: true,
  splitting: false,
  bundle: false, // Do not bundle dependencies to avoid native module issues
})
