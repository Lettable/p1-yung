'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [callerId, setCallerId] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  if (status === 'unauthenticated') redirect('/auth/login');
  if (status === 'loading') return <div className="text-center py-12">Loading...</div>;

  useEffect(() => {
    if (session?.user) {
      setFullName((session.user as any).fullName || '');
      setUsername((session.user as any).username || '');
      setApiKey((session.user as any).apiKey || '');
    }
  }, [session]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          username,
          callerId,
          notificationsEnabled,
        }),
      });

      if (response.ok) {
        alert('Profile updated!');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleRegenerateApiKey = async () => {
    if (!confirm('Regenerate API key? Previous key will be invalid.')) return;

    try {
      const response = await fetch('/api/user/regenerate-api-key', {
        method: 'POST',
      });

      if (response.ok) {
        const { apiKey: newKey } = await response.json();
        setApiKey(newKey);
        alert('API key regenerated!');
      }
    } catch (error) {
      console.error('Error regenerating API key:', error);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-3xl font-bold text-white">Settings</h1>

      {/* Profile Settings */}
      <form onSubmit={handleSaveProfile} className="card space-y-4">
        <h2 className="text-xl font-bold text-white mb-4">Profile Settings</h2>

        <div>
          <label className="block text-sm font-medium text-textPrimary mb-2">Email</label>
          <input
            type="email"
            value={session?.user?.email || ''}
            disabled
            className="input w-full opacity-50 cursor-not-allowed"
          />
          <p className="text-xs text-textSecondary mt-1">Email cannot be changed</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-textPrimary mb-2">Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="input w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-textPrimary mb-2">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled
            className="input w-full opacity-50 cursor-not-allowed"
          />
          <p className="text-xs text-textSecondary mt-1">Username cannot be changed</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-textPrimary mb-2">Default Caller ID</label>
          <input
            type="text"
            value={callerId}
            onChange={(e) => setCallerId(e.target.value)}
            placeholder="+34600000000"
            className="input w-full"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="notifications"
            checked={notificationsEnabled}
            onChange={(e) => setNotificationsEnabled(e.target.checked)}
            className="w-4 h-4 cursor-pointer"
          />
          <label htmlFor="notifications" className="text-sm text-textPrimary cursor-pointer">
            Enable notifications for call events
          </label>
        </div>

        <button type="submit" className="btn-primary w-full">
          Save Changes
        </button>
      </form>

      {/* API Key Settings */}
      <div className="card space-y-4">
        <h2 className="text-xl font-bold text-white mb-4">API Key</h2>

        <p className="text-sm text-textSecondary">
          Use your API key to access the platform programmatically. Keep it secret!
        </p>

        <div className="bg-surface rounded p-3 font-mono text-sm flex justify-between items-center">
          <span className="text-textSecondary">
            {showApiKey ? apiKey : '*'.repeat(apiKey.length)}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setShowApiKey(!showApiKey)}
              className="btn-secondary text-xs py-1 px-2"
            >
              {showApiKey ? 'Hide' : 'Show'}
            </button>
            <button
              onClick={() => navigator.clipboard.writeText(apiKey)}
              className="btn-secondary text-xs py-1 px-2"
            >
              Copy
            </button>
          </div>
        </div>

        <button
          onClick={handleRegenerateApiKey}
          className="btn-danger w-full"
        >
          Regenerate API Key
        </button>
      </div>

      {/* Account Danger Zone */}
      <div className="card border border-danger space-y-4">
        <h2 className="text-xl font-bold text-danger mb-4">Danger Zone</h2>

        <button className="btn-danger w-full">
          Delete Account (Irreversible)
        </button>
      </div>
    </div>
  );
}
