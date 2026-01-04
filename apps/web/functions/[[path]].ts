import { createPagesFunctionHandler } from '@react-router/cloudflare';

// @ts-expect-error - Virtual module from React Router build
// eslint-disable-next-line import/no-unresolved
import * as serverBuild from '../build/server';

export const onRequest = createPagesFunctionHandler({
  build: serverBuild,
  getLoadContext: (context) => ({
    cloudflare: context,
  }),
});
