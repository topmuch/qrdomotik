// ═══════════════════════════════════════════════════════════════════
// QR DOMOTIK — Constantes de l'application
// ═══════════════════════════════════════════════════════════════════

export const APP_NAME = 'QR Domotik';
export const APP_DESCRIPTION = 'Rendez votre maison intelligente avec des QR codes dynamiques';
export const APP_URL = 'https://qrdomotik.com';

// Durées d'alerte DLC (en jours avant péremption)
export const DLC_WARNING_DAYS = 3;  // Orange
export const DLC_CRITICAL_DAYS = 1; // Rouge

// Limites
export const MAX_QR_CODES_PER_HOME = 50;
export const MAX_ROOMS_PER_HOME = 20;
export const MAX_MEMBERS_PER_HOME = 10;
export const MAX_SHOPPING_ITEMS = 100;
export const MAX_CHORES = 50;
export const MAX_MEDICATIONS = 10;

// Icônes Lucide disponibles pour les pièces
export const ROOM_ICONS = [
  'Sofa',
  'Bed',
  'CookingPot',
  'Bath',
  'DoorOpen',
  'Car',
  'Lamp',
  'Monitor',
  'Flower2',
  'WashingMachine',
  'Refrigerator',
  ' Tv',
  'Armchair',
  'Warehouse',
] as const;
