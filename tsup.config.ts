import { defineConfig } from 'tsup'
import pkg from './package.json'

const external = [
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.devDependencies || {}),
  'path', 'fs', 'http', 'crypto', 'events', 'util', 'stream', 'url', 'os', 'zlib'
]

export default defineConfig({
  entry: {
    index: '_core/index.ts',
    oauth: '_core/oauth.ts',
    context: '_core/context.ts',
    vite: '_core/vite.ts',
    sdk: '_core/sdk.ts',
    env: '_core/env.ts',
    cookies: '_core/cookies.ts',
    systemRouter: '_core/systemRouter.ts',
    trpc: '_core/trpc.ts',
    db: 'db.ts',
    routers: 'routers.ts',
    storage: 'storage.ts',
    'socket/presence': 'socket/presence.ts',
  },
  format: ['cjs'],
  outDir: 'dist',
  minify: false,
  platform: 'node',
  skipLibCheck: true,
  silent: false,
  onSuccess: async () => {
    console.log('Build successful');
  },
  clean: false,
  dts: false,
  sourcemap: true,
  splitting: false,
  bundle: true,
  noExternal: [/^@shared/],
  external,
})
