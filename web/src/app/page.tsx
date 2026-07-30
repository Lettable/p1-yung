import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Navigation */}
      <nav className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-accent">P1 VoIP</div>
          <div className="space-x-4">
            <Link
              href="/auth/login"
              className="text-textSecondary hover:text-textPrimary transition"
            >
              Login
            </Link>
            <Link href="/auth/signup" className="btn-primary">
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Professional VoIP Call Center
          </h1>
          <p className="text-xl text-textSecondary mb-12 max-w-2xl mx-auto">
            Enterprise-grade call management platform with real-time monitoring, DTMF capture,
            and advanced analytics.
          </p>

          <div className="flex gap-4 justify-center">
            <Link href="/auth/signup" className="btn-primary text-lg px-8 py-3">
              Get Started
            </Link>
            <Link href="/auth/login" className="btn-secondary text-lg px-8 py-3">
              Login
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-24 grid md:grid-cols-3 gap-8">
          <div className="card text-center">
            <div className="text-4xl mb-4">📞</div>
            <h3 className="text-xl font-bold text-white mb-2">Bulk Campaigns</h3>
            <p className="text-textSecondary">
              Launch thousands of calls with advanced campaign management and real-time tracking.
            </p>
          </div>

          <div className="card text-center">
            <div className="text-4xl mb-4">🎵</div>
            <h3 className="text-xl font-bold text-white mb-2">Audio Management</h3>
            <p className="text-textSecondary">
              Upload custom greetings, access global audio library, manage scripts effortlessly.
            </p>
          </div>

          <div className="card text-center">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-bold text-white mb-2">Analytics</h3>
            <p className="text-textSecondary">
              Real-time call metrics, DTMF capture, and comprehensive performance dashboards.
            </p>
          </div>

          <div className="card text-center">
            <div className="text-4xl mb-4">🎙️</div>
            <h3 className="text-xl font-bold text-white mb-2">Agent Management</h3>
            <p className="text-textSecondary">
              Manage call extensions, handle incoming calls, track agent performance metrics.
            </p>
          </div>

          <div className="card text-center">
            <div className="text-4xl mb-4">💳</div>
            <h3 className="text-xl font-bold text-white mb-2">Flexible Billing</h3>
            <p className="text-textSecondary">
              Per-minute pricing, real-time balance tracking, admin-controlled topups.
            </p>
          </div>

          <div className="card text-center">
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-xl font-bold text-white mb-2">Enterprise Security</h3>
            <p className="text-textSecondary">
              Role-based access control, API keys, encrypted credentials, audit logs.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border mt-24">
        <div className="max-w-7xl mx-auto px-6 py-12 text-center text-textSecondary">
          <p>&copy; 2026 P1 VoIP Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
