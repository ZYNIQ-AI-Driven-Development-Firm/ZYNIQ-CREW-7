import React, { useState, useMemo, useEffect } from 'react';
import { MarketplaceCard, CrewMarketplaceItem } from '../components/Marketplace/MarketplaceCard';
import { CrewFiltersBar, CrewFilters } from '../components/Marketplace/CrewFiltersBar';
import { CrewPreviewPanel } from '../components/Marketplace/CrewPreviewPanel';
import { CrewDetailView } from '../components/Marketplace/CrewDetailView';
import { MOCK_CREWS, filterAndSortCrews } from '../components/Marketplace/mockData';
import { listMarketplaceCrews, forkMarketplaceCrew, rentCrew, buyCrew, type MarketplaceCrew } from '../src/lib/api';

export const MarketplacePage: React.FC = () => {
  const [filters, setFilters] = useState<CrewFilters>({
    search: '',
    industries: [],
    priceRange: [0, 1000],
    levelRange: [1, 100],
    xpRange: [0, 100000],
    minSuccessRate: 0,
    availability: 'all',
    sortBy: 'active',
  });

  const [selectedCrew, setSelectedCrew] = useState<CrewMarketplaceItem | null>(null);
  const [detailViewCrewId, setDetailViewCrewId] = useState<string | null>(null);
  const [apiCrews, setApiCrews] = useState<MarketplaceCrew[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch marketplace crews from API
  useEffect(() => {
    const fetchCrews = async () => {
      try {
        setLoading(true);
        const crews = await listMarketplaceCrews();
        setApiCrews(crews);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch marketplace crews:', err);
        setError('Failed to load marketplace crews');
        // Fallback to mock data
        setApiCrews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCrews();
  }, []);

  // Convert API crews to marketplace format (merge with mock data for now)
  const allCrews = useMemo(() => {
    // Use mock crews as base, will be replaced by API data in production
    return apiCrews.length > 0 ? MOCK_CREWS : MOCK_CREWS;
  }, [apiCrews]);

  const filteredCrews = useMemo(
    () => filterAndSortCrews(allCrews, filters),
    [allCrews, filters]
  );

  const featuredCrews = useMemo(
    () => allCrews.filter(crew => crew.isFeatured),
    [allCrews]
  );

  const handleDeploy = async (crew: CrewMarketplaceItem) => {
    if (actionLoading) return;
    
    setActionLoading(crew.id);
    try {
      // Fork the crew (install to workspace)
      const forked = await forkMarketplaceCrew(crew.id);
      alert(`✅ ${crew.name} installed successfully! You can now use it in your workspace.`);
      console.log('Forked crew:', forked);
    } catch (err: any) {
      console.error('Failed to fork crew:', err);
      alert(`❌ Failed to install ${crew.name}: ${err.message || 'Unknown error'}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleFavorite = (crew: CrewMarketplaceItem) => {
    console.log('Favorited crew:', crew.name);
    // TODO: Implement favorites API
  };

  const handleViewFullProfile = (crew: CrewMarketplaceItem) => {
    setDetailViewCrewId(crew.id);
  };

  return (
    <>
      {/* Crew Detail View Modal */}
      {detailViewCrewId && (
        <CrewDetailView
          crewId={detailViewCrewId}
          onClose={() => setDetailViewCrewId(null)}
          onBack={() => setDetailViewCrewId(null)}
        />
      )}

      <div className="min-h-screen bg-gradient-to-br from-[#05070B] via-[#0B0F19] to-[#05070B] text-white">
      {/* Hex Grid Background */}
      <div className="fixed inset-0 hex-grid-bg opacity-40 pointer-events-none" />
      
      {/* Ambient Particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 bg-[#ea2323]/10 rounded-full blur-3xl -top-48 -left-48 animate-pulse" />
        <div className="absolute w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -bottom-48 -right-48 animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <section className="container mx-auto px-6 pt-16 pb-12">
          <div className="text-center max-w-4xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#ea2323]/10 border border-[#ea2323]/20 text-sm font-semibold text-[#ea2323] mb-4">
              <span className="w-2 h-2 rounded-full bg-[#ea2323] animate-pulse" />
              Live Marketplace
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
              Crew-7 Marketplace
            </h1>
            
            <p className="text-xl md:text-2xl text-white/70 max-w-2xl mx-auto">
              Rent, Own, and Deploy Autonomous AI Crews.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <button className="px-8 py-4 rounded-xl bg-[#ea2323] hover:bg-[#ff2e2e] transition-all font-bold text-lg shadow-lg shadow-[#ea2323]/30">
                Explore Crews
              </button>
              <button className="px-8 py-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 transition-all font-bold text-lg">
                Create a Crew
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-8 pt-8 text-sm text-white/60">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🤖</span>
                <span><strong className="text-white">{allCrews.length}+</strong> Active Crews</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">✅</span>
                <span><strong className="text-white">97%</strong> Avg Success Rate</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">⭐</span>
                <span><strong className="text-white">4.7</strong> Avg Rating</span>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Crews Row */}
        {featuredCrews.length > 0 && (
          <section className="container mx-auto px-6 py-12">
            <div className="mb-6">
              <h2 className="text-3xl font-bold mb-2">Featured Crews</h2>
              <p className="text-white/60">Top-performing and sponsored AI crews</p>
            </div>
            
            <div className="relative">
              <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
                {featuredCrews.map((crew) => (
                  <div key={crew.id} className="flex-none w-80 snap-start">
                    <MarketplaceCard
                      crew={crew}
                      onClick={setSelectedCrew}
                      onDeploy={handleDeploy}
                      onFavorite={handleFavorite}
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Filters Bar */}
        <section className="container mx-auto px-6 py-8">
          <CrewFiltersBar filters={filters} onFiltersChange={setFilters} />
        </section>

        {/* Results Count */}
        <section className="container mx-auto px-6 pb-4">
          <div className="flex items-center justify-between">
            {loading ? (
              <p className="text-white/60">Loading crews...</p>
            ) : error ? (
              <p className="text-red-400">{error}</p>
            ) : (
              <p className="text-white/60">
                Showing <strong className="text-white">{filteredCrews.length}</strong> of{' '}
                <strong className="text-white">{allCrews.length}</strong> crews
              </p>
            )}
          </div>
        </section>

        {/* Crew Grid */}
        <section className="container mx-auto px-6 pb-16">
          {filteredCrews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCrews.map((crew) => (
                <MarketplaceCard
                  key={crew.id}
                  crew={crew}
                  onClick={setSelectedCrew}
                  onDeploy={handleDeploy}
                  onFavorite={handleFavorite}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-bold mb-2">No Crews Found</h3>
              <p className="text-white/60 mb-6">
                Try adjusting your filters or search terms
              </p>
              <button
                onClick={() => setFilters({
                  search: '',
                  industries: [],
                  priceRange: [0, 1000],
                  levelRange: [1, 100],
                  xpRange: [0, 100000],
                  minSuccessRate: 0,
                  availability: 'all',
                  sortBy: 'active',
                })}
                className="px-6 py-3 rounded-xl bg-[#ea2323] hover:bg-[#ff2e2e] transition-all font-semibold"
              >
                Reset Filters
              </button>
            </div>
          )}
        </section>
      </div>

      {/* Preview Panel */}
      <CrewPreviewPanel
        crew={selectedCrew}
        onClose={() => setSelectedCrew(null)}
        onDeploy={handleDeploy}
        onViewFullProfile={handleViewFullProfile}
      />
      </div>
    </>
  );
};

/* Hide scrollbar for featured row */
const style = document.createElement('style');
style.textContent = `
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;
document.head.appendChild(style);
