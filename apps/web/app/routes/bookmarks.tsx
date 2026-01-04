import type { FormEvent } from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import type { Bookmark } from '../lib/api';
import { getBookmarks, createBookmark } from '../lib/api';

export default function Bookmarks() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadBookmarks();
    }
  }, [user]);

  const loadBookmarks = async () => {
    try {
      setLoading(true);
      const data = await getBookmarks();
      setBookmarks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bookmarks');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const newBookmark = await createBookmark({ url, title: title || undefined, note: note || undefined });
      setBookmarks([newBookmark, ...bookmarks]);
      setUrl('');
      setTitle('');
      setNote('');
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create bookmark');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (authLoading) {
    return <div className="loading">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="bookmarks-container">
      <header className="bookmarks-header">
        <h1>My Bookmarks</h1>
        <div className="header-actions">
          <span className="user-email">{user.email}</span>
          <button onClick={handleSignOut} className="sign-out-btn">Sign Out</button>
        </div>
      </header>

      {error && <div className="error-message">{error}</div>}

      <button onClick={() => setShowForm(!showForm)} className="add-bookmark-btn">
        {showForm ? 'Cancel' : '+ Add Bookmark'}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="bookmark-form">
          <div className="form-group">
            <label htmlFor="url">URL *</label>
            <input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              disabled={submitting}
              placeholder="https://example.com"
            />
          </div>
          <div className="form-group">
            <label htmlFor="title">Title</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={submitting}
              placeholder="Optional title"
            />
          </div>
          <div className="form-group">
            <label htmlFor="note">Note</label>
            <textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={submitting}
              placeholder="Your notes about this page"
              rows={3}
            />
          </div>
          <button type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : 'Save Bookmark'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="loading">Loading bookmarks...</div>
      ) : bookmarks.length === 0 ? (
        <div className="empty-state">
          <p>No bookmarks yet. Add your first bookmark!</p>
        </div>
      ) : (
        <ul className="bookmark-list">
          {bookmarks.map((bookmark) => (
            <li key={bookmark.id} className="bookmark-item">
              <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="bookmark-url">
                {bookmark.title || bookmark.url}
              </a>
              {bookmark.note && <p className="bookmark-note">{bookmark.note}</p>}
              <span className="bookmark-date">
                {new Date(bookmark.created_at).toLocaleDateString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
