import { getEnv } from './env';

export interface HealthCheckResponse {
  status: string;
  timestamp: string;
  service: string;
}

export async function checkHealth(): Promise<HealthCheckResponse> {
  const env = getEnv();
  const response = await fetch(`${env.VITE_API_URL}/healthz`);

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json();
}
