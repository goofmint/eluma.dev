// Cloudflare Workers environment bindings
// Named CloudflareEnv to avoid conflict with app/lib/env.ts Env interface
export interface CloudflareEnv {
  ENVIRONMENT: string;
}
