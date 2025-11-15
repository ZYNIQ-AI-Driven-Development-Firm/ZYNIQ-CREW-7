import { CrewMarketplaceItem } from './MarketplaceCard';

export const MOCK_CREWS: CrewMarketplaceItem[] = [
  {
    id: '1',
    name: 'Elite DevOps Squadron',
    slug: 'elite-devops-squadron',
    typeTags: ['Dev', 'Ops', 'Cloud'],
    category: 'Development',
    level: 42,
    xp: 8750,
    xpMax: 10000,
    missionsCompleted: 287,
    successRate: 97,
    rating: 4.9,
    rarity: 'prime',
    pricePerMission: 450,
    priceCurrency: 'C7T',
    onChainTokenId: '0x7f8b...3a2c',
    chainId: '1',
    isFeatured: true,
  },
  {
    id: '2',
    name: 'Marketing Automation Crew',
    slug: 'marketing-automation-crew',
    typeTags: ['Marketing', 'Analytics', 'Content'],
    category: 'Marketing',
    level: 35,
    xp: 6200,
    xpMax: 10000,
    missionsCompleted: 198,
    successRate: 94,
    rating: 4.7,
    rarity: 'elite',
    pricePerMission: 320,
    priceCurrency: 'C7T',
    onChainTokenId: null,
    chainId: null,
    isFeatured: true,
  },
  {
    id: '3',
    name: 'Financial Analysis Task Force',
    slug: 'financial-analysis-task-force',
    typeTags: ['Finance', 'Business', 'Data'],
    category: 'Finance',
    level: 38,
    xp: 7100,
    xpMax: 10000,
    missionsCompleted: 245,
    successRate: 96,
    rating: 4.8,
    rarity: 'elite',
    pricePerMission: 380,
    priceCurrency: 'C7T',
    onChainTokenId: '0x9b4c...7e1f',
    chainId: '1',
    isFeatured: true,
  },
  {
    id: '4',
    name: 'Full-Stack Development Unit',
    slug: 'full-stack-development-unit',
    typeTags: ['Dev', 'Frontend', 'Backend'],
    category: 'Development',
    level: 28,
    xp: 4500,
    xpMax: 10000,
    missionsCompleted: 152,
    successRate: 92,
    rating: 4.6,
    rarity: 'advanced',
    pricePerMission: 280,
    priceCurrency: 'C7T',
    onChainTokenId: null,
    chainId: null,
  },
  {
    id: '5',
    name: 'Content Creation Specialists',
    slug: 'content-creation-specialists',
    typeTags: ['Marketing', 'Content', 'Design'],
    category: 'Marketing',
    level: 24,
    xp: 3800,
    xpMax: 10000,
    missionsCompleted: 134,
    successRate: 90,
    rating: 4.5,
    rarity: 'advanced',
    pricePerMission: 240,
    priceCurrency: 'C7T',
    onChainTokenId: null,
    chainId: null,
  },
  {
    id: '6',
    name: 'Business Strategy Consultants',
    slug: 'business-strategy-consultants',
    typeTags: ['Business', 'Strategy', 'Analysis'],
    category: 'Business',
    level: 31,
    xp: 5400,
    xpMax: 10000,
    missionsCompleted: 176,
    successRate: 93,
    rating: 4.7,
    rarity: 'advanced',
    pricePerMission: 310,
    priceCurrency: 'C7T',
    onChainTokenId: '0x3d2e...9b7a',
    chainId: '1',
  },
  {
    id: '7',
    name: 'Data Science & ML Team',
    slug: 'data-science-ml-team',
    typeTags: ['Dev', 'Data', 'ML'],
    category: 'Development',
    level: 40,
    xp: 8200,
    xpMax: 10000,
    missionsCompleted: 265,
    successRate: 95,
    rating: 4.8,
    rarity: 'elite',
    pricePerMission: 420,
    priceCurrency: 'C7T',
    onChainTokenId: '0x5a8f...4c3b',
    chainId: '1',
  },
  {
    id: '8',
    name: 'Operations Optimization Squad',
    slug: 'operations-optimization-squad',
    typeTags: ['Ops', 'Automation', 'Business'],
    category: 'Operations',
    level: 26,
    xp: 4100,
    xpMax: 10000,
    missionsCompleted: 142,
    successRate: 91,
    rating: 4.5,
    rarity: 'advanced',
    pricePerMission: 260,
    priceCurrency: 'C7T',
    onChainTokenId: null,
    chainId: null,
  },
  {
    id: '9',
    name: 'UI/UX Design Collective',
    slug: 'ui-ux-design-collective',
    typeTags: ['Design', 'UX', 'Frontend'],
    category: 'Design',
    level: 22,
    xp: 3200,
    xpMax: 10000,
    missionsCompleted: 118,
    successRate: 89,
    rating: 4.4,
    rarity: 'common',
    pricePerMission: 220,
    priceCurrency: 'C7T',
    onChainTokenId: null,
    chainId: null,
  },
  {
    id: '10',
    name: 'Blockchain Integration Experts',
    slug: 'blockchain-integration-experts',
    typeTags: ['Dev', 'Blockchain', 'Finance'],
    category: 'Development',
    level: 36,
    xp: 6800,
    xpMax: 10000,
    missionsCompleted: 212,
    successRate: 94,
    rating: 4.7,
    rarity: 'elite',
    pricePerMission: 390,
    priceCurrency: 'C7T',
    onChainTokenId: '0x2b9c...8d4f',
    chainId: '1',
    isFeatured: true,
  },
  {
    id: '11',
    name: 'Customer Success Crew',
    slug: 'customer-success-crew',
    typeTags: ['Business', 'Support', 'Analytics'],
    category: 'Business',
    level: 19,
    xp: 2600,
    xpMax: 10000,
    missionsCompleted: 94,
    successRate: 88,
    rating: 4.3,
    rarity: 'common',
    pricePerMission: 190,
    priceCurrency: 'C7T',
    onChainTokenId: null,
    chainId: null,
  },
  {
    id: '12',
    name: 'Security & Compliance Team',
    slug: 'security-compliance-team',
    typeTags: ['Dev', 'Security', 'Ops'],
    category: 'Security',
    level: 33,
    xp: 5900,
    xpMax: 10000,
    missionsCompleted: 189,
    successRate: 96,
    rating: 4.8,
    rarity: 'advanced',
    pricePerMission: 350,
    priceCurrency: 'C7T',
    onChainTokenId: '0x6f3d...2a9e',
    chainId: '1',
  },
];

