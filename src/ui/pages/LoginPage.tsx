import { FormEvent, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import './LoginPage.css';

export function LoginPage() {
  const { configured, loading, user, signInWithEmail, signOut } = useAuth();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      await signInWithEmail(email);
      setMessage('Magic link sent. Check your email to finish signing in.');
      setEmail('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send magic link.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <section className="login-page__panel">
        <h2>Account</h2>

        {!configured ? (
          <p className="login-page__notice">
            Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable account sync.
          </p>
        ) : null}

        {loading ? (
          <p className="login-page__muted">Checking session...</p>
        ) : user ? (
          <div className="login-page__signed-in">
            <div>
              <span className="login-page__label">Signed in as</span>
              <strong>{user.email ?? user.id}</strong>
            </div>
            <button className="login-page__button" type="button" onClick={() => void signOut()}>
              Sign out
            </button>
          </div>
        ) : (
          <form className="login-page__form" onSubmit={onSubmit}>
            <label className="login-page__field">
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                disabled={!configured || submitting}
                required
              />
            </label>
            <button
              className="login-page__button"
              type="submit"
              disabled={!configured || submitting}
            >
              {submitting ? 'Sending...' : 'Send magic link'}
            </button>
          </form>
        )}

        {message ? <p className="login-page__message">{message}</p> : null}
        {error ? <p className="login-page__error">{error}</p> : null}
      </section>
    </div>
  );
}
