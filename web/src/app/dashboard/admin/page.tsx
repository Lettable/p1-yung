'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  if (status === 'unauthenticated') redirect('/auth/login');
  if (status === 'loading') return <div className="text-center py-12">Loading...</div>;

  if ((session?.user as any)?.role !== 'admin') {
    return (
      <div className="card text-center py-12">
        <h1 className="text-2xl font-bold text-danger mb-2">Access Denied</h1>
        <p className="text-textSecondary">You don't have permission to access the admin panel.</p>
      </div>
    );
  }

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('/api/admin/analytics');
        if (response.ok) {
          const data = await response.json();
          setAnalytics(data);
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>

      {/* Stats Grid */}
      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="card">
              <div className="text-textSecondary text-sm mb-2">Total Calls</div>
              <div className="text-3xl font-bold text-white">{analytics?.totalCalls || 0}</div>
            </div>

            <div className="card">
              <div className="text-textSecondary text-sm mb-2">Total Answered</div>
              <div className="text-3xl font-bold text-accent">{analytics?.totalAnswered || 0}</div>
            </div>

            <div className="card">
              <div className="text-textSecondary text-sm mb-2">Total Revenue</div>
              <div className="text-3xl font-bold text-white">
                €{((analytics?.totalRevenue || 0) / 100).toFixed(2)}
              </div>
            </div>

            <div className="card">
              <div className="text-textSecondary text-sm mb-2">Active Users</div>
              <div className="text-3xl font-bold text-white">{analytics?.activeUsers || 0}</div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid md:grid-cols-3 gap-4">
            <a href="/dashboard/admin/users" className="card hover:bg-surface/80 transition cursor-pointer">
              <div className="text-4xl mb-2">👥</div>
              <h3 className="font-bold text-white mb-1">Manage Users</h3>
              <p className="text-xs text-textSecondary">View, topup, and manage user accounts</p>
            </a>

            <a href="/dashboard/admin/billing" className="card hover:bg-surface/80 transition cursor-pointer">
              <div className="text-4xl mb-2">💳</div>
              <h3 className="font-bold text-white mb-1">Billing</h3>
              <p className="text-xs text-textSecondary">Transaction logs and payment settings</p>
            </a>

            <a href="/dashboard/admin/monitoring" className="card hover:bg-surface/80 transition cursor-pointer">
              <div className="text-4xl mb-2">📊</div>
              <h3 className="font-bold text-white mb-1">Live Monitoring</h3>
              <p className="text-xs text-textSecondary">Monitor all active campaigns</p>
            </a>
          </div>
        </>
      )}
    </div>
  );
}
