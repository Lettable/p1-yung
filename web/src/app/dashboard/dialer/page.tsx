'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';

export default function DialerPage() {
  const { data: session, status } = useSession();
  const [campaignName, setCampaignName] = useState('');
  const [phoneNumbers, setPhoneNumbers] = useState('');
  const [selectedGreeting, setSelectedGreeting] = useState('');
  const [greetings, setGreetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeCampaign, setActiveCampaign] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);

  if (status === 'unauthenticated') redirect('/auth/login');
  if (status === 'loading') return <div className="text-center py-12">Loading...</div>;

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignName,
          phoneNumbers: phoneNumbers.split('\n').filter(n => n.trim()),
          greetingAudio: selectedGreeting,
        }),
      });

      if (response.ok) {
        const campaign = await response.json();
        setCampaigns([campaign, ...campaigns]);
        setCampaignName('');
        setPhoneNumbers('');
        setSelectedGreeting('');
        alert('Campaign created! Ready to launch.');
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert('Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };

  const handleStartCampaign = async (campaignId: string) => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/start`, {
        method: 'POST',
      });

      if (response.ok) {
        const updated = await response.json();
        setActiveCampaign(updated);
        setCampaigns(campaigns.map(c => c._id === campaignId ? updated : c));
      }
    } catch (error) {
      console.error('Error starting campaign:', error);
    }
  };

  const handlePauseCampaign = async (campaignId: string) => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/pause`, {
        method: 'POST',
      });

      if (response.ok) {
        const updated = await response.json();
        setActiveCampaign(null);
        setCampaigns(campaigns.map(c => c._id === campaignId ? updated : c));
      }
    } catch (error) {
      console.error('Error pausing campaign:', error);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Dialer</h1>

      {/* Campaign Creation Form */}
      <div className="card">
        <h2 className="text-xl font-bold text-white mb-4">Create New Campaign</h2>
        <form onSubmit={handleCreateCampaign} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-textPrimary mb-2">Campaign Name</label>
            <input
              type="text"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="e.g., BBVA_Campaign_001"
              className="input w-full"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-textPrimary mb-2">Phone Numbers (one per line)</label>
            <textarea
              value={phoneNumbers}
              onChange={(e) => setPhoneNumbers(e.target.value)}
              placeholder="+34600000001&#10;+34600000002&#10;+34600000003"
              rows={6}
              className="input w-full"
              required
            />
            <p className="text-xs text-textSecondary mt-1">Format: +34 followed by 9 digits</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-textPrimary mb-2">Greeting Audio</label>
            <select
              value={selectedGreeting}
              onChange={(e) => setSelectedGreeting(e.target.value)}
              className="input w-full"
              required
            >
              <option value="">-- Select greeting --</option>
              <option value="test">Test Greeting</option>
              <option value="bbva">BBVA Greeting</option>
              <option value="ing">ING Greeting</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? 'Creating...' : 'Create Campaign'}
          </button>
        </form>
      </div>

      {/* Active Campaign */}
      {activeCampaign && (
        <div className="card border-2 border-accent">
          <h2 className="text-xl font-bold text-accent mb-4">Active Campaign: {activeCampaign.campaignName}</h2>

          <div className="grid grid-cols-4 gap-4 mb-6">
            <div>
              <div className="text-textSecondary text-sm">Lanzados</div>
              <div className="text-2xl font-bold text-white">{activeCampaign.totalCalls}</div>
            </div>
            <div>
              <div className="text-textSecondary text-sm">Respondidos</div>
              <div className="text-2xl font-bold text-accent">{activeCampaign.answeredCalls}</div>
            </div>
            <div>
              <div className="text-textSecondary text-sm">Fallidos</div>
              <div className="text-2xl font-bold text-danger">{activeCampaign.failedCalls}</div>
            </div>
            <div>
              <div className="text-textSecondary text-sm">Costo Total</div>
              <div className="text-2xl font-bold text-white">€{(activeCampaign.totalCost / 100).toFixed(2)}</div>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-textSecondary text-sm">Progreso</span>
              <span className="text-textPrimary text-sm">{Math.round((activeCampaign.completedCalls / activeCampaign.totalCalls) * 100)}%</span>
            </div>
            <div className="w-full bg-surface rounded-full h-2">
              <div
                className="bg-accent h-2 rounded-full transition-all"
                style={{ width: `${(activeCampaign.completedCalls / activeCampaign.totalCalls) * 100}%` }}
              />
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => handlePauseCampaign(activeCampaign._id)}
              className="btn-secondary flex-1"
            >
              Pausar
            </button>
            <button
              onClick={() => handlePauseCampaign(activeCampaign._id)}
              className="btn-danger flex-1"
            >
              Terminar
            </button>
          </div>
        </div>
      )}

      {/* Campaigns List */}
      <div className="card">
        <h2 className="text-xl font-bold text-white mb-4">Recent Campaigns</h2>
        {campaigns.length === 0 ? (
          <p className="text-textSecondary">No campaigns yet. Create one above!</p>
        ) : (
          <div className="space-y-2">
            {campaigns.map((campaign) => (
              <div key={campaign._id} className="flex justify-between items-center p-3 bg-surface rounded border border-border">
                <div>
                  <div className="font-semibold text-white">{campaign.campaignName}</div>
                  <div className="text-xs text-textSecondary">
                    {campaign.totalCalls} calls • {campaign.answeredCalls} answered • €{(campaign.totalCost / 100).toFixed(2)}
                  </div>
                </div>
                <div className="flex gap-2">
                  {campaign.status === 'draft' && (
                    <button
                      onClick={() => handleStartCampaign(campaign._id)}
                      className="btn-primary text-sm py-1 px-3"
                    >
                      Iniciar
                    </button>
                  )}
                  {campaign.status === 'running' && (
                    <span className="text-accent text-sm font-semibold">En ejecución</span>
                  )}
                  <span className={`text-xs font-semibold py-1 px-2 rounded ${
                    campaign.status === 'completed' ? 'bg-accent/20 text-accent' : 'bg-surface'
                  }`}>
                    {campaign.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
