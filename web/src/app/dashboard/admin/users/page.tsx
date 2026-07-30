'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [topupAmount, setTopupAmount] = useState('');

  if (status === 'unauthenticated') redirect('/auth/login');
  if (status === 'loading') return <div className="text-center py-12">Loading...</div>;

  if ((session?.user as any)?.role !== 'admin') {
    return <div className="card text-center py-12 text-danger">Access denied</div>;
  }

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/admin/users');
        if (response.ok) {
          const data = await response.json();
          setUsers(data);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleTopup = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(topupAmount);

    if (!selectedUser || !amount) {
      alert('Select user and enter amount');
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${selectedUser._id}/topup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Math.round(amount * 100) }),
      });

      if (response.ok) {
        alert('Topup successful!');
        setTopupAmount('');
        setSelectedUser(null);

        // Refresh users
        const refreshRes = await fetch('/api/admin/users');
        if (refreshRes.ok) {
          setUsers(await refreshRes.json());
        }
      }
    } catch (error) {
      console.error('Error processing topup:', error);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">User Management</h1>

      {/* Users Table */}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 text-textSecondary font-semibold">Email</th>
              <th className="text-left py-3 px-4 text-textSecondary font-semibold">Username</th>
              <th className="text-left py-3 px-4 text-textSecondary font-semibold">Role</th>
              <th className="text-left py-3 px-4 text-textSecondary font-semibold">Balance</th>
              <th className="text-left py-3 px-4 text-textSecondary font-semibold">Calls</th>
              <th className="text-left py-3 px-4 text-textSecondary font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-textSecondary">
                  Loading users...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-textSecondary">
                  No users yet
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user._id} className="border-b border-border hover:bg-surface/50">
                  <td className="py-3 px-4 text-white">{user.email}</td>
                  <td className="py-3 px-4 text-textPrimary">{user.username}</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs font-semibold py-1 px-2 rounded ${
                      user.role === 'admin' ? 'bg-accent/20 text-accent' : 'bg-surface text-textSecondary'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-white">€{(user.accountBalance / 100).toFixed(2)}</td>
                  <td className="py-3 px-4 text-textSecondary">{user.totalCalls || 0}</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => setSelectedUser(user)}
                      className="text-accent hover:text-accent/80 text-sm"
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">{selectedUser.email}</h2>
              <button
                onClick={() => {
                  setSelectedUser(null);
                  setTopupAmount('');
                }}
                className="text-textSecondary text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 mb-4 text-sm">
              <div>
                <div className="text-textSecondary">Current Balance</div>
                <div className="text-2xl font-bold text-accent">
                  €{(selectedUser.accountBalance / 100).toFixed(2)}
                </div>
              </div>

              <div>
                <div className="text-textSecondary">Total Calls</div>
                <div className="text-white">{selectedUser.totalCalls || 0}</div>
              </div>

              <div>
                <div className="text-textSecondary">Status</div>
                <div className="text-white">
                  {selectedUser.isActive ? '✓ Active' : '✗ Inactive'}
                </div>
              </div>
            </div>

            {/* Topup Form */}
            <form onSubmit={handleTopup} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-textPrimary mb-2">
                  Add Balance (EUR)
                </label>
                <input
                  type="number"
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(e.target.value)}
                  placeholder="10.00"
                  step="0.01"
                  min="1"
                  className="input w-full"
                  required
                />
              </div>

              <div className="flex gap-2">
                <button type="submit" className="btn-primary flex-1">
                  Add Balance
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedUser(null);
                    setTopupAmount('');
                  }}
                  className="btn-secondary flex-1"
                >
                  Close
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
