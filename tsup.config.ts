import { defineConfig } from 'tsup'
import pkg from './package.json'

const external = [
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.devDependencies || {}),
  'path', 'fs', 'http', 'crypto', 'events', 'util', 'stream', 'url', 'os', 'zlib'
]

export default defineConfig({
  entry: {
    server: 'server/_core/index.ts',
    oauth: 'server/_core/oauth.ts',
    context: 'server/_core/context.ts',
    vite: 'server/_core/vite.ts',
    sdk: 'server/_core/sdk.ts',
    env: 'server/_core/env.ts',
    cookies: 'server/_core/cookies.ts',
    systemRouter: 'server/_core/systemRouter.ts',
    trpc: 'server/_core/trpc.ts',
    db: 'server/db.ts',
    routers: 'server/routers.ts',
    storage: 'server/storage.ts',
    'socket/presence': 'server/socket/presence.ts',
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
  bundle: true,
  noExternal: [/^@shared/],
  external,
})
