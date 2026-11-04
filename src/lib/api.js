
async function request(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        const error = new Error(
            data.message || `Request failed (${response.status}).`
        );

        error.status = response.status;
        throw error;
    }

    return data;
}

export async function loginWithGoogle(credential) {
    const data = await request('/api/auth/google', {
        method: 'POST',
        body: JSON.stringify({ credential }),
    });

    return data.user;
}

export async function getCurrentUser() {
    try {
        const data = await request('/api/auth/me');
        return data.user;
    } catch (error) {
        if (error.status === 401) {
            return null;
        }

        throw error;
    }
}

export async function getPeople() {
  const data = await request('/api/people');

  return data.data;
}

export async function logout() {
    return request('/api/auth/logout', {
        method: 'POST',
    });
}
