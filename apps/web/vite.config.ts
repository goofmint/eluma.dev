import { reactRouter } from '@react-router/dev/vite';
import { defineConfig } from 'vite';

// Use cloudflare plugin only when building for Cloudflare Workers
const isCloudflare = process.env.BUILD_TARGET === 'cloudflare';

export default defineConfig(async () => {
  const plugins = [reactRouter()];

  if (isCloudflare) {
    const { cloudflare } = await import('@cloudflare/vite-plugin');
    plugins.push(cloudflare({ viteEnvironment: { name: 'ssr' } }));
  }

  return {
    plugins,
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: ['eluma.test', 'localhost'],
    },
  };
});
