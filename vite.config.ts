import { defineConfig } from 'vite';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, relative } from 'node:path';
import { serviceWorker } from './scripts/service-worker.ts';

const buildId = process.env.VITE_BUILD_ID || '0.1.0-m0.1';
const base = process.env.VITE_BASE_PATH || '/castaway-angler/';
function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? files(join(dir, e.name)) : [join(dir, e.name)]);
}
export default defineConfig({
  base,
  define: { __BUILD_ID__: JSON.stringify(buildId) },
  build: { target: 'es2022', sourcemap: false, chunkSizeWarningLimit: 1800 },
  server: { port: 5173, strictPort: true }, preview: { port: 4173, strictPort: true },
  plugins: [{ name: 'castaway-offline', apply: 'build', closeBundle() {
    const assets = files('dist').map(p => relative('dist', p).replaceAll('\\', '/')).filter(p => !p.endsWith('.map') && p !== 'sw.js');
    const hash = createHash('sha256');
    for (const asset of assets) hash.update(readFileSync(join('dist', asset)));
    writeFileSync('dist/sw.js', serviceWorker(`${buildId}-${hash.digest('hex').slice(0,12)}`, assets));
  } }],
  test: { include: ['tests/**/*.test.ts'], environment: 'node' },
} as any);

