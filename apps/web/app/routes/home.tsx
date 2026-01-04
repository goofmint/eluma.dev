import { useState } from 'react';
import { checkHealth, type HealthCheckResponse } from '../lib/api';
import type { Route } from './+types/home';

export function meta(_args: Route.MetaArgs) {
  return [
    { title: 'Eluma - AI Social Bookmark' },
    { name: 'description', content: 'AI-optimized social bookmark platform' },
  ];
}

export default function Home() {
  return (
    <div className="container">
      <header className="header">
        <h1>Eluma</h1>
        <p className="tagline">AI-Optimized Social Bookmark Platform</p>
      </header>

      <main className="main">
        <section className="hero">
          <h2>Welcome to Eluma</h2>
          <p>
            Eluma is a next-generation social bookmarking platform designed for
            the AI era. Save, organize, and share your bookmarks with powerful
            AI-assisted features.
          </p>
        </section>

        <section className="features">
          <h3>Features</h3>
          <ul>
            <li>Personal bookmark management</li>
            <li>AI-powered recommendations</li>
            <li>Channel-based content curation</li>
            <li>Smart comment moderation</li>
            <li>MCP integration for AI assistants</li>
          </ul>
        </section>

        <section className="status">
          <h3>API Status</h3>
          <HealthCheck />
        </section>
      </main>

      <footer className="footer">
        <p>&copy; 2025 Eluma. MIT License.</p>
      </footer>
    </div>
  );
}

function HealthCheck() {
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [data, setData] = useState<HealthCheckResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCheck = async () => {
    setStatus('loading');
    setError(null);
    try {
      const result = await checkHealth();
      setData(result);
      setStatus('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setStatus('error');
    }
  };

  return (
    <div className="health-check">
      <p>Check API status by clicking the button below.</p>
      <button onClick={handleCheck} disabled={status === 'loading'}>
        {status === 'loading' ? 'Checking...' : 'Check API Health'}
      </button>

      {status === 'success' && data && (
        <div className="health-result health-success">
          <p>
            <strong>Status:</strong> {data.status}
          </p>
          <p>
            <strong>Service:</strong> {data.service}
          </p>
          <p>
            <strong>Timestamp:</strong> {data.timestamp}
          </p>
        </div>
      )}

      {status === 'error' && (
        <div className="health-result health-error">
          <p>
            <strong>Error:</strong> {error}
          </p>
          <p>Make sure the API server is running.</p>
        </div>
      )}
    </div>
  );
}
