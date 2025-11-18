/**
 * Helper utilities to convert marketplace crew data to Web3 NFT metadata format
 */

import type { CrewNftMetadata, AgentNftMetadata } from '../../src/lib/web3/metadata';
import { createCrewNftMetadata, createAgentNftMetadata, type CrewMarketplaceItem as MapperCrewItem, type AgentProfile } from '../../src/lib/web3/mappers';
import type { CrewMarketplaceItem } from './MarketplaceCard';

/**
 * Convert marketplace crew item to Web3 NFT metadata
 */
export function crewToNftMetadata(crew: CrewMarketplaceItem): CrewNftMetadata {
  // Map our marketplace format to the mapper's expected format
  const mapperCrew: MapperCrewItem = {
    id: crew.id,
    name: crew.name,
    description: `${crew.category} crew specialized in ${crew.typeTags.join(', ')}. Level ${crew.level} with ${crew.successRate}% success rate.`,
    category: crew.category,
    level: crew.level,
    xp: crew.xp,
    missionsCompleted: crew.missionsCompleted,
    successRate: crew.successRate,
    clientRating: crew.rating,
    hoursWorked: crew.missionsCompleted * 2.5, // Estimated hours
    artifactsCount: Math.floor(crew.missionsCompleted * 1.5),
    rarity: normalizeRarity(crew.rarity),
    status: 'available',
    pricePerMission: crew.pricePerMission,
    priceBuyout: crew.pricePerMission ? crew.pricePerMission * 50 : undefined,
    currency: crew.priceCurrency || 'C7T',
    imageUrl: `https://crew7.ai/assets/crews/${crew.slug}.png`,
  };
  
  return createCrewNftMetadata(mapperCrew, {
    chainId: crew.chainId || undefined,
    tokenId: crew.onChainTokenId || undefined,
  });
}

/**
 * Normalize marketplace rarity to Web3 rarity tier
 */
function normalizeRarity(rarity?: string): 'common' | 'advanced' | 'elite' | 'prime' {
  if (!rarity) return 'common';
  
  // Map marketplace rarities to Web3 standard
  switch (rarity.toLowerCase()) {
    case 'prime':
      return 'prime';
    case 'elite':
    case 'rare':
      return 'elite';
    case 'advanced':
    case 'uncommon':
      return 'advanced';
    default:
      return 'common';
  }
}

/**
 * Batch convert multiple crews to NFT metadata
 */
export function batchCrewsToNftMetadata(crews: CrewMarketplaceItem[]): CrewNftMetadata[] {
  return crews.map(crewToNftMetadata);
}

/**
 * Get NFT metadata for a specific crew by ID
 */
export function getCrewNftMetadata(crewId: string, crews: CrewMarketplaceItem[]): CrewNftMetadata | null {
  const crew = crews.find(c => c.id === crewId);
  return crew ? crewToNftMetadata(crew) : null;
}

