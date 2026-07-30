'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';

export default function AdminBillingPage() {
  const { data: session, status } = useSession();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [chargeRate, setChargeRate] = useState(0.05);
  const [loading, setLoading] = useState(true);

  if (status === 'unauthenticated') redirect('/auth/login');
  if (status === 'loading') return <div className="text-center py-12">Loading...</div>;

  if ((session?.user as any)?.role !== 'admin') {
    return <div className="card text-center py-12 text-danger">Access denied</div>;
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/admin/billing/transactions');
        if (response.ok) {
          const data = await response.json();
          setTransactions(data);
        }
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSaveRate = async () => {
    try {
      const response = await fetch('/api/admin/settings/charge-rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chargeRate }),
      });

      if (response.ok) {
        alert('Charge rate updated!');
      }
    } catch (error) {
      console.error('Error saving rate:', error);
    }
  };

  const totalTopups = transactions
    .filter(t => t.type === 'topup')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalCharges = transactions
    .filter(t => t.type === 'charge')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Billing Management</h1>

      {/* Settings Card */}
      <div className="card space-y-4">
        <h2 className="text-xl font-bold text-white mb-4">Settings</h2>

        <div>
          <label className="block text-sm font-medium text-textPrimary mb-2">
            Charge Rate (€/minute)
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={chargeRate}
              onChange={(e) => setChargeRate(parseFloat(e.target.value))}
              step="0.01"
              className="input flex-1"
            />
            <button onClick={handleSaveRate} className="btn-primary px-6">
              Save
            </button>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card">
          <div className="text-textSecondary text-sm mb-2">Total Topups</div>
          <div className="text-3xl font-bold text-accent">€{(totalTopups / 100).toFixed(2)}</div>
        </div>

        <div className="card">
          <div className="text-textSecondary text-sm mb-2">Total Charges</div>
          <div className="text-3xl font-bold text-danger">€{(totalCharges / 100).toFixed(2)}</div>
        </div>
      </div>

      {/* Transactions */}
      <div className="card overflow-x-auto">
        <h2 className="text-xl font-bold text-white mb-4">Transaction Log</h2>

        {loading ? (
          <p className="text-textSecondary">Loading...</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-textSecondary font-semibold">Date</th>
                <th className="text-left py-3 px-4 text-textSecondary font-semibold">User</th>
                <th className="text-left py-3 px-4 text-textSecondary font-semibold">Type</th>
                <th className="text-left py-3 px-4 text-textSecondary font-semibold">Amount</th>
                <th className="text-left py-3 px-4 text-textSecondary font-semibold">Description</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx._id} className="border-b border-border hover:bg-surface/50">
                  <td className="py-3 px-4 text-textPrimary text-xs">
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-textPrimary">{tx.userId?.email || 'Unknown'}</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs font-semibold py-1 px-2 rounded ${
                      tx.type === 'topup' ? 'bg-accent/20 text-accent' : 'bg-danger/20 text-danger'
                    }`}>
                      {tx.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-white font-semibold">
                    €{(tx.amount / 100).toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-textSecondary text-xs">{tx.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
