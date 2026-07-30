'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function CallsPage() {
  const { data: session, status } = useSession();
  const [calls, setCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCall, setSelectedCall] = useState<any>(null);
  const [filter, setFilter] = useState('all');

  if (status === 'unauthenticated') redirect('/auth/login');
  if (status === 'loading') return <div className="text-center py-12 text-textSecondary">Loading...</div>;

  useEffect(() => {
    const fetchCalls = async () => {
      try {
        const response = await fetch('/api/calls');
        if (response.ok) {
          const data = await response.json();
          setCalls(data);
        }
      } catch (error) {
        console.error('Error fetching calls:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCalls();
  }, []);

  const getStatusBadge = (status: string) => {
    const badgeConfig: Record<string, { variant: 'success' | 'danger' | 'warning' | 'info' | 'default'; icon: string }> = {
      answered: { variant: 'success', icon: '✅' },
      completed: { variant: 'success', icon: '✓' },
      failed: { variant: 'danger', icon: '❌' },
      ringing: { variant: 'warning', icon: '📞' },
      pending: { variant: 'info', icon: '⏳' },
    };
    const config = badgeConfig[status] || { variant: 'default' as const, icon: '❓' };
    return <Badge variant={config.variant}>{config.icon} {status}</Badge>;
  };

  const filteredCalls = filter === 'all' ? calls : calls.filter(c => c.status === filter);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-black text-white">📞 Call History</h1>
        <p className="text-textSecondary">View and manage all your call records</p>
      </div>

      {/* Filters */}
      <Card variant="elevated">
        <div className="flex flex-col md:flex-row gap-4">
          <Input
            placeholder="Search by phone number..."
            className="flex-1"
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2.5 bg-surface border border-border rounded-lg text-textPrimary focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="answered">✅ Answered</option>
            <option value="failed">❌ Failed</option>
            <option value="completed">✓ Completed</option>
            <option value="ringing">📞 Ringing</option>
          </select>
          <input type="date" className="px-4 py-2.5 bg-surface border border-border rounded-lg text-textPrimary focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer" />
        </div>
      </Card>

      {/* Calls Table */}
      <Card variant="elevated">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-textSecondary font-semibold">Time</th>
                <th className="text-left py-3 px-4 text-textSecondary font-semibold">Phone</th>
                <th className="text-left py-3 px-4 text-textSecondary font-semibold">Duration</th>
                <th className="text-left py-3 px-4 text-textSecondary font-semibold">Status</th>
                <th className="text-left py-3 px-4 text-textSecondary font-semibold">DTMF</th>
                <th className="text-left py-3 px-4 text-textSecondary font-semibold">Cost</th>
                <th className="text-left py-3 px-4 text-textSecondary font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-textSecondary">
                    ⏳ Loading calls...
                  </td>
                </tr>
              ) : filteredCalls.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-textSecondary">
                    No calls found
                  </td>
                </tr>
              ) : (
                filteredCalls.map((call) => (
                  <tr key={call._id} className="border-b border-border hover:bg-surface/50 transition">
                    <td className="py-3 px-4 text-textPrimary text-xs">
                      {new Date(call.startTime).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-textPrimary font-mono">{call.phoneNumber}</td>
                    <td className="py-3 px-4 text-textPrimary font-semibold">{call.duration}s</td>
                    <td className="py-3 px-4">
                      {getStatusBadge(call.status)}
                    </td>
                    <td className="py-3 px-4 text-textPrimary font-mono">{call.dtmfPressed || '-'}</td>
                    <td className="py-3 px-4 text-textPrimary font-semibold">€{(call.cost / 100).toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedCall(call)}
                      >
                        👁 View
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Call Details Modal */}
      {selectedCall && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card variant="elevated" className="max-w-md w-full">
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <h2 className="text-2xl font-bold text-white">📞 Call Details</h2>
                <button
                  onClick={() => setSelectedCall(null)}
                  className="text-textSecondary hover:text-textPrimary text-3xl leading-none hover:scale-125 transition"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-surface/50 rounded p-3">
                  <div className="text-xs text-textSecondary mb-1">Phone Number</div>
                  <div className="text-white font-mono text-lg">{selectedCall.phoneNumber}</div>
                </div>

                <div className="flex gap-3">
                  {getStatusBadge(selectedCall.status)}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-surface/50 rounded p-3">
                    <div className="text-xs text-textSecondary mb-1">Duration</div>
                    <div className="text-white font-bold text-xl">{selectedCall.duration}s</div>
                  </div>
                  <div className="bg-surface/50 rounded p-3">
                    <div className="text-xs text-textSecondary mb-1">Cost</div>
                    <div className="text-accent font-bold text-xl">€{(selectedCall.cost / 100).toFixed(2)}</div>
                  </div>
                </div>

                {selectedCall.dtmfPressed && (
                  <div className="bg-accent/10 border border-accent rounded p-3">
                    <div className="text-xs text-accent mb-1">DTMF Pressed</div>
                    <div className="text-white font-mono text-2xl">{selectedCall.dtmfPressed}</div>
                  </div>
                )}

                <div className="bg-surface/50 rounded p-3">
                  <div className="text-xs text-textSecondary mb-1">Started</div>
                  <div className="text-textPrimary text-sm">
                    {new Date(selectedCall.startTime).toLocaleString()}
                  </div>
                </div>

                {selectedCall.recordingUrl && (
                  <div className="bg-surface/50 rounded p-3">
                    <div className="text-xs text-textSecondary mb-2">🎙️ Recording</div>
                    <audio controls className="w-full rounded">
                      <source src={selectedCall.recordingUrl} type="audio/wav" />
                    </audio>
                  </div>
                )}
              </div>

              <Button
                variant="secondary"
                size="lg"
                onClick={() => setSelectedCall(null)}
                className="w-full"
              >
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
