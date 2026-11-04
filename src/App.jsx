
import { useEffect, useState, useCallback } from 'react';
import PeriodicTable from './components/PeriodicTable.jsx';
import GoogleLogin from './components/GoogleLogin.jsx';
import UserAccount from './components/UserAccount.jsx';
import { getCurrentUser, getPeople, logout } from './lib/api.js';


export default function App() {
  const [people, setPeople] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const [signingOut, setSigningOut] = useState(false);

  const handleLogin = useCallback((userData) => {
    setUser(userData);
    setAuthError('');
  }, []);

  // Restore the existing session when the app loads.
  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const currentUser = await getCurrentUser();

        if (!cancelled) {
          setUser(currentUser);
        }
      } catch (err) {
        if (!cancelled) {
          setAuthError(
            err instanceof Error
              ? err.message
              : 'Unable to check your session.'
          );
        }
      } finally {
        if (!cancelled) {
          setAuthLoading(false);
        }
      }
    }

    checkSession();

    return () => {
      cancelled = true;
    };
  }, []);

  // Load Google Sheet data after authentication.

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function loadPeople() {
      setStatus('loading');
      setError('');

      try {
        const data = await getPeople();

        if (data.length === 0) {
          throw new Error('The Google Sheet returned no records.');
        }

        if (!cancelled) {
          setPeople(data);
          setStatus('ready');
        }
      } catch (caughtError) {
        if (!cancelled) {
          setPeople([]);

          setError(
            caughtError instanceof Error
              ? caughtError.message
              : 'Unable to load the Google Sheet.'
          );

          setStatus('error');
        }
      }
    }

    loadPeople();

    return () => {
      cancelled = true;
    };
  }, [user, reloadKey]);


  const handleLogout = async () => {
    setSigningOut(true);

    try {
      await logout();

      setUser(null);
      setPeople([]);
      setStatus('idle');
      setError('');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to sign out.'
      );
    } finally {
      setSigningOut(false);
    }
  };

  // Restore session before displaying the login screen.
  if (authLoading) {
    return (
      <main className="status-screen">
        <span className="spinner" />
        <p>Checking your session…</p>
      </main>
    );
  }

  if (authError) {
    return (
      <main className="status-screen">
        <section className="status-card" role="alert">
          <h1>Authentication error</h1>
          <p>{authError}</p>
          <button
            type="button"
            className="layout-button"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </section>
      </main>
    );
  }

  if (!user) {
    return <GoogleLogin onLogin={handleLogin} />;
  }

  if (status === 'idle' || status === 'loading') {
    return (
      <main className="status-screen">
        <span className="spinner" />
        <p>Loading Google Sheet data…</p>
      </main>
    );
  }

  if (status === 'error') {
    return (
      <main className="status-screen">
        <section className="status-card" role="alert">
          <h1>Could not load the data</h1>
          <p>{error}</p>

          <button
            type="button"
            className="layout-button"
            onClick={() => setReloadKey((key) => key + 1)}
          >
            Retry
          </button>

          <button
            type="button"
            className="signout-button"
            onClick={handleLogout}
            disabled={signingOut}
          >
            <span className="signout-label">
              {signingOut ? 'Signing out…' : 'Sign Out'}
            </span>
          </button>
        </section>
      </main>
    );
  }

  return (
    <PeriodicTable
      people={people}
      headerActions={
        <UserAccount
          user={user}
          onSignOut={handleLogout}
          signingOut={signingOut}
        />
      }
    />
  );
}
