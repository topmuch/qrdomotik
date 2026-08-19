// ═══════════════════════════════════════════════════════
// QR DOMOTIK V2 — Constantes de l'application
// ═══════════════════════════════════════════════════════

export const APP_NAME = 'QR Domotik';
export const APP_DESCRIPTION = 'Rendez votre maison intelligente avec des QR codes dynamiques';
export const APP_URL = 'https://qrdomotik.com';

// ─── DLC (Dates Limites Consommation) ──────────────────────────

// Seuils d'alerte en jours avant péremption
export const DLC_WARNING_DAYS = 3;  // Orange — notification in-app
export const DLC_CRITICAL_DAYS = 1; // Rouge    — notification push prioritaire

// ─── Stock ──────────────────────────────────────────────────────

// Quand le stock passe sous ce seuil, bascule automatiquement
// le produit dans la liste de courses
export const STOCK_AUTO_LIST_THRESHOLD = 1; // Seuil par défaut

// ─── Corvées ────────────────────────────────────────────────────

// Valeurs par défaut
export const DEFAULT_CHORE_POINTS = 10;
export const CHORE_VALIDATION_TIMEOUT_DAYS = 3; // Jours avant auto-validation

// ─── Invitations ────────────────────────────────────────────────

export const INVITATION_EXPIRY_DAYS = 7;
export const INVITATION_TOKEN_LENGTH = 32;

// ─── Limites ────────────────────────────────────────────────────

export const MAX_QR_CODES_PER_HOME = 50;
export const MAX_ROOMS_PER_HOME = 20;
export const MAX_MEMBERS_PER_HOME = 10;
export const MAX_SHOPPING_ITEMS = 100;
export const MAX_CHORES = 50;
export const MAX_MEDICATIONS = 10;
export const MAX_PRODUCTS_PER_HOME = 100;
export const MAX_GUESTBOOK_ENTRIES = 200;
export const MAX_ACTIVITY_LOGS_PER_HOME = 1000;

// ─── Portier Virtuel ────────────────────────────────────────────

export const PORTIER_RING_COOLDOWN_MS = 30000; // 30 secondes entre 2 sonneries
export const PORTIER_MAX_MESSAGES_PER_DAY = 50;

// ─── Rate Limiting (pages publiques) ────────────────────────────

export const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
export const RATE_LIMIT_MAX_REQUESTS = 30; // 30 requêtes par minute par IP

// ─── Icônes Lucide disponibles pour les pièces ──────────────────

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
  'Tv',
  'Armchair',
  'Warehouse',
  'KeyRound',
] as const;

// ─── Avatar colors ──────────────────────────────────────────────

export const AVATAR_COLORS = [
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#F59E0B', // amber
  '#10B981', // emerald
  '#3B82F6', // blue
  '#EF4444', // red
  '#6366F1', // indigo
  '#14B8A6', // teal
  '#F97316', // orange
  '#06B6D4', // cyan
] as const;
