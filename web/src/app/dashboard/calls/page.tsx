'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';

export default function CallsPage() {
  const { data: session, status } = useSession();
  const [calls, setCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCall, setSelectedCall] = useState<any>(null);

  if (status === 'unauthenticated') redirect('/auth/login');
  if (status === 'loading') return <div className="text-center py-12">Loading...</div>;

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'answered':
        return 'bg-accent/20 text-accent';
      case 'completed':
        return 'bg-accent/20 text-accent';
      case 'failed':
        return 'bg-danger/20 text-danger';
      case 'ringing':
        return 'bg-blue-500/20 text-blue-400';
      default:
        return 'bg-surface text-textSecondary';
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Call History</h1>

      {/* Filters */}
      <div className="card flex gap-4">
        <input
          type="text"
          placeholder="Search by phone number..."
          className="input flex-1"
        />
        <select className="input">
          <option>All Status</option>
          <option>Answered</option>
          <option>Failed</option>
          <option>Completed</option>
        </select>
        <input type="date" className="input" />
      </div>

      {/* Calls Table */}
      <div className="card overflow-x-auto">
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
                  Loading calls...
                </td>
              </tr>
            ) : calls.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-textSecondary">
                  No calls yet
                </td>
              </tr>
            ) : (
              calls.map((call) => (
                <tr key={call._id} className="border-b border-border hover:bg-surface/50 transition">
                  <td className="py-3 px-4 text-textPrimary">
                    {new Date(call.startTime).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-textPrimary font-mono">{call.phoneNumber}</td>
                  <td className="py-3 px-4 text-textPrimary">{call.duration}s</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs font-semibold py-1 px-2 rounded ${getStatusColor(call.status)}`}>
                      {call.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-textPrimary">{call.dtmfPressed || '-'}</td>
                  <td className="py-3 px-4 text-textPrimary">€{(call.cost / 100).toFixed(2)}</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => setSelectedCall(call)}
                      className="text-accent hover:text-accent/80 text-sm"
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Call Details Modal */}
      {selectedCall && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Call Details</h2>
              <button
                onClick={() => setSelectedCall(null)}
                className="text-textSecondary hover:text-textPrimary text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <div className="text-textSecondary">Phone</div>
                <div className="text-white font-mono text-lg">{selectedCall.phoneNumber}</div>
              </div>

              <div>
                <div className="text-textSecondary">Status</div>
                <div className={`text-white font-semibold ${getStatusColor(selectedCall.status)}`}>
                  {selectedCall.status}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-textSecondary">Duration</div>
                  <div className="text-white font-semibold">{selectedCall.duration}s</div>
                </div>
                <div>
                  <div className="text-textSecondary">Cost</div>
                  <div className="text-white font-semibold">€{(selectedCall.cost / 100).toFixed(2)}</div>
                </div>
              </div>

              {selectedCall.dtmfPressed && (
                <div>
                  <div className="text-textSecondary">DTMF Pressed</div>
                  <div className="text-white font-mono text-lg">{selectedCall.dtmfPressed}</div>
                </div>
              )}

              <div>
                <div className="text-textSecondary">Started</div>
                <div className="text-white text-xs">
                  {new Date(selectedCall.startTime).toLocaleString()}
                </div>
              </div>

              {selectedCall.recordingUrl && (
                <div>
                  <div className="text-textSecondary mb-2">Recording</div>
                  <audio controls className="w-full">
                    <source src={selectedCall.recordingUrl} type="audio/wav" />
                  </audio>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedCall(null)}
              className="btn-secondary w-full mt-4"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
