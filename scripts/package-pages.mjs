import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const source = resolve('dist/client');
const destination = resolve('dist/github-pages');
const segments = (process.env.NEXT_PUBLIC_BASE_PATH || '').split('/').filter(Boolean);
if (segments.some(segment => !/^[a-zA-Z0-9_-][a-zA-Z0-9_.-]*$/.test(segment))) {
  throw new Error('The Pages base path must contain plain URL path segments.');
}
const prefixedAssets = resolve(source, ...segments);
if (!existsSync(resolve(source, 'index.html'))) {
  throw new Error('The static export is missing its index.html. Run the build first.');
}

rmSync(destination, { recursive: true, force: true });
mkdirSync(destination, { recursive: true });
// Pages already mounts this directory at its repository path. Vinext nests
// prefixed runtime assets under that path, leaving HTML and public assets at root.
for (const entry of readdirSync(source)) {
  if (segments.length && entry === segments[0]) continue;
  cpSync(resolve(source, entry), resolve(destination, entry), { recursive: true });
}
if (segments.length) {
  for (const entry of readdirSync(prefixedAssets)) {
    cpSync(resolve(prefixedAssets, entry), resolve(destination, entry), { recursive: true });
  }
}
const prefix = segments.length ? `/${segments.join('/')}/` : '/';
const html = readFileSync(resolve(destination, 'index.html'), 'utf8');
for (const [, url] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
  if (!url.startsWith('/') || url.startsWith('//')) continue;
  if (!url.startsWith(prefix) || !existsSync(resolve(destination, url.slice(prefix.length).split(/[?#]/)[0]))) {
    throw new Error(`The Pages export references a missing or incorrectly prefixed asset: ${url}`);
  }
}
console.log('GitHub Pages artifact ready in dist/github-pages.');
