'use client';

import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else if (result?.ok) {
        router.push(callbackUrl);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo / Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">P1 VoIP Platform</h1>
          <p className="text-textSecondary">Enterprise Call Center Dashboard</p>
        </div>

        {/* Login Form */}
        <div className="card">
          <h2 className="text-2xl font-bold text-white mb-6">Login</h2>

          {error && (
            <div className="mb-4 p-4 bg-danger bg-opacity-10 border border-danger rounded-md">
              <p className="text-danger text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-textPrimary mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                disabled={isLoading}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-textPrimary mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={isLoading}
                className="w-full"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-textSecondary text-sm">
              Don't have an account?{' '}
              <Link href="/auth/signup" className="text-accent hover:text-accentHover">
                Sign up
              </Link>
            </p>
          </div>
        </div>

        {/* Demo Credentials (for development) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 p-4 bg-surfaceLight border border-border rounded-md">
            <p className="text-textSecondary text-xs mb-2">Demo Credentials (Dev Only):</p>
            <p className="text-xs text-textSecondary">Email: admin@test.com</p>
            <p className="text-xs text-textSecondary">Password: password123</p>
          </div>
        )}
      </div>
    </div>
  );
}
