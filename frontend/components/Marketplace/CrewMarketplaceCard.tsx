import React, { useState } from 'react';
import { RentCrewModal } from './RentCrewModal';
import { BuyCrewModal } from './BuyCrewModal';

export interface CrewCardData {
  id: string;
  name: string;
  description?: string;
  owner_name?: string;
  rental_price_c7t?: number;
  purchase_price_c7t?: number;
  rating?: number;
  total_missions?: number;
  is_available?: boolean;
}

interface CrewMarketplaceCardProps {
  crew: CrewCardData;
  onRefresh?: () => void;
}

export const CrewMarketplaceCard: React.FC<CrewMarketplaceCardProps> = ({ crew, onRefresh }) => {
  const [showRentModal, setShowRentModal] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);

  const canRent = crew.rental_price_c7t !== null && crew.rental_price_c7t !== undefined && crew.rental_price_c7t > 0;
  const canBuy = crew.purchase_price_c7t !== null && crew.purchase_price_c7t !== undefined && crew.purchase_price_c7t > 0;
  const isAvailable = crew.is_available !== false;

  return (
    <>
      <div className="p-6 rounded-3xl bg-white/5 border border-white/10 hover:border-[#ea2323]/30 transition-all">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-1">{crew.name}</h3>
            <p className="text-sm text-white/60">{crew.owner_name || 'Crew-7 Platform'}</p>
          </div>
          {!isAvailable && (
            <div className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
              Unavailable
            </div>
          )}
          {isAvailable && (
            <div className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold">
              Available
            </div>
          )}
        </div>

        {/* Description */}
        {crew.description && (
          <p className="text-sm text-white/70 mb-4 line-clamp-2">{crew.description}</p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 mb-4 text-sm">
          {crew.rating !== undefined && crew.rating !== null && (
            <div className="flex items-center gap-1">
              <span className="text-yellow-400">★</span>
              <span className="font-medium">{crew.rating.toFixed(1)}</span>
            </div>
          )}
          {crew.total_missions !== undefined && crew.total_missions !== null && (
            <div className="text-white/60">
              {crew.total_missions} mission{crew.total_missions !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Pricing */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {canRent ? (
            <div className="p-3 rounded-xl bg-gradient-to-br from-[#ea2323]/10 to-[#ea2323]/5 border border-[#ea2323]/20">
              <div className="text-xs text-white/50 mb-1">Rent/day</div>
              <div className="font-bold text-[#ea2323]">{crew.rental_price_c7t!.toFixed(2)} C7T</div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 opacity-50">
              <div className="text-xs text-white/50 mb-1">Rent/day</div>
              <div className="text-sm text-white/40">Not available</div>
            </div>
          )}

          {canBuy ? (
            <div className="p-3 rounded-xl bg-gradient-to-br from-[#ea2323]/10 to-[#ea2323]/5 border border-[#ea2323]/20">
              <div className="text-xs text-white/50 mb-1">Purchase</div>
              <div className="font-bold text-[#ea2323]">{crew.purchase_price_c7t!.toFixed(2)} C7T</div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 opacity-50">
              <div className="text-xs text-white/50 mb-1">Purchase</div>
              <div className="text-sm text-white/40">Not for sale</div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {canRent && isAvailable ? (
            <button
              onClick={() => setShowRentModal(true)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-[#ea2323]/10 hover:border-[#ea2323]/30 transition-all font-semibold text-sm"
            >
              Rent Crew
            </button>
          ) : (
            <button
              disabled
              className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 opacity-50 cursor-not-allowed font-semibold text-sm"
            >
              Rent Unavailable
            </button>
          )}

          {canBuy && isAvailable ? (
            <button
              onClick={() => setShowBuyModal(true)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#ea2323] hover:bg-[#ff2e2e] transition-all font-semibold text-sm shadow-lg shadow-[#ea2323]/30"
            >
              Buy Crew
            </button>
          ) : (
            <button
              disabled
              className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 opacity-50 cursor-not-allowed font-semibold text-sm"
            >
              Not For Sale
            </button>
          )}
        </div>
      </div>

      {/* Modals */}
      {showRentModal && canRent && (
        <RentCrewModal
          crewId={crew.id}
          crewName={crew.name}
          rentalPrice={crew.rental_price_c7t!}
          ownerName={crew.owner_name}
          onClose={() => setShowRentModal(false)}
          onSuccess={() => {
            setShowRentModal(false);
            onRefresh?.();
          }}
        />
      )}

      {showBuyModal && canBuy && (
        <BuyCrewModal
          crewId={crew.id}
          crewName={crew.name}
          purchasePrice={crew.purchase_price_c7t!}
          ownerName={crew.owner_name}
          description={crew.description}
          onClose={() => setShowBuyModal(false)}
          onSuccess={() => {
            setShowBuyModal(false);
            onRefresh?.();
          }}
        />
      )}
    </>
  );
};
