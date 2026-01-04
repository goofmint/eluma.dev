import { describe, it, expect } from 'vitest';
import app from './index';

interface HealthResponse {
  status: string;
  timestamp: string;
  service: string;
}

interface RootResponse {
  message: string;
  version: string;
  docs: string;
}

describe('API Endpoints', () => {
  describe('GET /healthz', () => {
    it('should return health status', async () => {
      const res = await app.request('/healthz');
      expect(res.status).toBe(200);

      const body = (await res.json()) as HealthResponse;
      expect(body.status).toBe('ok');
      expect(body.service).toBe('eluma-api');
      expect(body.timestamp).toBeDefined();
    });
  });

  describe('GET /', () => {
    it('should return API info', async () => {
      const res = await app.request('/');
      expect(res.status).toBe(200);

      const body = (await res.json()) as RootResponse;
      expect(body.message).toBe('Eluma API');
      expect(body.version).toBeDefined();
    });
  });
});
