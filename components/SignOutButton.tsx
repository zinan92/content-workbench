'use client';

import { useAuth } from './AuthProvider';

export function SignOutButton() {
  const { user, signOut } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-gray-600">
        {user.email}
      </span>
      <button
        onClick={signOut}
        className="text-sm text-gray-600 hover:text-gray-900 underline"
      >
        Sign out
      </button>
    </div>
  );
}
