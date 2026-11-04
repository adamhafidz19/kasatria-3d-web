
import { useCallback, useEffect, useRef, useState } from 'react';
import { loginWithGoogle } from '../lib/api.js';

export default function GoogleLogin({ onLogin }) {
    const buttonRef = useRef(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleGoogleResponse = useCallback(async (response) => {
        try {
            setError('');

            if (!response.credential) {
                throw new Error('Google did not return an ID token.');
            }

            setLoading(true);

            // Send the Google ID token to our Hono backend.
            // The backend verifies it and creates our session cookie.
            const user = await loginWithGoogle(response.credential);

            // Pass the verified user information to App.jsx.
            onLogin(user);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Google sign-in failed.'
            );
        } finally {
            setLoading(false);
        }
    }, [onLogin]);

    useEffect(() => {
        let cancelled = false;

        const initialize = () => {
            if (
                cancelled ||
                !window.google ||
                !buttonRef.current
            ) {
                return;
            }

            const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

            if (!clientId) {
                setError('Google Client ID is not configured.');
                return;
            }

            window.google.accounts.id.initialize({
                client_id: clientId,
                callback: handleGoogleResponse,
            });

            buttonRef.current.innerHTML = '';

            window.google.accounts.id.renderButton(
                buttonRef.current,
                {
                    theme: 'outline',
                    size: 'large',
                    text: 'signin_with',
                    shape: 'rectangular',
                    width: 280,
                }
            );
        };

        let script = document.getElementById('google-identity-script');

        if (window.google) {
            initialize();
        } else if (script) {
            script.addEventListener('load', initialize);
        } else {
            script = document.createElement('script');
            script.id = 'google-identity-script';
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            script.onload = initialize;
            script.onerror = () => {
                if (!cancelled) {
                    setError('Unable to load Google sign-in.');
                }
            };

            document.head.appendChild(script);
        }

        return () => {
            cancelled = true;
            script?.removeEventListener('load', initialize);
        };
    }, [handleGoogleResponse]);

    return (
        <main className="status-screen">
            <section className="status-card login-card">
                <h1>Sign In With Google</h1>

                <p>
                    Welcome back. Please sign in to access
                    the 3D visualization.
                </p>

                <div
                    ref={buttonRef}
                    className="google-login-button"
                />

                {loading && (
                    <p>Authenticating your Google account…</p>
                )}

                {error && (
                    <p role="alert" className="error-message">
                        {error}
                    </p>
                )}
            </section>
        </main>
    );
}
