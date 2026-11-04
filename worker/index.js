
import { Hono } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { SignJWT, jwtVerify, createRemoteJWKSet } from 'jose';
import { getPeopleFromSheet } from './services/googleSheets.js';

const app = new Hono();

const GOOGLE_JWKS = createRemoteJWKSet(
    new URL('https://www.googleapis.com/oauth2/v3/certs')
);

const SESSION_COOKIE = 'kasatria_session';
const SESSION_DURATION = 60 * 60 * 24 * 7; // 7 days

function getSessionSecret(env) {
    if (!env.SESSION_SECRET) {
        throw new Error('SESSION_SECRET is not configured.');
    }

    return new TextEncoder().encode(env.SESSION_SECRET);
}

function isAuthorizedEmail(email, env) {
    const allowedEmails = (env.ALLOWED_EMAILS || '')
        .split(',')
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean);

    return allowedEmails.includes(email.toLowerCase());
}

function validateRequestOrigin(c) {
    const requestOrigin = c.req.header('Origin');
    const applicationOrigin = new URL(c.req.url).origin;

    return requestOrigin === applicationOrigin;
}

// Create our own application session.
async function createSession(user, env) {
    return new SignJWT({
        email: user.email,
        name: user.name,
        picture: user.picture,
    })
        .setProtectedHeader({ alg: 'HS256' })
        .setSubject(user.sub)
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(getSessionSecret(env));
}

// Verify our application session.
async function verifySession(token, env) {
    const { payload } = await jwtVerify(
        token,
        getSessionSecret(env),
        {
            algorithms: ['HS256'],
        }
    );

    return payload;
}

// Health check
app.get('/api/health', (c) => {
    return c.json({
        status: 'success',
        message: 'Kasatria backend is running!',
    });
});

// Google login
app.post('/api/auth/google', async (c) => {
    if (!validateRequestOrigin(c)) {
        return c.json(
            { message: 'Invalid request origin.' },
            403
        );
    }
    try {
        const { credential } = await c.req.json();

        if (typeof credential !== 'string' || !credential) {
            return c.json(
                { message: 'Google credential is required.' },
                400
            );
        }

        if (!c.env.GOOGLE_CLIENT_ID) {
            throw new Error('GOOGLE_CLIENT_ID is not configured.');
        }

        // Verify Google's ID token.
        const { payload } = await jwtVerify(
            credential,
            GOOGLE_JWKS,
            {
                issuer: [
                    'https://accounts.google.com',
                    'accounts.google.com',
                ],
                audience: c.env.GOOGLE_CLIENT_ID,
            }
        );

        if (
            !payload.sub ||
            !payload.email ||
            payload.email_verified !== true
        ) {
            return c.json(
                { message: 'Google account verification failed.' },
                401
            );
        }

        // Check whether the Google account is authorized.
        if (!isAuthorizedEmail(payload.email, c.env)) {
            return c.json(
                {
                    message: 'Your Google account is not authorized to access this application.',
                },
                403
            );
        }

        const user = {
            sub: payload.sub,
            email: payload.email,
            name: payload.name ?? '',
            picture: payload.picture ?? '',
        };

        // Create our application session.
        const sessionToken = await createSession(user, c.env);

        setCookie(c, SESSION_COOKIE, sessionToken, {
            httpOnly: true,
            secure: new URL(c.req.url).protocol === 'https:',
            sameSite: 'Lax',
            path: '/',
            maxAge: SESSION_DURATION,
        });

        return c.json({
            message: 'Login successful.',
            user,
        });
    } catch (error) {
        console.error('Google authentication failed:', error);

        return c.json(
            { message: 'Unable to authenticate with Google.' },
            401
        );
    }
});

// Check current session.
app.get('/api/auth/me', async (c) => {
    const token = getCookie(c, SESSION_COOKIE);

    if (!token) {
        return c.json({ user: null }, 401);
    }

    try {
        const session = await verifySession(token, c.env);

        return c.json({
            user: {
                id: session.sub,
                email: session.email,
                name: session.name,
                picture: session.picture,
            },
        });
    } catch {
        deleteCookie(c, SESSION_COOKIE, {
            path: '/',
        });

        return c.json({ user: null }, 401);
    }
});

// Logout.
app.post('/api/auth/logout', (c) => {
    if (!validateRequestOrigin(c)) {
        return c.json(
            { message: 'Invalid request origin.' },
            403
        );
    }

    deleteCookie(c, SESSION_COOKIE, {
        path: '/',
    });

    return c.json({
        message: 'Logged out successfully.',
    });
});


// Protected Google Sheets data endpoint.
app.get('/api/people', async (c) => {
    try {
        // 1. Retrieve the session cookie.
        const token = getCookie(c, SESSION_COOKIE);

        if (!token) {
            return c.json(
                { message: 'Unauthorized. Please sign in.' },
                401
            );
        }

        // 2. Verify the user's session.
        try {
            await verifySession(token, c.env);
        } catch {
            deleteCookie(c, SESSION_COOKIE, {
                path: '/',
            });

            return c.json(
                { message: 'Your session has expired.' },
                401
            );
        }

        // 3. Retrieve records from Google Sheets.
        const people = await getPeopleFromSheet(
            c.env
        );

        // 4. Return the records to the frontend.
        return c.json({
            success: true,
            count: people.length,
            data: people,
        });
    } catch (error) {
        console.error('Google Sheets retrieval failed:', error);

        return c.json(
            { message: 'Unable to retrieve Google Sheets data.' },
            500
        );
    }
});


export default app;
