import type { Config } from '@react-router/dev/config';

// Enable Vite Environment API only for Cloudflare Workers builds
const isCloudflare = process.env.BUILD_TARGET === 'cloudflare';

export default {
  ssr: true,
  future: {
    // Required for Cloudflare Workers with @cloudflare/vite-plugin
    v8_viteEnvironmentApi: isCloudflare,
  },
} satisfies Config;
