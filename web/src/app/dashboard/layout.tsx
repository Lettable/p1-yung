'use client';

import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-textSecondary">Loading...</div>
      </div>
    );
  }

  const isAdmin = (session?.user as any)?.role === 'admin';

  return (
    <div className="min-h-screen bg-black flex">
      {/* Sidebar */}
      <aside className={`bg-surface border-r border-border transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="p-6 border-b border-border">
          <div className={`text-2xl font-bold text-accent ${!sidebarOpen && 'text-center'}`}>
            {sidebarOpen ? 'P1' : 'P'}
          </div>
        </div>

        <nav className="p-4 space-y-2">
          {/* Main Menu */}
          <div>
            {sidebarOpen && <div className="text-xs font-semibold text-textSecondary px-3 py-2">MAIN</div>}
            <Link
              href="/dashboard"
              className="flex items-center space-x-3 px-3 py-2 rounded hover:bg-surfaceLight transition"
            >
              <span className="text-lg">📊</span>
              {sidebarOpen && <span>Dashboard</span>}
            </Link>
            <Link
              href="/dashboard/dialer"
              className="flex items-center space-x-3 px-3 py-2 rounded hover:bg-surfaceLight transition"
            >
              <span className="text-lg">📞</span>
              {sidebarOpen && <span>Dialer</span>}
            </Link>
            <Link
              href="/dashboard/calls"
              className="flex items-center space-x-3 px-3 py-2 rounded hover:bg-surfaceLight transition"
            >
              <span className="text-lg">📋</span>
              {sidebarOpen && <span>Call History</span>}
            </Link>
          </div>

          {/* Management Menu */}
          <div>
            {sidebarOpen && <div className="text-xs font-semibold text-textSecondary px-3 py-2 mt-4">MANAGEMENT</div>}
            <Link
              href="/dashboard/agents"
              className="flex items-center space-x-3 px-3 py-2 rounded hover:bg-surfaceLight transition"
            >
              <span className="text-lg">👥</span>
              {sidebarOpen && <span>Agents</span>}
            </Link>
            <Link
              href="/dashboard/greetings"
              className="flex items-center space-x-3 px-3 py-2 rounded hover:bg-surfaceLight transition"
            >
              <span className="text-lg">🎵</span>
              {sidebarOpen && <span>Greetings</span>}
            </Link>
          </div>

          {/* Settings Menu */}
          <div>
            {sidebarOpen && <div className="text-xs font-semibold text-textSecondary px-3 py-2 mt-4">SETTINGS</div>}
            <Link
              href="/dashboard/billing"
              className="flex items-center space-x-3 px-3 py-2 rounded hover:bg-surfaceLight transition"
            >
              <span className="text-lg">💳</span>
              {sidebarOpen && <span>Billing</span>}
            </Link>
            <Link
              href="/dashboard/settings"
              className="flex items-center space-x-3 px-3 py-2 rounded hover:bg-surfaceLight transition"
            >
              <span className="text-lg">⚙️</span>
              {sidebarOpen && <span>Settings</span>}
            </Link>
          </div>

          {/* Admin Menu */}
          {isAdmin && (
            <div>
              {sidebarOpen && <div className="text-xs font-semibold text-accent px-3 py-2 mt-4">ADMIN</div>}
              <Link
                href="/dashboard/admin"
                className="flex items-center space-x-3 px-3 py-2 rounded hover:bg-surfaceLight transition"
              >
                <span className="text-lg">👑</span>
                {sidebarOpen && <span>Admin Panel</span>}
              </Link>
            </div>
          )}
        </nav>

        {/* Logout Button */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          <button
            onClick={() => signOut({ redirect: true, callbackUrl: '/' })}
            className="w-full btn-secondary text-center"
          >
            {sidebarOpen ? 'Logout' : '⬅️'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-surface border-b border-border px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-textSecondary hover:text-textPrimary"
            >
              {sidebarOpen ? '➜' : '⬅'}
            </button>
            <h1 className="text-2xl font-bold text-white">P1 VoIP Platform</h1>
          </div>
          <div className="text-textSecondary">{session?.user?.email}</div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
