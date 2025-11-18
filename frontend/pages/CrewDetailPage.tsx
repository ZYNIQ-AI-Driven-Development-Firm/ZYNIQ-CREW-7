import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Crew, getCrew, Agent } from '../src/lib/api';
import { CrewPortfolio } from '../components/CrewPortfolio';
import AgentList from '../components/AgentList';
import CrewRatingSection from '../components/CrewRatingSection';
import PricingCard from '../components/PricingCard';
import { 
  ArrowLeft, 
  Share2, 
  Bookmark, 
  MoreVertical,
  DollarSign,
  Users,
  Star,
  TrendingUp
} from 'lucide-react';

export const CrewDetailPage: React.FC = () => {
  const { crewId } = useParams<{ crewId: string }>();
  const navigate = useNavigate();
  const [crew, setCrew] = useState<Crew | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'agents' | 'pricing' | 'ratings'>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (crewId) {
      loadCrew();
    }
  }, [crewId]);

  const loadCrew = async () => {
    if (!crewId) return;
    
    try {
      setLoading(true);
      setError('');
      const data = await getCrew(crewId);
      setCrew(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load crew');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-white/10 rounded w-64"></div>
            <div className="h-96 bg-white/10 rounded-3xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !crew || !crewId) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="p-8 rounded-3xl bg-red-500/10 border border-red-500/20">
            <p className="text-red-400 text-center">{error || 'Crew not found'}</p>
            <button
              onClick={() => navigate(-1)}
              className="mt-4 mx-auto block px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold">{crew.name}</h1>
                <p className="text-white/60 text-sm">
                  Status: <span className={`
                    ${crew.status === 'available' ? 'text-green-400' : ''}
                    ${crew.status === 'busy' ? 'text-yellow-400' : ''}
                    ${crew.status === 'offline' ? 'text-red-400' : ''}
                  `}>{crew.status}</span>
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                <Bookmark className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                <Share2 className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                <MoreVertical className="w-5 h-5" />
              </button>
              <button className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-600 font-medium transition-colors">
                Hire Crew
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'bg-white/10 text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <TrendingUp className="w-4 h-4 inline mr-2" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('agents')}
              className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                activeTab === 'agents'
                  ? 'bg-white/10 text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Agents
            </button>
            <button
              onClick={() => setActiveTab('pricing')}
              className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                activeTab === 'pricing'
                  ? 'bg-white/10 text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <DollarSign className="w-4 h-4 inline mr-2" />
              Pricing
            </button>
            <button
              onClick={() => setActiveTab('ratings')}
              className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                activeTab === 'ratings'
                  ? 'bg-white/10 text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Star className="w-4 h-4 inline mr-2" />
              Ratings
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <CrewPortfolio
                crewId={crewId}
                showAgents={false}
                showPricing={false}
                showRatings={false}
                allowRating={false}
              />
              
              <AgentList
                crewId={crewId}
                onAgentClick={setSelectedAgent}
                maxDisplay={6}
              />
            </div>
            
            <div className="space-y-6">
              <PricingCard crewId={crewId} type="rental" showBreakdown />
              <CrewRatingSection crewId={crewId} allowRating />
            </div>
          </div>
        )}

        {activeTab === 'agents' && (
          <div className="max-w-5xl mx-auto">
            <AgentList
              crewId={crewId}
              onAgentClick={setSelectedAgent}
              showAddButton={false}
            />
          </div>
        )}

        {activeTab === 'pricing' && (
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PricingCard crewId={crewId} type="rental" showBreakdown />
              <PricingCard crewId={crewId} type="buyout" showBreakdown />
            </div>
          </div>
        )}

        {activeTab === 'ratings' && (
          <div className="max-w-4xl mx-auto">
            <CrewRatingSection crewId={crewId} allowRating />
          </div>
        )}
      </div>

      {/* Agent Detail Modal */}
      {selectedAgent && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedAgent(null)}
        >
          <div
            className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold mb-2">{selectedAgent.name}</h2>
                <p className="text-white/60">{selectedAgent.role.replace(/_/g, ' ')}</p>
                {selectedAgent.specialist_type && (
                  <p className="text-purple-400 text-sm mt-1">{selectedAgent.specialist_type}</p>
                )}
              </div>
              <button
                onClick={() => setSelectedAgent(null)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>

            {selectedAgent.description && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider mb-2">
                  Description
                </h3>
                <p className="text-white/70">{selectedAgent.description}</p>
              </div>
            )}

            {selectedAgent.goal && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider mb-2">
                  Goal
                </h3>
                <p className="text-white/70">{selectedAgent.goal}</p>
              </div>
            )}

            {selectedAgent.backstory && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider mb-2">
                  Backstory
                </h3>
                <p className="text-white/70 italic">{selectedAgent.backstory}</p>
              </div>
            )}

            {selectedAgent.tools_list && (
              <div>
                <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider mb-2">
                  Skills & Tools
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedAgent.tools_list.split(',').map((tool, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-white/70 text-sm"
                    >
                      {tool.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CrewDetailPage;
