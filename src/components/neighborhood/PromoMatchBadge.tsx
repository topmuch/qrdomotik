'use client';

import { Flame } from 'lucide-react';

interface PromoMatchBadgeProps {
  distance: number;
  promoPrice: number;
  merchantName: string;
  onClick?: () => void;
}

/**
 * Format distance for badge display.
 * < 1 km → "300m", >= 1 km → "1.2km"
 */
function formatBadgeDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  return `${km.toFixed(1)}km`;
}

export function PromoMatchBadge({
  distance,
  promoPrice,
  merchantName,
  onClick,
}: PromoMatchBadgeProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
        bg-orange-100 text-orange-700 hover:bg-orange-200 transition-colors
        cursor-pointer border border-orange-200 max-w-full truncate"
      title={`${merchantName} — ${formatBadgeDistance(distance)} — ${promoPrice.toFixed(2)}€`}
    >
      <Flame className="h-3 w-3 flex-shrink-0 text-orange-500" />
      <span className="truncate">
        Promo à {formatBadgeDistance(distance)}
        {promoPrice > 0 && (
          <span className="ml-1 font-semibold">{promoPrice.toFixed(2)}€</span>
        )}
      </span>
    </button>
  );
}

export default PromoMatchBadge;
