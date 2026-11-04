import { useState } from 'react';
import { getInitials } from '../lib/tile.js';

function LogOutIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

export default function UserAccount({
  user,
  onSignOut,
  signingOut = false,
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const name = user?.name || user?.email || 'Account';
  const email = user?.email || '';
  const showImage = Boolean(user?.picture) && !imageFailed;

  return (
    <div className="user-account">
      {showImage ? (
        <img
          src={user.picture}
          alt={`${name} profile photo`}
          className="user-avatar"
          referrerPolicy="no-referrer"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span
          className="user-avatar user-avatar-fallback"
          aria-hidden="true"
        >
          {getInitials(name)}
        </span>
      )}

      <span className="user-meta">
        <span className="user-name" title={name}>
          {name}
        </span>
        {email && (
          <span className="user-email" title={email}>
            {email}
          </span>
        )}
      </span>

      <button
        type="button"
        className="signout-button"
        onClick={onSignOut}
        disabled={signingOut}
        aria-label="Sign out"
      >
        <LogOutIcon />
        <span className="signout-label">
          {signingOut ? 'Signing out…' : 'Sign out'}
        </span>
      </button>
    </div>
  );
}
