'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';

export default function AgentsPage() {
  const { data: session, status } = useSession();
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ agentName: '', extensionNumber: '' });

  if (status === 'unauthenticated') redirect('/auth/login');
  if (status === 'loading') return <div className="text-center py-12">Loading...</div>;

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await fetch('/api/agents');
        if (response.ok) {
          const data = await response.json();
          setAgents(data);
        }
      } catch (error) {
        console.error('Error fetching agents:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, []);

  const handleAddAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const newAgent = await response.json();
        setAgents([newAgent, ...agents]);
        setFormData({ agentName: '', extensionNumber: '' });
        setShowForm(false);
      }
    } catch (error) {
      console.error('Error creating agent:', error);
    }
  };

  const handleDeleteAgent = async (agentId: string) => {
    if (!confirm('Delete this agent?')) return;

    try {
      const response = await fetch(`/api/agents/${agentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setAgents(agents.filter(a => a._id !== agentId));
      }
    } catch (error) {
      console.error('Error deleting agent:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Agents</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          + Add Agent
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAddAgent} className="card space-y-4">
          <div>
            <label className="block text-sm font-medium text-textPrimary mb-2">Agent Name</label>
            <input
              type="text"
              value={formData.agentName}
              onChange={(e) => setFormData({ ...formData, agentName: e.target.value })}
              placeholder="John Doe"
              className="input w-full"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-textPrimary mb-2">Extension Number</label>
            <input
              type="number"
              value={formData.extensionNumber}
              onChange={(e) => setFormData({ ...formData, extensionNumber: e.target.value })}
              placeholder="1002"
              className="input w-full"
              required
            />
          </div>

          <div className="flex gap-2">
            <button type="submit" className="btn-primary flex-1">Create</button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 text-textSecondary font-semibold">Extension</th>
              <th className="text-left py-3 px-4 text-textSecondary font-semibold">Name</th>
              <th className="text-left py-3 px-4 text-textSecondary font-semibold">Status</th>
              <th className="text-left py-3 px-4 text-textSecondary font-semibold">Calls Handled</th>
              <th className="text-left py-3 px-4 text-textSecondary font-semibold">Current Call</th>
              <th className="text-left py-3 px-4 text-textSecondary font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-textSecondary">
                  Loading agents...
                </td>
              </tr>
            ) : agents.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-textSecondary">
                  No agents yet. Create one above!
                </td>
              </tr>
            ) : (
              agents.map((agent) => (
                <tr key={agent._id} className="border-b border-border hover:bg-surface/50">
                  <td className="py-3 px-4 text-white font-mono">{agent.extensionNumber}</td>
                  <td className="py-3 px-4 text-white">{agent.agentName}</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs font-semibold py-1 px-2 rounded ${
                      agent.isOnline ? 'bg-accent/20 text-accent' : 'bg-surface text-textSecondary'
                    }`}>
                      {agent.isOnline ? 'Online' : 'Offline'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-white">{agent.totalCallsHandled}</td>
                  <td className="py-3 px-4 text-textSecondary text-xs">
                    {agent.currentCallNumber || '-'}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleDeleteAgent(agent._id)}
                      className="text-danger hover:text-danger/80 text-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
