'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';

export default function BillingPage() {
  const { data: session, status } = useSession();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [topupAmount, setTopupAmount] = useState('');
  const [loading, setLoading] = useState(true);

  if (status === 'unauthenticated') redirect('/auth/login');
  if (status === 'loading') return <div className="text-center py-12">Loading...</div>;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [balanceRes, transRes] = await Promise.all([
          fetch('/api/billing/balance'),
          fetch('/api/billing/transactions'),
        ]);

        if (balanceRes.ok) {
          const { balance } = await balanceRes.json();
          setBalance(balance);
        }

        if (transRes.ok) {
          const data = await transRes.json();
          setTransactions(data);
        }
      } catch (error) {
        console.error('Error fetching billing data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleTopup = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(topupAmount);

    if (!amount || amount < 1) {
      alert('Enter valid amount (minimum €1)');
      return;
    }

    try {
      const response = await fetch('/api/billing/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Math.round(amount * 100) }),
      });

      if (response.ok) {
        const result = await response.json();
        setBalance(result.newBalance);
        setTopupAmount('');
        alert('Topup successful!');
      }
    } catch (error) {
      console.error('Error processing topup:', error);
      alert('Topup failed');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Billing & Balance</h1>

      {/* Balance Card */}
      <div className="card">
        <h2 className="text-sm font-semibold text-textSecondary mb-2">Account Balance</h2>
        <div className="text-5xl font-bold text-accent mb-4">
          €{(balance / 100).toFixed(2)}
        </div>
        <p className="text-textSecondary text-sm">Charge rate: €0.05 per minute</p>
      </div>

      {/* Topup Form */}
      <form onSubmit={handleTopup} className="card space-y-4">
        <h2 className="text-xl font-bold text-white">Add Balance</h2>

        <div>
          <label className="block text-sm font-medium text-textPrimary mb-2">Amount (EUR)</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={topupAmount}
              onChange={(e) => setTopupAmount(e.target.value)}
              placeholder="10.00"
              step="0.01"
              min="1"
              className="input flex-1"
              required
            />
            <button type="submit" className="btn-primary px-6">
              Top Up
            </button>
          </div>
        </div>

        <div className="flex gap-2 text-xs">
          {[10, 25, 50, 100].map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => setTopupAmount(amount.toString())}
              className="btn-secondary py-1 px-2 text-xs"
            >
              €{amount}
            </button>
          ))}
        </div>
      </form>

      {/* Transactions */}
      <div className="card">
        <h2 className="text-xl font-bold text-white mb-4">Transaction History</h2>

        {loading ? (
          <p className="text-textSecondary">Loading transactions...</p>
        ) : transactions.length === 0 ? (
          <p className="text-textSecondary">No transactions yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-textSecondary font-semibold">Date</th>
                  <th className="text-left py-3 px-4 text-textSecondary font-semibold">Type</th>
                  <th className="text-left py-3 px-4 text-textSecondary font-semibold">Amount</th>
                  <th className="text-left py-3 px-4 text-textSecondary font-semibold">Description</th>
                  <th className="text-left py-3 px-4 text-textSecondary font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx._id} className="border-b border-border hover:bg-surface/50">
                    <td className="py-3 px-4 text-textPrimary text-xs">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs font-semibold py-1 px-2 rounded ${
                        tx.type === 'topup' ? 'bg-accent/20 text-accent' : 'bg-danger/20 text-danger'
                      }`}>
                        {tx.type === 'topup' ? '⬆ Topup' : '⬇ Charge'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-white font-semibold">
                      {tx.type === 'topup' ? '+' : '-'}€{(tx.amount / 100).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-textSecondary text-sm">{tx.description}</td>
                    <td className="py-3 px-4">
                      <span className="text-xs text-textSecondary">{tx.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
