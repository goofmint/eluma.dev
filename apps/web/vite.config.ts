import { cloudflare } from '@cloudflare/vite-plugin';
import { reactRouter } from '@react-router/dev/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [reactRouter(), cloudflare({ viteEnvironment: { name: 'ssr' } })],
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
});
