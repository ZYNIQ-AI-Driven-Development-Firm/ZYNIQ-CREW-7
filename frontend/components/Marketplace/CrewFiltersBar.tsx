import React, { useState } from 'react';
import { TagPill } from './SharedComponents';

export interface CrewFilters {
  search: string;
  industries: string[];
  priceRange: [number, number];
  levelRange: [number, number];
  xpRange: [number, number];
  minSuccessRate: number;
  availability: 'all' | 'available' | 'rented';
  sortBy: 'active' | 'rated' | 'xp' | 'newest';
}

interface CrewFiltersBarProps {
  filters: CrewFilters;
  onFiltersChange: (filters: CrewFilters) => void;
}

const INDUSTRY_OPTIONS = ['Dev', 'Marketing', 'Business', 'Finance', 'Ops', 'Custom'];

const SORT_OPTIONS = [
  { value: 'active', label: 'Most Active' },
  { value: 'rated', label: 'Highest Rated' },
  { value: 'xp', label: 'Most XP' },
  { value: 'newest', label: 'Newest' },
];

export const CrewFiltersBar: React.FC<CrewFiltersBarProps> = ({ filters, onFiltersChange }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const toggleIndustry = (industry: string) => {
    const newIndustries = filters.industries.includes(industry)
      ? filters.industries.filter(i => i !== industry)
      : [...filters.industries, industry];
    onFiltersChange({ ...filters, industries: newIndustries });
  };

  return (
    <div className="space-y-4">
      {/* Main Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="flex-1 min-w-[280px]">
          <div className="relative">
            <input
              type="text"
              value={filters.search}
              onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
              placeholder="Search crews by name or tag..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-[#ea2323]/50 outline-none placeholder:text-white/40 transition-all"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">🔍</span>
          </div>
        </div>

        {/* Sort Dropdown */}
        <select
          value={filters.sortBy}
          onChange={(e) => onFiltersChange({ ...filters, sortBy: e.target.value as any })}
          className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-[#ea2323]/50 outline-none cursor-pointer"
        >
          {SORT_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value} className="bg-[#0B0F19]">
              {opt.label}
            </option>
          ))}
        </select>

        {/* Advanced Filters Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-[#ea2323]/50 transition-all font-semibold"
        >
          {showAdvanced ? 'Hide' : 'Show'} Filters
        </button>
      </div>

      {/* Industry Toggle Pills */}
      <div className="flex flex-wrap gap-2">
        {INDUSTRY_OPTIONS.map(industry => (
          <TagPill
            key={industry}
            active={filters.industries.includes(industry)}
            onClick={() => toggleIndustry(industry)}
          >
            {industry}
          </TagPill>
        ))}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium mb-2">Price Range (C7T)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={filters.priceRange[0]}
                  onChange={(e) => onFiltersChange({ 
                    ...filters, 
                    priceRange: [Number(e.target.value), filters.priceRange[1]] 
                  })}
                  placeholder="Min"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-[#ea2323]/50 outline-none"
                />
                <span className="text-white/40">—</span>
                <input
                  type="number"
                  value={filters.priceRange[1]}
                  onChange={(e) => onFiltersChange({ 
                    ...filters, 
                    priceRange: [filters.priceRange[0], Number(e.target.value)] 
                  })}
                  placeholder="Max"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-[#ea2323]/50 outline-none"
                />
              </div>
            </div>

            {/* Level Range */}
            <div>
              <label className="block text-sm font-medium mb-2">Level Range</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={filters.levelRange[0]}
                  onChange={(e) => onFiltersChange({ 
                    ...filters, 
                    levelRange: [Number(e.target.value), filters.levelRange[1]] 
                  })}
                  placeholder="Min"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-[#ea2323]/50 outline-none"
                />
                <span className="text-white/40">—</span>
                <input
                  type="number"
                  value={filters.levelRange[1]}
                  onChange={(e) => onFiltersChange({ 
                    ...filters, 
                    levelRange: [filters.levelRange[0], Number(e.target.value)] 
                  })}
                  placeholder="Max"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-[#ea2323]/50 outline-none"
                />
              </div>
            </div>

            {/* Success Rate */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Min Success Rate: {filters.minSuccessRate}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={filters.minSuccessRate}
                onChange={(e) => onFiltersChange({ ...filters, minSuccessRate: Number(e.target.value) })}
                className="w-full accent-[#ea2323]"
              />
            </div>

            {/* XP Range */}
            <div>
              <label className="block text-sm font-medium mb-2">XP Range</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={filters.xpRange[0]}
                  onChange={(e) => onFiltersChange({ 
                    ...filters, 
                    xpRange: [Number(e.target.value), filters.xpRange[1]] 
                  })}
                  placeholder="Min"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-[#ea2323]/50 outline-none"
                />
                <span className="text-white/40">—</span>
                <input
                  type="number"
                  value={filters.xpRange[1]}
                  onChange={(e) => onFiltersChange({ 
                    ...filters, 
                    xpRange: [filters.xpRange[0], Number(e.target.value)] 
                  })}
                  placeholder="Max"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-[#ea2323]/50 outline-none"
                />
              </div>
            </div>

            {/* Availability */}
            <div>
              <label className="block text-sm font-medium mb-2">Availability</label>
              <select
                value={filters.availability}
                onChange={(e) => onFiltersChange({ ...filters, availability: e.target.value as any })}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-[#ea2323]/50 outline-none cursor-pointer"
              >
                <option value="all" className="bg-[#0B0F19]">All Crews</option>
                <option value="available" className="bg-[#0B0F19]">Available Only</option>
                <option value="rented" className="bg-[#0B0F19]">Currently Rented</option>
              </select>
            </div>
          </div>

          {/* Reset Filters */}
          <div className="flex justify-end">
            <button
              onClick={() => onFiltersChange({
                search: '',
                industries: [],
                priceRange: [0, 1000],
                levelRange: [1, 100],
                xpRange: [0, 100000],
                minSuccessRate: 0,
                availability: 'all',
                sortBy: 'active',
              })}
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 transition-all font-semibold text-sm"
            >
              Reset All Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
