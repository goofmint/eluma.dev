import type { Config } from '@react-router/dev/config';

export default {
  ssr: true,
  // Use Cloudflare preset for production deployment
  // Falls back to Node.js for local development
} satisfies Config;