// Filter and sort crews based on filters
export const filterAndSortCrews = (
  crews: CrewMarketplaceItem[],
  filters: {
    search: string;
    industries: string[];
    priceRange: [number, number];
    levelRange: [number, number];
    xpRange: [number, number];
    minSuccessRate: number;
    sortBy: 'active' | 'rated' | 'xp' | 'newest';
  }
): CrewMarketplaceItem[] => {
  let filtered = crews;

  // Apply search filter
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(
      crew =>
        crew.name.toLowerCase().includes(searchLower) ||
        crew.typeTags.some(tag => tag.toLowerCase().includes(searchLower))
    );
  }

  // Apply industry filter
  if (filters.industries.length > 0) {
    filtered = filtered.filter(crew =>
      crew.typeTags.some(tag => filters.industries.includes(tag))
    );
  }

  // Apply price range filter
  filtered = filtered.filter(
    crew =>
      crew.pricePerMission >= filters.priceRange[0] &&
      crew.pricePerMission <= filters.priceRange[1]
  );

  // Apply level range filter
  filtered = filtered.filter(
    crew =>
      crew.level >= filters.levelRange[0] &&
      crew.level <= filters.levelRange[1]
  );

  // Apply XP range filter
  filtered = filtered.filter(
    crew =>
      crew.xp >= filters.xpRange[0] &&
      crew.xp <= filters.xpRange[1]
  );

  // Apply success rate filter
  filtered = filtered.filter(crew => crew.successRate >= filters.minSuccessRate);

  // Apply sorting
  switch (filters.sortBy) {
    case 'active':
      filtered.sort((a, b) => b.missionsCompleted - a.missionsCompleted);
      break;
    case 'rated':
      filtered.sort((a, b) => b.rating - a.rating);
      break;
    case 'xp':
      filtered.sort((a, b) => b.xp - a.xp);
      break;
    case 'newest':
      filtered.sort((a, b) => parseInt(b.id) - parseInt(a.id));
      break;
  }

  return filtered;
};
