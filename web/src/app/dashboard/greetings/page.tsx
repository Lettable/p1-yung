'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';

export default function GreetingsPage() {
  const { data: session, status } = useSession();
  const [greetings, setGreetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState('');

  if (status === 'unauthenticated') redirect('/auth/login');
  if (status === 'loading') return <div className="text-center py-12">Loading...</div>;

  useEffect(() => {
    const fetchGreetings = async () => {
      try {
        const response = await fetch('/api/greetings');
        if (response.ok) {
          const data = await response.json();
          setGreetings(data);
        }
      } catch (error) {
        console.error('Error fetching greetings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGreetings();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !uploadName) {
      alert('Please select file and enter name');
      return;
    }

    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('name', uploadName);

    try {
      const response = await fetch('/api/greetings', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const newGreeting = await response.json();
        setGreetings([newGreeting, ...greetings]);
        setUploadFile(null);
        setUploadName('');
      }
    } catch (error) {
      console.error('Error uploading greeting:', error);
    }
  };

  const handleDelete = async (greetingId: string) => {
    if (!confirm('Delete this greeting?')) return;

    try {
      const response = await fetch(`/api/greetings/${greetingId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setGreetings(greetings.filter(g => g._id !== greetingId));
      }
    } catch (error) {
      console.error('Error deleting greeting:', error);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Greetings Library</h1>

      {/* Upload Form */}
      <form onSubmit={handleUpload} className="card space-y-4">
        <h2 className="text-xl font-bold text-white">Upload Custom Greeting</h2>

        <div>
          <label className="block text-sm font-medium text-textPrimary mb-2">Greeting Name</label>
          <input
            type="text"
            value={uploadName}
            onChange={(e) => setUploadName(e.target.value)}
            placeholder="e.g., My Bank Greeting"
            className="input w-full"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-textPrimary mb-2">Audio File</label>
          <input
            type="file"
            accept="audio/*"
            onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
            className="input w-full"
            required
          />
          <p className="text-xs text-textSecondary mt-1">Supported: MP3, WAV, M4A, OGG</p>
        </div>

        <button type="submit" className="btn-primary w-full">
          Upload Greeting
        </button>
      </form>

      {/* Greetings Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-12 text-textSecondary">
            Loading greetings...
          </div>
        ) : greetings.length === 0 ? (
          <div className="col-span-full text-center py-12 text-textSecondary">
            No greetings yet. Upload one above!
          </div>
        ) : (
          greetings.map((greeting) => (
            <div key={greeting._id} className="card">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-white">{greeting.name}</h3>
                  <p className="text-xs text-textSecondary">
                    {greeting.category === 'custom' ? 'Custom' : 'Global'} • {greeting.duration}s
                  </p>
                </div>
                {greeting.category === 'custom' && (
                  <button
                    onClick={() => handleDelete(greeting._id)}
                    className="text-danger hover:text-danger/80"
                  >
                    ×
                  </button>
                )}
              </div>

              {greeting.audioUrl && (
                <audio controls className="w-full mb-3" style={{ height: '32px' }}>
                  <source src={greeting.audioUrl} type="audio/wav" />
                </audio>
              )}

              <button className="btn-secondary w-full text-sm">
                Use in Campaign
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
