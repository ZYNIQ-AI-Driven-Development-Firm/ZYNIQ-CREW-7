import React, { useState, useEffect } from 'react';

export interface LLMConnection {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'azure' | 'ollama' | 'custom';
  model: string;
  api_key_masked: string;
  endpoint?: string;
  is_active: boolean;
  created_at: string;
}

export const LLMConnectionsSection: React.FC = () => {
  const [connections, setConnections] = useState<LLMConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingConnection, setEditingConnection] = useState<LLMConnection | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    provider: 'openai' as LLMConnection['provider'],
    model: 'gpt-4',
    api_key: '',
    endpoint: '',
  });

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const data = await fetch('/connections').then(r => r.json());
      // setConnections(data);
      
      // Mock data
      const mockConnections: LLMConnection[] = [
        {
          id: '1',
          name: 'OpenAI GPT-4',
          provider: 'openai',
          model: 'gpt-4',
          api_key_masked: 'sk-...J8Kx',
          is_active: true,
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Anthropic Claude',
          provider: 'anthropic',
          model: 'claude-3-opus',
          api_key_masked: 'sk-ant-...9Xz2',
          is_active: false,
          created_at: new Date().toISOString(),
        },
      ];
      
      setConnections(mockConnections);
    } catch (error) {
      console.error('Failed to fetch connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // TODO: Replace with actual API call
      // await fetch('/connections', {
      //   method: editingConnection ? 'PATCH' : 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData),
      // });
      
      console.log('Saving connection:', formData);
      alert('✅ Connection saved successfully!');
      
      setShowAddModal(false);
      setEditingConnection(null);
      setFormData({ name: '', provider: 'openai', model: 'gpt-4', api_key: '', endpoint: '' });
      fetchConnections();
    } catch (error) {
      console.error('Failed to save connection:', error);
      alert('❌ Failed to save connection');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this connection?')) return;
    
    try {
      // TODO: Replace with actual API call
      // await fetch(`/connections/${id}`, { method: 'DELETE' });
      
      console.log('Deleting connection:', id);
      alert('✅ Connection deleted');
      fetchConnections();
    } catch (error) {
      console.error('Failed to delete connection:', error);
      alert('❌ Failed to delete connection');
    }
  };

  const providerIcons: Record<LLMConnection['provider'], string> = {
    openai: '🤖',
    anthropic: '🧠',
    azure: '☁️',
    ollama: '🦙',
    custom: '🔧',
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">LLM Connections</h2>
          <p className="text-white/60">Manage your AI model connections and API keys</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-6 py-3 rounded-xl bg-[#ea2323] hover:bg-[#ff2e2e] text-white font-semibold shadow-lg shadow-[#ea2323]/30 transition-all"
        >
          + Add Connection
        </button>
      </div>

      {/* Connections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12 text-white/40">
            Loading connections...
          </div>
        ) : connections.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-white/40 mb-4">No LLM connections configured</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold border border-white/10 transition-colors"
            >
              Add Your First Connection
            </button>
          </div>
        ) : (
          connections.map((conn) => (
            <div
              key={conn.id}
              className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 rounded-3xl p-6 border border-white/5 hover:border-white/10 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-2xl">
                    {providerIcons[conn.provider]}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{conn.name}</h3>
                    <p className="text-sm text-white/60 capitalize">{conn.provider}</p>
                  </div>
                </div>
                {conn.is_active && (
                  <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-semibold border border-green-500/30">
                    Active
                  </span>
                )}
              </div>

              <div className="space-y-2 mb-4">
                <div>
                  <p className="text-xs text-white/40 uppercase tracking-wider">Model</p>
                  <p className="text-sm text-white/90">{conn.model}</p>
                </div>
                <div>
                  <p className="text-xs text-white/40 uppercase tracking-wider">API Key</p>
                  <p className="text-sm text-white/90 font-mono">{conn.api_key_masked}</p>
                </div>
                {conn.endpoint && (
                  <div>
                    <p className="text-xs text-white/40 uppercase tracking-wider">Endpoint</p>
                    <p className="text-sm text-white/90 truncate">{conn.endpoint}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingConnection(conn);
                    setFormData({
                      name: conn.name,
                      provider: conn.provider,
                      model: conn.model,
                      api_key: '',
                      endpoint: conn.endpoint || '',
                    });
                    setShowAddModal(true);
                  }}
                  className="flex-1 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-semibold transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(conn.id)}
                  className="px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm font-semibold border border-red-500/30 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl border border-white/10 p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">
                {editingConnection ? 'Edit Connection' : 'Add New Connection'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingConnection(null);
                }}
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-white/70 mb-2">Connection Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-[#ea2323] transition-colors"
                  placeholder="My OpenAI Connection"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white/70 mb-2">Provider</label>
                <select
                  value={formData.provider}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value as LLMConnection['provider'] })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#ea2323] transition-colors"
                  required
                >
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="azure">Azure OpenAI</option>
                  <option value="ollama">Ollama (Local)</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white/70 mb-2">Model</label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-[#ea2323] transition-colors"
                  placeholder="gpt-4, claude-3-opus, etc."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white/70 mb-2">API Key</label>
                <input
                  type="password"
                  value={formData.api_key}
                  onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-[#ea2323] transition-colors"
                  placeholder="sk-..."
                  required={!editingConnection}
                />
                {editingConnection && (
                  <p className="text-xs text-white/40 mt-1">Leave empty to keep existing key</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-white/70 mb-2">Endpoint (Optional)</label>
                <input
                  type="url"
                  value={formData.endpoint}
                  onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-[#ea2323] transition-colors"
                  placeholder="https://api.openai.com/v1"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingConnection(null);
                  }}
                  className="flex-1 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 rounded-xl bg-[#ea2323] hover:bg-[#ff2e2e] text-white font-semibold shadow-lg shadow-[#ea2323]/30 transition-all"
                >
                  {editingConnection ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
