import React, { useState, useEffect } from 'react';

export interface EnvironmentVariable {
  id: string;
  key: string;
  value_masked: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export const EnvironmentVariablesSection: React.FC = () => {
  const [variables, setVariables] = useState<EnvironmentVariable[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVariable, setEditingVariable] = useState<EnvironmentVariable | null>(null);
  const [revealedValues, setRevealedValues] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    key: '',
    value: '',
    description: '',
  });

  useEffect(() => {
    fetchVariables();
  }, []);

  const fetchVariables = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const data = await fetch('/env-vars').then(r => r.json());
      // setVariables(data);
      
      // Mock data
      const mockVariables: EnvironmentVariable[] = [
        {
          id: '1',
          key: 'OPENAI_API_KEY',
          value_masked: 'sk-...J8Kx',
          description: 'OpenAI API key for GPT-4',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '2',
          key: 'DATABASE_URL',
          value_masked: 'postgres://...@localhost',
          description: 'PostgreSQL connection string',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '3',
          key: 'REDIS_URL',
          value_masked: 'redis://...@localhost',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
      
      setVariables(mockVariables);
    } catch (error) {
      console.error('Failed to fetch variables:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // TODO: Replace with actual API call
      // await fetch('/env-vars', {
      //   method: editingVariable ? 'PATCH' : 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData),
      // });
      
      console.log('Saving environment variable:', formData);
      alert('✅ Environment variable saved successfully!');
      
      setShowAddModal(false);
      setEditingVariable(null);
      setFormData({ key: '', value: '', description: '' });
      fetchVariables();
    } catch (error) {
      console.error('Failed to save variable:', error);
      alert('❌ Failed to save environment variable');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this environment variable?')) return;
    
    try {
      // TODO: Replace with actual API call
      // await fetch(`/env-vars/${id}`, { method: 'DELETE' });
      
      console.log('Deleting variable:', id);
      alert('✅ Environment variable deleted');
      fetchVariables();
    } catch (error) {
      console.error('Failed to delete variable:', error);
      alert('❌ Failed to delete environment variable');
    }
  };

  const toggleReveal = (id: string) => {
    setRevealedValues((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Environment Variables</h2>
          <p className="text-white/60">Securely manage your environment configuration</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-6 py-3 rounded-xl bg-[#ea2323] hover:bg-[#ff2e2e] text-white font-semibold shadow-lg shadow-[#ea2323]/30 transition-all"
        >
          + Add Variable
        </button>
      </div>

      {/* Variables Table */}
      <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 rounded-3xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">Key</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">Value</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">Description</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">Updated</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-white/40">
                    Loading environment variables...
                  </td>
                </tr>
              ) : variables.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center">
                    <p className="text-white/40 mb-4">No environment variables configured</p>
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold border border-white/10 transition-colors"
                    >
                      Add Your First Variable
                    </button>
                  </td>
                </tr>
              ) : (
                variables.map((variable) => (
                  <tr
                    key={variable.id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-white/90 font-mono">{variable.key}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-white/90 font-mono">
                          {revealedValues.has(variable.id) ? 'sk-full-key-value-here' : variable.value_masked}
                        </span>
                        <button
                          onClick={() => toggleReveal(variable.id)}
                          className="text-white/40 hover:text-white/90 transition-colors text-xs"
                          title={revealedValues.has(variable.id) ? 'Hide' : 'Reveal'}
                        >
                          {revealedValues.has(variable.id) ? '👁️‍🗨️' : '👁️'}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-white/60">{variable.description || '-'}</td>
                    <td className="px-6 py-4 text-sm text-white/60">
                      {new Date(variable.updated_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingVariable(variable);
                            setFormData({
                              key: variable.key,
                              value: '',
                              description: variable.description || '',
                            });
                            setShowAddModal(true);
                          }}
                          className="text-[#ea2323] hover:text-[#ff2e2e] text-sm font-semibold"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(variable.id)}
                          className="text-red-400 hover:text-red-300 text-sm font-semibold"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl border border-white/10 p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">
                {editingVariable ? 'Edit Variable' : 'Add New Variable'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingVariable(null);
                }}
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-white/70 mb-2">Key</label>
                <input
                  type="text"
                  value={formData.key}
                  onChange={(e) => setFormData({ ...formData, key: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 font-mono focus:outline-none focus:border-[#ea2323] transition-colors"
                  placeholder="API_KEY"
                  required
                  disabled={!!editingVariable}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white/70 mb-2">Value</label>
                <input
                  type="password"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 font-mono focus:outline-none focus:border-[#ea2323] transition-colors"
                  placeholder="your-secret-value"
                  required={!editingVariable}
                />
                {editingVariable && (
                  <p className="text-xs text-white/40 mt-1">Leave empty to keep existing value</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-white/70 mb-2">Description (Optional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-[#ea2323] transition-colors resize-none"
                  placeholder="What is this variable used for?"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingVariable(null);
                  }}
                  className="flex-1 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 rounded-xl bg-[#ea2323] hover:bg-[#ff2e2e] text-white font-semibold shadow-lg shadow-[#ea2323]/30 transition-all"
                >
                  {editingVariable ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
