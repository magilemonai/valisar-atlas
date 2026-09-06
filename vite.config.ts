import { sites } from '@openai/sites-vite-plugin';
import tailwindcss from '@tailwindcss/postcss';
import vinext from 'vinext';
import { defineConfig } from 'vite';
import { existsSync } from 'node:fs';
export default defineConfig({
  css: { postcss: { plugins: [tailwindcss()] } },
  server: { watch: { useFsEvents: false, usePolling: true } },
  plugins: [vinext(), ...(process.env.GITHUB_PAGES !== 'true' && existsSync('.openai/hosting.json') ? [sites()] : [])],
});
