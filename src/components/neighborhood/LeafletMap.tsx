'use client';

import { useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { MERCHANT_CATEGORY_LABELS, type MerchantCategory } from '@/types';

// Fix default marker icon issue in Next.js / webpack
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x.src,
  iconUrl: markerIcon.src,
  shadowUrl: markerShadow.src,
});

// Category-based colors for map markers
const CATEGORY_COLORS: Record<string, string> = {
  boulangerie: '#f59e0b',
  boulangerie_patisserie: '#f59e0b',
  boucherie: '#ef4444',
  pharmacie: '#10b981',
  epicerie: '#06b6d4',
  fleuriste: '#ec4899',
  supermarche: '#3b82f6',
  pressing: '#8b5cf6',
  librairie: '#6366f1',
  quincaillerie: '#f97316',
  bar_cafe: '#78350f',
  restaurant: '#dc2626',
  salon_coiffure: '#a855f7',
  autre: '#64748b',
};

export type MerchantMapData = {
  id: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  address: string;
  logoUrl?: string | null;
  ratingAvg?: number;
};

interface LeafletMapProps {
  merchants: MerchantMapData[];
  center: [number, number];
  radius?: number;
  onMerchantClick?: (id: string) => void;
  promoMerchants?: string[];
}

function createCategoryIcon(category: string, hasPromo: boolean): L.DivIcon {
  const color = CATEGORY_COLORS[category] || '#64748b';
  const size = hasPromo ? 36 : 28;
  const borderColor = hasPromo ? '#f97316' : 'white';
  const pulseClass = hasPromo ? 'promo-marker-pulse' : '';

  const html = `
    <div class="${pulseClass}" style="position:relative;">
      ${hasPromo ? '<div style="position:absolute;inset:-4px;border-radius:50%;border:2px solid #f97316;animation:markerPulse 2s ease-in-out infinite;"></div>' : ''}
      <div style="
        width:${size}px;height:${size}px;
        background:${color};
        border:3px solid ${borderColor};
        border-radius:50%;
        box-shadow:0 2px 6px rgba(0,0,0,0.3);
        display:flex;align-items:center;justify-content:center;
        color:white;font-size:${hasPromo ? '14px' : '11px'};font-weight:bold;
        text-shadow:0 1px 2px rgba(0,0,0,0.4);
      ">
        ${hasPromo ? '🔥' : ''}
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

function buildPopupContent(merchant: MerchantMapData, hasPromo: boolean): string {
  const categoryLabel = MERCHANT_CATEGORY_LABELS[merchant.category as MerchantCategory] || merchant.category;
  const ratingDisplay = merchant.ratingAvg != null && merchant.ratingAvg > 0
    ? `<span style="color:#f59e0b;margin-left:8px;">★ ${merchant.ratingAvg.toFixed(1)}</span>`
    : '';

  return `
    <div style="min-width:200px;font-family:system-ui,sans-serif;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
        <strong style="font-size:14px;">${merchant.name}</strong>
      </div>
      <div style="display:flex;gap:4px;margin-bottom:6px;">
        <span style="
          background:${CATEGORY_COLORS[merchant.category] || '#64748b'}15;
          color:${CATEGORY_COLORS[merchant.category] || '#64748b'};
          padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:500;
        ">${categoryLabel}</span>
        ${hasPromo ? '<span style="background:#fff7ed;color:#f97316;padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:500;">🔥 Promos actives</span>' : ''}
      </div>
      ${merchant.address ? `<p style="color:#64748b;font-size:12px;margin:0 0 4px;">📍 ${merchant.address}</p>` : ''}
      <div style="font-size:12px;color:#64748b;">${ratingDisplay}</div>
    </div>
  `;
}

export function LeafletMap({
  merchants,
  center,
  radius,
  onMerchantClick,
  promoMerchants = [],
}: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersLayer = useRef<L.LayerGroup | null>(null);

  const promoSet = useMemo(
    () => new Set(promoMerchants),
    [promoMerchants],
  );

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current, {
      center,
      zoom: 14,
      zoomControl: true,
      attributionControl: true,
    });

    // OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // Radius circle
    if (radius) {
      L.circle(center, {
        radius: radius * 1000, // km to meters
        color: '#10b981',
        fillColor: '#10b981',
        fillOpacity: 0.06,
        weight: 1.5,
        dashArray: '6 4',
      }).addTo(map);
    }

    // User position marker
    const userIcon = L.divIcon({
      html: `
        <div style="
          width:16px;height:16px;
          background:#10b981;
          border:3px solid white;
          border-radius:50%;
          box-shadow:0 0 0 3px rgba(16,185,129,0.3), 0 2px 6px rgba(0,0,0,0.2);
        "></div>
      `,
      className: '',
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
    L.marker(center, { icon: userIcon, interactive: false }).addTo(map);

    markersLayer.current = L.layerGroup().addTo(map);
    mapInstance.current = map;

    // Fit bounds to show radius
    if (radius) {
      map.fitBounds(L.circle(center, { radius: radius * 1000 }).getBounds(), {
        padding: [30, 30],
      });
    }

    return () => {
      map.remove();
      mapInstance.current = null;
      markersLayer.current = null;
    };
  // Only run once on mount
  }, []);

  // Update markers when merchants change
  useEffect(() => {
    if (!markersLayer.current || !mapInstance.current) return;

    markersLayer.current.clearLayers();

    merchants.forEach((merchant) => {
      const hasPromo = promoSet.has(merchant.id);
      const icon = createCategoryIcon(merchant.category, hasPromo);

      const marker = L.marker(
        [merchant.latitude, merchant.longitude],
        { icon },
      );

      const popupContent = buildPopupContent(merchant, hasPromo);
      marker.bindPopup(popupContent, {
        closeButton: true,
        className: 'merchant-popup',
      });

      marker.on('click', () => {
        onMerchantClick?.(merchant.id);
      });

      markersLayer.current!.addLayer(marker);
    });
  }, [merchants, promoSet, onMerchantClick]);

  // Update center when it changes (e.g. geolocation update)
  useEffect(() => {
    if (!mapInstance.current) return;
    mapInstance.current.setView(center, mapInstance.current.getZoom(), {
      animate: true,
    });
  }, [center]);

  return (
    <>
      <style jsx global>{`
        .merchant-popup .leaflet-popup-content-wrapper {
          border-radius: 12px !important;
          box-shadow: 0 4px 20px rgba(0,0,0,0.12) !important;
          padding: 4px !important;
        }
        .merchant-popup .leaflet-popup-content {
          margin: 10px 14px !important;
        }
        .merchant-popup .leaflet-popup-tip {
          box-shadow: 0 4px 20px rgba(0,0,0,0.12) !important;
        }
        @keyframes markerPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.4); }
        }
        .promo-marker-pulse {
          animation: none; /* The inner div handles the pulse */
        }
        .leaflet-control-zoom {
          border-radius: 8px !important;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
        }
        .leaflet-control-zoom a {
          width: 32px !important;
          height: 32px !important;
          line-height: 32px !important;
          font-size: 14px !important;
        }
      `}</style>
      <div
        ref={mapRef}
        className="w-full h-[400px] md:h-[600px] rounded-lg overflow-hidden"
        role="application"
        aria-label="Carte des commerçants"
      />
    </>
  );
}

export default LeafletMap;
