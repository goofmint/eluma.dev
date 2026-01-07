import { getEnv } from './env';
import { getAccessToken } from './supabase';

// Types
export interface HealthCheckResponse {
  status: string;
  timestamp: string;
  service: string;
}

export interface Bookmark {
  id: string;
  owner_user_id: string;
  url: string;
  title: string | null;
  note: string | null;
  visibility: 'friends' | 'followers' | 'public' | 'org';
  created_at: string;
  updated_at: string;
}

export interface CreateBookmarkInput {
  url: string;
  title?: string;
  note?: string;
  visibility?: 'friends' | 'followers' | 'public' | 'org';
}

export interface ApiError {
  error: string;
  code?: string;
}

// Helper to make authenticated requests
async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const token = await getAccessToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  return fetch(url, { ...options, headers });
}

// Health check (no auth required)
export async function checkHealth(): Promise<HealthCheckResponse> {
  const env = getEnv();
  const response = await fetch(`${env.VITE_API_URL}/healthz`);

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json();
}

// Bookmark API
export async function getBookmarks(): Promise<Bookmark[]> {
  const env = getEnv();
  const response = await fetchWithAuth(`${env.VITE_API_URL}/bookmarks`);

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error || `Request failed: ${response.status}`);
  }

  return response.json();
}

export async function createBookmark(input: CreateBookmarkInput): Promise<Bookmark> {
  const env = getEnv();
  const response = await fetchWithAuth(`${env.VITE_API_URL}/bookmarks`, {
    method: 'POST',
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error || `Request failed: ${response.status}`);
  }

  return response.json();
}

export async function getBookmark(id: string): Promise<Bookmark> {
  const env = getEnv();
  const response = await fetchWithAuth(`${env.VITE_API_URL}/bookmarks/${id}`);

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error || `Request failed: ${response.status}`);
  }

  return response.json();
}
