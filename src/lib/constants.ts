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

// ─── V3 : Géolocalisation ────────────────────────────────────────

export const DEFAULT_MAP_CENTER = { latitude: 14.6937, longitude: -17.4441 }; // Dakar
export const DEFAULT_SEARCH_RADIUS_KM = 3;
export const MAX_SEARCH_RADIUS_KM = 5;
export const FLASH_SALE_PUSH_RADIUS_KM = 0.5; // 500m pour push alerte flash
export const PROMO_MATCHING_RADIUS_KM = 2; // 2km pour matching liste courses

// ─── V3 : Scraping ──────────────────────────────────────────────

export const SCRAPING_CRON_HOUR = 3; // 3h00 du matin
export const SCRAPING_MAX_RETRIES = 3;
export const SCRAPING_RETRY_DELAY_MS = 5000;
export const SCRAPING_SOURCES = ['carrefour', 'auchan', 'leclerc'] as const;
export const SCRAPING_USER_AGENT = 'QRDomotik-Bot/1.0 (compatible; +https://qrdomotik.com/bot)';

// ─── V3 : Monétisation — Prix ───────────────────────────────────

export const PRICING = {
  // Abonnements commerçants
  merchant_premium: { amount: 9.90, label: 'Commerçant Premium' },
  merchant_featured: { amount: 19.90, label: 'Commerçant En Vedette' },
  // Abonnements artisans
  professional_premium: { amount: 15, label: 'Artisan Premium' },
  professional_featured: { amount: 19.90, label: 'Artisan En Vedette' },
  // Micro-paiements
  flash_sale_trigger: { amount: 0.50, label: 'Déclenchement vente flash' },
  verification_badge: { amount: 30, label: 'Badge vérifié (annuel)' },
} as const;

// ─── V3 : Commissions ───────────────────────────────────────────

export const COMMISSIONS = {
  flash_sale: { min: 0.50, max: 0.50, default: 0.50, label: 'Commission vente flash' },
  service_match_depannage: { min: 5, max: 5, default: 5, label: 'Mise en relation dépannage' },
  service_match_entretien: { min: 3, max: 3, default: 3, label: 'Mise en relation entretien' },
  service_match_bien_etre: { min: 2, max: 2, default: 2, label: 'Mise en relation bien-être' },
  service_match_assistance: { min: 2, max: 2, default: 2, label: 'Mise en relation assistance' },
  redemption: { min: 0.10, max: 0.50, default: 0.20, label: 'Commission coupon utilisé' },
} as const;

// ─── V3 : Flash Sales ────────────────────────────────────────────

export const FLASH_SALE_DURATIONS = [1, 2, 3] as const; // heures
export const FLASH_SALE_DEFAULT_DURATION = 2;

// ─── V3 : Limites V3 ────────────────────────────────────────────

export const MAX_PROMOS_PER_MERCHANT_FREE = 3;
export const MAX_PROMOS_PER_MERCHANT_PREMIUM = 50;
export const MAX_SERVICES_PER_PROFESSIONAL = 20;
export const MAX_PORTFOLIO_IMAGES = 10;
export const MAX_VERIFICATION_DOCS = 5;
export const MAX_REVIEW_LENGTH = 1000;
export const MAX_SERVICE_DESCRIPTION_LENGTH = 2000;
export const REVIEW_MIN_RATING = 1;
export const REVIEW_MAX_RATING = 5;

// ─── V3 : Emergency QR ──────────────────────────────────────────

export const EMERGENCY_CATEGORIES = ['plumber', 'electrician', 'locksmith', 'heating'] as const;
export const EMERGENCY_PROS_TO_SHOW = 3; // Nombre de pros affichés sur page urgence
