'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';

export default function AdminMonitoringPage() {
  const { data: session, status } = useSession();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  if (status === 'unauthenticated') redirect('/auth/login');
  if (status === 'loading') return <div className="text-center py-12">Loading...</div>;

  if ((session?.user as any)?.role !== 'admin') {
    return <div className="card text-center py-12 text-danger">Access denied</div>;
  }

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const response = await fetch('/api/admin/campaigns');
        if (response.ok) {
          const data = await response.json();
          setCampaigns(data);
        }
      } catch (error) {
        console.error('Error fetching campaigns:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, []);

  const handleStopCampaign = async (campaignId: string) => {
    if (!confirm('Stop this campaign?')) return;

    try {
      const response = await fetch(`/api/admin/campaigns/${campaignId}/stop`, {
        method: 'POST',
      });

      if (response.ok) {
        setCampaigns(campaigns.map(c =>
          c._id === campaignId ? { ...c, status: 'completed' } : c
        ));
      }
    } catch (error) {
      console.error('Error stopping campaign:', error);
    }
  };

  const runningCampaigns = campaigns.filter(c => c.status === 'running');
  const allCampaigns = campaigns;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Live Monitoring</h1>

      {/* Summary */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="card">
          <div className="text-textSecondary text-sm mb-2">Active Campaigns</div>
          <div className="text-3xl font-bold text-accent">{runningCampaigns.length}</div>
        </div>

        <div className="card">
          <div className="text-textSecondary text-sm mb-2">Total Campaigns</div>
          <div className="text-3xl font-bold text-white">{allCampaigns.length}</div>
        </div>

        <div className="card">
          <div className="text-textSecondary text-sm mb-2">Active Calls</div>
          <div className="text-3xl font-bold text-white">
            {runningCampaigns.reduce((sum, c) => sum + (c.currentTrunksInUse || 0), 0)}
          </div>
        </div>
      </div>

      {/* Running Campaigns */}
      {runningCampaigns.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-bold text-accent mb-4">Running Campaigns</h2>

          <div className="space-y-4">
            {runningCampaigns.map((campaign) => (
              <div key={campaign._id} className="border border-border rounded p-4 bg-surface/50">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-white">{campaign.campaignName}</h3>
                    <p className="text-xs text-textSecondary">{campaign.userId?.email}</p>
                  </div>
                  <button
                    onClick={() => handleStopCampaign(campaign._id)}
                    className="btn-danger text-sm py-1 px-2"
                  >
                    Stop Campaign
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-2 text-sm mb-3">
                  <div>
                    <div className="text-textSecondary text-xs">Launched</div>
                    <div className="font-bold text-white">{campaign.totalCalls}</div>
                  </div>
                  <div>
                    <div className="text-textSecondary text-xs">Answered</div>
                    <div className="font-bold text-accent">{campaign.answeredCalls}</div>
                  </div>
                  <div>
                    <div className="text-textSecondary text-xs">In Progress</div>
                    <div className="font-bold text-blue-400">{campaign.currentTrunksInUse}</div>
                  </div>
                  <div>
                    <div className="text-textSecondary text-xs">Cost</div>
                    <div className="font-bold text-white">€{(campaign.totalCost / 100).toFixed(2)}</div>
                  </div>
                </div>

                <div className="w-full bg-surface rounded-full h-2">
                  <div
                    className="bg-accent h-2 rounded-full"
                    style={{ width: `${(campaign.completedCalls / campaign.totalCalls) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Campaigns Table */}
      <div className="card overflow-x-auto">
        <h2 className="text-xl font-bold text-white mb-4">All Campaigns</h2>

        {loading ? (
          <p className="text-textSecondary">Loading...</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-textSecondary font-semibold">Campaign</th>
                <th className="text-left py-3 px-4 text-textSecondary font-semibold">User</th>
                <th className="text-left py-3 px-4 text-textSecondary font-semibold">Status</th>
                <th className="text-left py-3 px-4 text-textSecondary font-semibold">Calls</th>
                <th className="text-left py-3 px-4 text-textSecondary font-semibold">Cost</th>
              </tr>
            </thead>
            <tbody>
              {allCampaigns.map((campaign) => (
                <tr key={campaign._id} className="border-b border-border hover:bg-surface/50">
                  <td className="py-3 px-4 text-white">{campaign.campaignName}</td>
                  <td className="py-3 px-4 text-textPrimary">{campaign.userId?.email}</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs font-semibold py-1 px-2 rounded ${
                      campaign.status === 'running' ? 'bg-accent/20 text-accent' :
                      campaign.status === 'completed' ? 'bg-surface text-textSecondary' :
                      'bg-surface/50 text-textSecondary'
                    }`}>
                      {campaign.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-white">
                    {campaign.completedCalls}/{campaign.totalCalls}
                  </td>
                  <td className="py-3 px-4 text-white">€{(campaign.totalCost / 100).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
