import React, { useState } from 'react';
import { TracesSection } from '../components/MissionLab/TracesSection';
import { LLMConnectionsSection } from '../components/MissionLab/LLMConnectionsSection';
import { EnvironmentVariablesSection } from '../components/MissionLab/EnvironmentVariablesSection';

type TabId = 'traces' | 'llm-connections' | 'env-vars';

export const MissionLabPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('traces');

  const tabs: { id: TabId; label: string; icon: string }[] = [
    { id: 'traces', label: 'Traces', icon: '📊' },
    { id: 'llm-connections', label: 'LLM Connections', icon: '🔌' },
    { id: 'env-vars', label: 'Environment Variables', icon: '🔐' },
  ];

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-[#05070B] via-[#0B0F19] to-[#05070B]">
      {/* Header */}
      <div className="px-8 py-6 border-b border-white/10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ea2323] to-[#ff2e2e] flex items-center justify-center text-xl">
            ⚡
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Mission Lab</h1>
            <p className="text-sm text-white/60">Traces, connections, and configuration</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="px-8 py-4 border-b border-white/10">
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-[#ea2323] text-white shadow-lg shadow-[#ea2323]/30'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'traces' && <TracesSection />}
        {activeTab === 'llm-connections' && <LLMConnectionsSection />}
        {activeTab === 'env-vars' && <EnvironmentVariablesSection />}
      </div>
    </div>
  );
};
