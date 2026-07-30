'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';

export default function DialerPage() {
  const { data: session, status } = useSession();
  const [campaignName, setCampaignName] = useState('');
  const [phoneNumbers, setPhoneNumbers] = useState('');
  const [selectedGreeting, setSelectedGreeting] = useState('test');
  const [loading, setLoading] = useState(false);
  const [activeCampaign, setActiveCampaign] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);

  if (status === 'unauthenticated') redirect('/auth/login');
  if (status === 'loading') return <div className="text-center py-12 text-textSecondary">Loading...</div>;

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const response = await fetch('/api/campaigns');
        if (response.ok) {
          const data = await response.json();
          setCampaigns(data);
          const active = data.find((c: any) => c.status === 'running');
          if (active) setActiveCampaign(active);
        }
      } catch (error) {
        console.error('Error fetching campaigns:', error);
      }
    };

    fetchCampaigns();
  }, []);

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
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
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
      await fetch(`/api/campaigns/${campaignId}/pause`, { method: 'POST' });
      setActiveCampaign(null);
      setCampaigns(campaigns.map(c =>
        c._id === campaignId ? { ...c, status: 'paused' } : c
      ));
    } catch (error) {
      console.error('Error pausing campaign:', error);
    }
  };

  const handleStopCampaign = async (campaignId: string) => {
    try {
      await fetch(`/api/campaigns/${campaignId}/stop`, { method: 'POST' });
      setActiveCampaign(null);
      setCampaigns(campaigns.map(c =>
        c._id === campaignId ? { ...c, status: 'completed' } : c
      ));
    } catch (error) {
      console.error('Error stopping campaign:', error);
    }
  };

  const progressPercent = activeCampaign
    ? Math.round((activeCampaign.completedCalls / activeCampaign.totalCalls) * 100)
    : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-black text-white">📞 Dialer</h1>
        <p className="text-textSecondary">Create and manage bulk calling campaigns</p>
      </div>

      {/* Campaign Creation Form */}
      <Card variant="elevated">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">✨ Launch New Campaign</h2>
            <p className="text-textSecondary text-sm">Enter campaign details and phone numbers</p>
          </div>

          <form onSubmit={handleCreateCampaign} className="space-y-5">
            <Input
              label="Campaign Name"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="e.g., Q4 Sales Outreach"
              required
            />

            <div>
              <label className="block text-sm font-semibold text-textPrimary mb-2">
                Phone Numbers (one per line)
              </label>
              <textarea
                value={phoneNumbers}
                onChange={(e) => setPhoneNumbers(e.target.value)}
                placeholder={'+34600000001\n+34600000002\n+34600000003'}
                rows={5}
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-lg text-textPrimary placeholder-textSecondary focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                required
              />
              <p className="text-xs text-textSecondary mt-2">💡 Format: +34 followed by 9 digits (E.164)</p>
            </div>

            <Select
              label="Greeting Audio"
              value={selectedGreeting}
              onChange={(e) => setSelectedGreeting(e.target.value)}
              options={[
                { value: 'test', label: '🎵 Test Greeting' },
                { value: 'bbva', label: '🏦 BBVA Greeting' },
                { value: 'ing', label: '🏦 ING Greeting' },
              ]}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={loading}
              className="w-full"
            >
              🚀 Launch Campaign
            </Button>
          </form>
        </div>
      </Card>

      {/* Active Campaign */}
      {activeCampaign && (
        <Card variant="bordered">
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-accent mb-1">
                  ▶ {activeCampaign.campaignName}
                </h2>
                <Badge variant="success">🔴 LIVE</Badge>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid md:grid-cols-4 gap-4">
              {[
                { label: 'Launched', value: activeCampaign.totalCalls, icon: '📤', color: 'text-white' },
                { label: 'Answered', value: activeCampaign.answeredCalls, icon: '✅', color: 'text-accent' },
                { label: 'Failed', value: activeCampaign.failedCalls, icon: '❌', color: 'text-danger' },
                { label: 'Cost', value: `€${(activeCampaign.totalCost / 100).toFixed(2)}`, icon: '💰', color: 'text-white' },
              ].map((metric, i) => (
                <div key={i} className="bg-surface/50 border border-border rounded-lg p-4">
                  <div className="text-2xl mb-2">{metric.icon}</div>
                  <div className="text-xs text-textSecondary mb-1">{metric.label}</div>
                  <div className={`text-2xl font-bold ${metric.color}`}>{metric.value}</div>
                </div>
              ))}
            </div>

            {/* Progress Bar */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-textPrimary">Progress</span>
                <span className="text-xl font-bold text-accent">{progressPercent}%</span>
              </div>
              <div className="w-full bg-surface rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-accent to-accent/60 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Controls */}
            <div className="flex gap-3">
              <Button
                variant="secondary"
                size="lg"
                onClick={() => handlePauseCampaign(activeCampaign._id)}
                className="flex-1"
              >
                ⏸ Pause
              </Button>
              <Button
                variant="danger"
                size="lg"
                onClick={() => handleStopCampaign(activeCampaign._id)}
                className="flex-1"
              >
                ⏹ Stop
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Recent Campaigns */}
      <Card>
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white">📋 Recent Campaigns</h2>

          {campaigns.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-textSecondary">No campaigns yet. Create one above!</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {campaigns.map((campaign) => (
                <div
                  key={campaign._id}
                  className="flex justify-between items-center p-4 bg-surface/50 hover:bg-surface transition-all rounded-lg border border-border"
                >
                  <div className="flex-1">
                    <div className="font-semibold text-white">{campaign.campaignName}</div>
                    <div className="text-xs text-textSecondary mt-1">
                      {campaign.totalCalls} calls • {campaign.answeredCalls} answered • €{(campaign.totalCost / 100).toFixed(2)}
                    </div>
                  </div>

                  <div className="flex gap-2 items-center">
                    {campaign.status === 'draft' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleStartCampaign(campaign._id)}
                      >
                        ▶ Start
                      </Button>
                    )}
                    {campaign.status === 'running' && (
                      <Badge variant="success">RUNNING</Badge>
                    )}
                    {campaign.status === 'paused' && (
                      <Badge>PAUSED</Badge>
                    )}
                    {campaign.status === 'completed' && (
                      <Badge>COMPLETED</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
