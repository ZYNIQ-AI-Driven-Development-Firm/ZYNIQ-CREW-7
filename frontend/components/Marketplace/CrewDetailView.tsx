/**
 * Crew Detail View Component
 * 
 * Displays detailed portfolio information for a selected crew using
 * the EnhancedCrewPortfolioCard component with Web3 metadata
 */

import React, { useEffect, useState } from 'react';
import { X, ArrowLeft, ExternalLink } from 'lucide-react';
import { EnhancedCrewPortfolioCard } from '../Wallet/EnhancedCrewPortfolioCard';
import { getMockCrewNftMetadata } from './mockData';
import { metadataAPI, MetadataAPIError } from '../../src/lib/metadataAPI';
import { useAPIConfig } from '../../src/lib/apiConfig';
import type { CrewNftMetadata } from '../../src/lib/web3/metadata';

interface CrewDetailViewProps {
  crewId: string;
  onClose: () => void;
  onBack?: () => void;
}

export const CrewDetailView: React.FC<CrewDetailViewProps> = ({ 
  crewId, 
  onClose, 
  onBack,
}) => {
  const { useRealAPI } = useAPIConfig(); // Use global API config
  const [crewMetadata, setCrewMetadata] = useState<CrewNftMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMetadata() {
      setLoading(true);
      setError(null);

      try {
        if (useRealAPI) {
          // Use real backend API
          const metadata = await metadataAPI.getCrewMetadata(crewId);
          setCrewMetadata(metadata);
        } else {
          // Use mock data (for development)
          const metadata = getMockCrewNftMetadata(crewId);
          if (!metadata) {
            setError('Crew not found');
          } else {
            setCrewMetadata(metadata);
          }
        }
      } catch (err) {
        if (err instanceof MetadataAPIError) {
          if (err.status === 404) {
            setError('Crew not found');
          } else if (err.status === 403) {
            setError('Access denied - this crew is private');
          } else {
            setError(err.message);
          }
        } else {
          setError('Failed to load crew metadata');
        }
      } finally {
        setLoading(false);
      }
    }

    loadMetadata();
  }, [crewId, useRealAPI]);

  // Loading state
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 max-w-md w-full text-center">
          <div className="animate-spin w-12 h-12 border-4 border-[#ea2323] border-t-transparent rounded-full mx-auto mb-4"></div>
          <h3 className="text-xl font-bold mb-2">Loading Crew...</h3>
          <p className="text-white/60">Fetching metadata...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !crewMetadata) {
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 max-w-md w-full text-center">
          <h3 className="text-xl font-bold mb-2 text-red-400">
            {error || 'Crew Not Found'}
          </h3>
          <p className="text-white/60 mb-4">
            {error || 'The requested crew could not be found.'}
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#ea2323] hover:bg-[#ff2e2e] transition-all font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-screen p-4 md:p-8">
        {/* Header */}
        <div className="max-w-6xl mx-auto mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              {onBack && (
                <button
                  onClick={onBack}
                  className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                  aria-label="Go back"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">{crewMetadata.name}</h1>
                <p className="text-white/60 text-sm mt-1">
                  Level {crewMetadata.level} • {crewMetadata.crew_type} Crew
                </p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Portfolio Card */}
            <div className="lg:col-span-2">
              <EnhancedCrewPortfolioCard
                metadata={crewMetadata}
                layout="vertical"
                showEvolution
              />
            </div>

            {/* Right Column - Additional Details */}
            <div className="space-y-6">
              {/* Description */}
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                <h3 className="text-sm font-semibold mb-3 text-[#ea2323]">About This Crew</h3>
                <p className="text-sm text-white/70 leading-relaxed">
                  {crewMetadata.description}
                </p>
              </div>

              {/* Blockchain Info */}
              {crewMetadata.token_id && (
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                  <h3 className="text-sm font-semibold mb-3 text-[#ea2323]">Blockchain</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-white/50">Chain</span>
                      <span className="font-medium">Ethereum</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/50">Token ID</span>
                      <span className="font-mono text-xs">{crewMetadata.token_id}</span>
                    </div>
                    {crewMetadata.contract_address && (
                      <div className="flex items-center justify-between">
                        <span className="text-white/50">Contract</span>
                        <a
                          href={`https://etherscan.io/address/${crewMetadata.contract_address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[#06b6d4] hover:text-[#06b6d4]/80 transition-colors"
                        >
                          <span className="font-mono text-xs">
                            {crewMetadata.contract_address.slice(0, 6)}...{crewMetadata.contract_address.slice(-4)}
                          </span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Pricing */}
              {crewMetadata.price_per_mission && (
                <div className="p-5 rounded-2xl bg-gradient-to-br from-[#ea2323]/10 to-[#ea2323]/5 border border-[#ea2323]/20">
                  <h3 className="text-sm font-semibold mb-3 text-[#ea2323]">Pricing</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-white/50 mb-1">Per Mission</div>
                      <div className="text-2xl font-bold">
                        {crewMetadata.price_per_mission} <span className="text-lg text-white/60">{crewMetadata.price_currency}</span>
                      </div>
                    </div>
                    {crewMetadata.price_buyout && (
                      <div>
                        <div className="text-xs text-white/50 mb-1">Buyout Price</div>
                        <div className="text-xl font-bold text-white/80">
                          {crewMetadata.price_buyout} <span className="text-sm text-white/50">{crewMetadata.price_currency}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Quick Stats */}
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                <h3 className="text-sm font-semibold mb-3 text-[#ea2323]">Quick Stats</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-white/50">Formation</span>
                    <span className="font-medium">{crewMetadata.formation} Agents</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/50">XP Progress</span>
                    <span className="font-medium">
                      {crewMetadata.xp} / {crewMetadata.xp_required_for_next_level}
                    </span>
                  </div>
                  {crewMetadata.hours_worked_estimate && (
                    <div className="flex items-center justify-between">
                      <span className="text-white/50">Total Hours</span>
                      <span className="font-medium">{crewMetadata.hours_worked_estimate.toFixed(1)}h</span>
                    </div>
                  )}
                  {crewMetadata.artifacts_count && (
                    <div className="flex items-center justify-between">
                      <span className="text-white/50">Artifacts</span>
                      <span className="font-medium">{crewMetadata.artifacts_count}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* External Links */}
              {crewMetadata.external_url && (
                <a
                  href={crewMetadata.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-semibold text-center"
                >
                  <div className="flex items-center justify-center gap-2">
                    <span>View Full Profile</span>
                    <ExternalLink className="w-4 h-4" />
                  </div>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
