// ═══════════════════════════════════════════════════════════════════
// QR DOMOTIK V2 — Types TypeScript partagés
// ═══════════════════════════════════════════════════════════════════

// ─── QR Code Types ─────────────────────────────────────────────────────────

export type QrType =
  // V1
  | 'wifi'
  | 'link'
  | 'info'
  | 'postit'
  | 'shopping_list'
  | 'doorman'
  | 'medication'
  | 'chores'
  | 'stock_dlc'
  // V2
  | 'guestbook'
  | 'energy_counter'
  | 'keys_tracker'
  | 'daily_menu'
  // V3
  | 'emergency_service'
  | 'neighborhood';

export const QR_TYPE_LABELS: Record<QrType, string> = {
  wifi: 'Wi-Fi',
  link: 'Lien Externe',
  info: 'Guide Maison',
  postit: 'Post-it Numérique',
  shopping_list: 'Liste de Courses',
  doorman: 'Portier Virtuel',
  medication: 'Médicaments',
  chores: 'Corvées Enfants',
  stock_dlc: 'Stock & DLC',
  guestbook: "Livre d'Or",
  energy_counter: 'Compteur Énergie',
  keys_tracker: 'Clés & Objets',
  daily_menu: 'Menu du Jour',
  emergency_service: 'Urgence Artisan',
  neighborhood: 'Mon Quartier',
};

export const QR_TYPE_ICONS: Record<QrType, string> = {
  wifi: 'Wifi',
  link: 'ExternalLink',
  info: 'BookOpen',
  postit: 'StickyNote',
  shopping_list: 'ShoppingCart',
  doorman: 'DoorOpen',
  medication: 'Pill',
  chores: 'Star',
  stock_dlc: 'Package',
  guestbook: 'MessageSquare',
  energy_counter: 'Zap',
  keys_tracker: 'KeyRound',
  daily_menu: 'UtensilsCrossed',
  emergency_service: 'Siren',
  neighborhood: 'MapPin',
};

export const QR_TYPE_DESCRIPTIONS: Record<QrType, string> = {
  wifi: 'Partagez vos identifiants Wi-Fi sans les dicter',
  link: 'Redirigez vers une playlist, un manuel PDF, un site...',
  info: "Guide d'utilisation de la maison, consignes, astuces",
  postit: 'Message court modifiable en temps réel',
  shopping_list: 'Liste collaborative avec cases à cocher',
  doorman: 'Gérez les livraisons et visites à distance',
  medication: 'Suivi quotidien de prise de médicaments',
  chores: 'Tâches gamifiées avec système de points',
  stock_dlc: 'Suivi des stocks et alertes de péremption',
  guestbook: 'Laissez un message aux propriétaires',
  energy_counter: 'Suivez votre consommation énergétique',
  keys_tracker: 'Retrouvez vos clés et objets importants',
  daily_menu: 'Affichez le menu du jour à la cuisine',
  emergency_service: 'QR d\'urgence : appelez un artisan en 1 clic',
  neighborhood: 'Carte des commerces et promos du quartier',
};

// ─── QR Types par catégorie (pour l'UI) ────────────────────────────────────

export const QR_TYPE_CATEGORIES: Record<string, { label: string; types: QrType[] }> = {
  communication: {
    label: 'Communication',
    types: ['wifi', 'link', 'info', 'postit', 'guestbook'],
  },
  organisation: {
    label: 'Organisation',
    types: ['shopping_list', 'daily_menu', 'medication', 'keys_tracker'],
  },
  securite: {
    label: 'Sécurité & Accueil',
    types: ['doorman', 'emergency_service'],
  },
  famille: {
    label: 'Famille',
    types: ['chores', 'stock_dlc', 'energy_counter'],
  },
  // V3
  quartier: {
    label: 'Quartier & Services',
    types: ['neighborhood'],
  },
};

// ─── Home Member Roles ────────────────────────────────────────────────────

export type HomeMemberRole = 'owner' | 'admin' | 'member' | 'child';

export const MEMBER_ROLE_LABELS: Record<HomeMemberRole, string> = {
  owner: 'Propriétaire',
  admin: 'Administrateur',
  member: 'Membre',
  child: 'Enfant',
};

export const MEMBER_ROLE_COLORS: Record<HomeMemberRole, string> = {
  owner: 'bg-purple-100 text-purple-800',
  admin: 'bg-blue-100 text-blue-800',
  member: 'bg-gray-100 text-gray-800',
  child: 'bg-amber-100 text-amber-800',
};

// Permissions par rôle
export const ROLE_PERMISSIONS: Record<HomeMemberRole, {
  canCreateQr: boolean;
  canEditQr: boolean;
  canDeleteQr: boolean;
  canInviteMembers: boolean;
  canManageMembers: boolean;
  canManageProducts: boolean;
  canManageChores: boolean;
  canValidateChores: boolean;
  canViewActivityLogs: boolean;
  canEditHomeSettings: boolean;
}> = {
  owner: {
    canCreateQr: true,
    canEditQr: true,
    canDeleteQr: true,
    canInviteMembers: true,
    canManageMembers: true,
    canManageProducts: true,
    canManageChores: true,
    canValidateChores: true,
    canViewActivityLogs: true,
    canEditHomeSettings: true,
  },
  admin: {
    canCreateQr: true,
    canEditQr: true,
    canDeleteQr: true,
    canInviteMembers: true,
    canManageMembers: false,
    canManageProducts: true,
    canManageChores: true,
    canValidateChores: true,
    canViewActivityLogs: true,
    canEditHomeSettings: false,
  },
  member: {
    canCreateQr: true,
    canEditQr: true,
    canDeleteQr: false,
    canInviteMembers: false,
    canManageMembers: false,
    canManageProducts: true,
    canManageChores: false,
    canValidateChores: false,
    canViewActivityLogs: true,
    canEditHomeSettings: false,
  },
  child: {
    canCreateQr: false,
    canEditQr: false,
    canDeleteQr: false,
    canInviteMembers: false,
    canManageMembers: false,
    canManageProducts: false,
    canManageChores: false,
    canValidateChores: false,
    canViewActivityLogs: false,
    canEditHomeSettings: false,
  },
};

// ─── Product Categories ───────────────────────────────────────────────────

export type ProductCategory =
  | 'laitier'
  | 'viande'
  | 'epicerie'
  | 'boisson'
  | 'fruit'
  | 'conserve'
  | 'surgelé'
  | 'autre';

export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  laitier: 'Produits laitiers',
  viande: 'Viandes & Poissons',
  epicerie: 'Épicerie',
  boisson: 'Boissons',
  fruit: 'Fruits & Légumes',
  conserve: 'Conserves',
  surgelé: 'Surgelés',
  autre: 'Autre',
};

export const PRODUCT_CATEGORY_ICONS: Record<ProductCategory, string> = {
  laitier: 'Milk',
  viande: 'Beef',
  epicerie: 'ShoppingBasket',
  boisson: 'Wine',
  fruit: 'Apple',
  conserve: 'Package',
  surgelé: 'Snowflake',
  autre: 'Box',
};

// ─── Product Instance Status ──────────────────────────────────────────────

export type ProductStatus = 'fresh' | 'warning' | 'critical' | 'expired' | 'consumed';

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  fresh: 'Frais',
  warning: 'Bientôt périmé',
  critical: 'Urgent',
  expired: 'Périmé',
  consumed: 'Consommé',
};

export const PRODUCT_STATUS_COLORS: Record<ProductStatus, string> = {
  fresh: 'bg-emerald-100 text-emerald-800',
  warning: 'bg-amber-100 text-amber-800',
  critical: 'bg-red-100 text-red-800',
  expired: 'bg-gray-100 text-gray-500 line-through',
  consumed: 'bg-blue-100 text-blue-800',
};

// ─── Activity Log Action Types (V2 Enriched) ──────────────────────────────

export type ActivityActionType =
  // Portier Virtuel
  | 'ring'
  | 'message_left'
  | 'instruction_used'
  | 'porter_mode_changed'
  // QR générique
  | 'wifi_connected'
  | 'qr_scanned'
  | 'pin_verified'
  // Médicaments
  | 'medication_taken'
  // Corvées
  | 'chore_completed'
  | 'chore_validated'
  | 'chore_rejected'
  // Stock & DLC
  | 'item_checked'
  | 'item_added'
  | 'item_removed'
  | 'product_scanned'
  | 'product_consumed'
  | 'stock_alert'
  | 'dlc_warning'
  | 'item_added_to_list'
  // Livre d'or
  | 'guestbook_entry'
  // Membres
  | 'member_invited'
  | 'member_joined'
  | 'member_role_changed';

export const ACTION_TYPE_LABELS: Record<ActivityActionType, string> = {
  ring: 'Sonnette',
  message_left: 'Message laissé',
  instruction_used: 'Consigne utilisée',
  porter_mode_changed: 'Mode portier changé',
  wifi_connected: 'Wi-Fi connecté',
  qr_scanned: 'QR scanné',
  pin_verified: 'PIN vérifié',
  medication_taken: 'Médicament pris',
  chore_completed: 'Corvée terminée',
  chore_validated: 'Corvée validée',
  chore_rejected: 'Corvée rejetée',
  item_checked: 'Article coché',
  item_added: 'Article ajouté',
  item_removed: 'Article supprimé',
  product_scanned: 'Produit scanné',
  product_consumed: 'Produit consommé',
  stock_alert: 'Alerte stock bas',
  dlc_warning: 'Alerte péremption',
  item_added_to_list: 'Ajouté à la liste de courses',
  guestbook_entry: 'Entrée livre d\'or',
  member_invited: 'Membre invité',
  member_joined: 'Membre rejoint',
  member_role_changed: 'Rôle modifié',
};

export const ACTION_TYPE_ICONS: Record<ActivityActionType, string> = {
  ring: 'Bell',
  message_left: 'MessageSquare',
  instruction_used: 'ClipboardList',
  porter_mode_changed: 'ToggleLeft',
  wifi_connected: 'Wifi',
  qr_scanned: 'QrCode',
  pin_verified: 'Lock',
  medication_taken: 'Pill',
  chore_completed: 'CheckCircle',
  chore_validated: 'ThumbsUp',
  chore_rejected: 'XCircle',
  item_checked: 'Check',
  item_added: 'Plus',
  item_removed: 'Trash2',
  product_scanned: 'ScanBarcode',
  product_consumed: 'UtensilsCrossed',
  stock_alert: 'AlertTriangle',
  dlc_warning: 'Clock',
  item_added_to_list: 'ShoppingCart',
  guestbook_entry: 'BookOpen',
  member_invited: 'UserPlus',
  member_joined: 'UserCheck',
  member_role_changed: 'Shield',
};

// ─── Chore Types ──────────────────────────────────────────────────────────

export type ChoreFrequency = 'daily' | 'weekly' | 'once';

export const CHORE_FREQUENCY_LABELS: Record<ChoreFrequency, string> = {
  daily: 'Quotidien',
  weekly: 'Hebdomadaire',
  once: 'Ponctuel',
};

export type ChoreCompletionStatus = 'pending_validation' | 'validated' | 'rejected';

export const CHORE_COMPLETION_STATUS_LABELS: Record<ChoreCompletionStatus, string> = {
  pending_validation: 'En attente',
  validated: 'Validé',
  rejected: 'Rejeté',
};

export const CHORE_COMPLETION_STATUS_COLORS: Record<ChoreCompletionStatus, string> = {
  pending_validation: 'bg-amber-100 text-amber-800',
  validated: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
};

// ─── Invitation Status ────────────────────────────────────────────────────

export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked';

export const INVITATION_STATUS_LABELS: Record<InvitationStatus, string> = {
  pending: 'En attente',
  accepted: 'Acceptée',
  expired: 'Expirée',
  revoked: 'Annulée',
};

// ─── Notification Types ───────────────────────────────────────────────────

export type NotificationType =
  | 'dlc_warning'
  | 'stock_alert'
  | 'visitor_message'
  | 'visitor_ring'
  | 'chore_validation'
  | 'chore_request'
  | 'member_joined'
  | 'system';

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  dlc_warning: 'Alerte Péremption',
  stock_alert: 'Stock Bas',
  visitor_message: 'Message Visiteur',
  visitor_ring: 'Sonnette',
  chore_validation: 'Validation Corvée',
  chore_request: 'Corvée à Valider',
  member_joined: 'Nouveau Membre',
  system: 'Système',
};

// ─── Content JSON Schemas (par type de QR) ────────────────────────────────

export interface WifiContent {
  ssid: string;
  password: string;
  security: 'WPA' | 'WPA2' | 'WPA3' | 'WEP' | 'OPEN';
  hiddenNetwork?: boolean;
}

export interface LinkContent {
  url: string;
  title: string;
  description?: string;
  favicon?: string;
}

export interface InfoContent {
  title: string;
  body: string;
  updatedAt?: string;
}

export interface PostitContent {
  message: string;
  color: 'yellow' | 'pink' | 'blue' | 'green' | 'purple';
}

export interface ShoppingItem {
  id: string;
  text: string;
  checked: boolean;
  addedBy?: string;
  fromStockAlert?: boolean; // V2: ajouté automatiquement par alerte stock
}

export interface ShoppingListContent {
  items: ShoppingItem[];
}

export interface DoormanInstruction {
  id: string;
  label: string;
  description?: string;
}

export interface DoormanContent {
  mode: 'present' | 'absent';
  predefinedInstructions: DoormanInstruction[];
  showMessageField: boolean;
  showRingButton: boolean;
  welcomeMessage?: string;
}

export interface MedicationEntry {
  id?: string;
  name: string;
  dosage: string;
  time?: string;
  taken?: boolean;
}

export interface MedicationContent {
  medications: MedicationEntry[];
  reminderMessage?: string;
}

export interface ChoreItem {
  id: string;
  title: string;
  points: number;
  assignedTo?: string;
  completed: boolean;
  completedAt?: string;
  completedBy?: string;
}

export interface ChoresContent {
  chores: ChoreItem[];
  rewardMessage?: string;
}

// V2: Nouveaux types de contenu

export interface GuestbookContent {
  title?: string;
  subtitle?: string;
  requireName: boolean;
}

export interface EnergyCounterContent {
  meterId?: string;
  provider?: string;
  currentReading?: number;
  unit?: string;
  notes?: string;
}

export interface KeysTrackerEntry {
  id: string;
  name: string;
  description?: string;
  lastLocation?: string;
  lastSeenAt?: string;
}

export interface KeysTrackerContent {
  items: KeysTrackerEntry[];
}

export interface DailyMenuEntry {
  id: string;
  meal: 'petit-dejeuner' | 'dejeuner' | 'gouter' | 'diner';
  dish: string;
  notes?: string;
}

export interface DailyMenuContent {
  date: string;
  meals: DailyMenuEntry[];
}

export type QrContentUnion =
  | WifiContent
  | LinkContent
  | InfoContent
  | PostitContent
  | ShoppingListContent
  | DoormanContent
  | MedicationContent
  | ChoresContent
  | GuestbookContent
  | EnergyCounterContent
  | KeysTrackerContent
  | DailyMenuContent;

// ─── API Response Types ───────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ─── RLS Helper Types (emulated at application layer) ─────────────────────

export interface MembershipContext {
  homeId: string;
  userId: string;
  role: HomeMemberRole;
}

// █████████████████████████████████████████████████████████████████████████████████
// ██  V3 — MODULE A : MON QUARTIER CONNECTÉ                               ██
// █████████████████████████████████████████████████████████████████████████████████

// ─── Merchant Categories ─────────────────────────────────────────────────

export type MerchantCategory =
  | 'boulangerie'
  | 'boucherie'
  | 'pharmacie'
  | 'epicerie'
  | 'fleuriste'
  | 'boulangerie_patisserie'
  | 'supermarche'
  | 'pressing'
  | 'librairie'
  | 'quincaillerie'
  | 'bar_cafe'
  | 'restaurant'
  | 'salon_coiffure'
  | 'autre';

export const MERCHANT_CATEGORY_LABELS: Record<MerchantCategory, string> = {
  boulangerie: 'Boulangerie',
  boucherie: 'Boucherie / Charcuterie',
  pharmacie: 'Pharmacie',
  epicerie: 'Épicerie',
  fleuriste: 'Fleuriste',
  boulangerie_patisserie: 'Boulangerie-Pâtisserie',
  supermarche: 'Supermarché',
  pressing: 'Pressing',
  librairie: 'Librairie',
  quincaillerie: 'Quincaillerie',
  bar_cafe: 'Bar / Café',
  restaurant: 'Restaurant',
  salon_coiffure: 'Salon de Coiffure',
  autre: 'Autre',
};

export const MERCHANT_CATEGORY_ICONS: Record<MerchantCategory, string> = {
  boulangerie: 'Croissant',
  boucherie: 'Beef',
  pharmacie: 'Pill',
  epicerie: 'ShoppingBasket',
  fleuriste: 'Flower2',
  boulangerie_patisserie: 'Cake',
  supermarche: 'ShoppingCart',
  pressing: 'Shirt',
  librairie: 'BookOpen',
  quincaillerie: 'Wrench',
  bar_cafe: 'Coffee',
  restaurant: 'UtensilsCrossed',
  salon_coiffure: 'Scissors',
  autre: 'Store',
};

// ─── Promo Types ─────────────────────────────────────────────────────────

export type PromoSource = 'local' | 'scraped';

export type ScrapingSource = 'carrefour' | 'auchan' | 'leclerc';

export const SCRAPING_SOURCE_LABELS: Record<ScrapingSource, string> = {
  carrefour: 'Carrefour',
  auchan: 'Auchan',
  leclerc: 'Leclerc',
};

// ─── Subscription Tiers ───────────────────────────────────────────────────

export type SubscriptionTier = 'free' | 'premium' | 'featured';

export const SUBSCRIPTION_TIER_LABELS: Record<SubscriptionTier, string> = {
  free: 'Gratuit',
  premium: 'Premium',
  featured: 'En Vedette',
};

export const SUBSCRIPTION_TIER_COLORS: Record<SubscriptionTier, string> = {
  free: 'bg-gray-100 text-gray-700',
  premium: 'bg-amber-100 text-amber-800',
  featured: 'bg-purple-100 text-purple-800',
};

// ─── Transaction Types ───────────────────────────────────────────────────

export type TransactionType = 'flash_sale' | 'commission' | 'subscription' | 'redemption';

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  flash_sale: 'Vente Flash',
  commission: 'Commission',
  subscription: 'Abonnement',
  redemption: 'Coupon',
};

export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export const TRANSACTION_STATUS_LABELS: Record<TransactionStatus, string> = {
  pending: 'En attente',
  completed: 'Complété',
  failed: 'Échoué',
  refunded: 'Remboursé',
};

// █████████████████████████████████████████████████████████████████████████████████
// ██  V3 — MODULE B : SERVICES À LA PERSONNE                               ██
// █████████████████████████████████████████████████████████████████████████████████

// ─── Professional Categories ─────────────────────────────────────────────

export type ProfessionalCategory =
  // Dépannage urgence
  | 'plumber'
  | 'electrician'
  | 'locksmith'
  | 'heating'
  // Entretien maison
  | 'cleaner'
  | 'gardener'
  | 'handyman'
  // Bien-être
  | 'hairdresser'
  | 'beautician'
  | 'masseur'
  // Assistance
  | 'tutor'
  | 'babysitter'
  | 'pet_sitter';

export const PROFESSIONAL_CATEGORY_GROUP: Record<ProfessionalCategory, { group: string; label: string; icon: string }> = {
  plumber:       { group: 'depannage',  label: 'Plombier',          icon: 'Droplets' },
  electrician:   { group: 'depannage',  label: 'Électricien',      icon: 'Zap' },
  locksmith:     { group: 'depannage',  label: 'Serrurier',        icon: 'KeyRound' },
  heating:       { group: 'depannage',  label: 'Chauffagiste',     icon: 'Flame' },
  cleaner:       { group: 'entretien',  label: 'Ménage',           icon: 'Sparkles' },
  gardener:      { group: 'entretien',  label: 'Jardinage',        icon: 'Flower2' },
  handyman:      { group: 'entretien',  label: 'Bricolage',        icon: 'Wrench' },
  hairdresser:   { group: 'bien_etre',  label: 'Coiffure',         icon: 'Scissors' },
  beautician:    { group: 'bien_etre',  label: 'Esthétique',       icon: 'Sparkles' },
  masseur:       { group: 'bien_etre',  label: 'Massage',          icon: 'Heart' },
  tutor:         { group: 'assistance', label: 'Soutien scolaire', icon: 'GraduationCap' },
  babysitter:    { group: 'assistance', label: 'Babysitting',      icon: 'Baby' },
  pet_sitter:    { group: 'assistance', label: 'Pet-sitting',      icon: 'PawPrint' },
};

export const PROFESSIONAL_GROUP_LABELS: Record<string, string> = {
  depannage: '🛠️ Dépannage Urgence',
  entretien: '🧼 Entretien Maison',
  bien_etre: '💅 Bien-être',
  assistance: '📚 Assistance',
};

// ─── Service Request Status ─────────────────────────────────────────────

export type ServiceRequestStatus =
  | 'pending'
  | 'accepted'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'disputed';

export const SERVICE_REQUEST_STATUS_LABELS: Record<ServiceRequestStatus, string> = {
  pending: 'En attente',
  accepted: 'Accepté',
  in_progress: 'En cours',
  completed: 'Terminé',
  cancelled: 'Annulé',
  disputed: 'Litige',
};

export const SERVICE_REQUEST_STATUS_COLORS: Record<ServiceRequestStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  accepted: 'bg-sky-100 text-sky-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-gray-100 text-gray-500',
  disputed: 'bg-red-100 text-red-800',
};

export type UrgencyLevel = 'normal' | 'urgent' | 'emergency';

export const URGENCY_LEVEL_LABELS: Record<UrgencyLevel, string> = {
  normal: 'Normal',
  urgent: 'Urgent',
  emergency: 'Urgence',
};

export const URGENCY_LEVEL_COLORS: Record<UrgencyLevel, string> = {
  normal: 'bg-slate-100 text-slate-700',
  urgent: 'bg-orange-100 text-orange-800',
  emergency: 'bg-red-100 text-red-800',
};

// ─── Emergency QR Categories ──────────────────────────────────────────────

export type EmergencyCategory = 'plumber' | 'electrician' | 'locksmith' | 'heating';

export const EMERGENCY_CATEGORY_LABELS: Record<EmergencyCategory, string> = {
  plumber: 'Plombier',
  electrician: 'Électricien',
  locksmith: 'Serrurier',
  heating: 'Chauffagiste',
};

// ─── Service Price Units ──────────────────────────────────────────────────

export type PriceUnit = 'hour' | 'flat_rate' | 'estimate';

export const PRICE_UNIT_LABELS: Record<PriceUnit, string> = {
  hour: 'De l\'heure',
  flat_rate: 'Forfait',
  estimate: 'Sur devis',
};

// ─── Scraping Job Status ──────────────────────────────────────────────────

export type ScrapingJobStatus = 'running' | 'success' | 'failed';

export const SCRAPING_JOB_STATUS_LABELS: Record<ScrapingJobStatus, string> = {
  running: 'En cours',
  success: 'Réussi',
  failed: 'Échoué',
};

// ─── V3 Activity & Notification Types ─────────────────────────────────────

// Ajout aux types existants pour V3
export type V3ActivityActionType =
  | 'promo_redeemed'
  | 'flash_sale_launched'
  | 'service_requested'
  | 'service_completed'
  | 'review_left'
  | 'merchant_registered'
  | 'professional_registered'
  | 'subscription_upgraded';

export type V3NotificationType =
  | 'promo_nearby'
  | 'flash_sale_alert'
  | 'service_accepted'
  | 'service_update'
  | 'review_requested'
  | 'subscription_expiring';

// ─── V3 Content JSON Schemas ─────────────────────────────────────────────

export interface EmergencyServiceContent {
  emergencyCategory: EmergencyCategory;
  equipmentInfo?: Record<string, string>;
}

export interface NeighborhoodContent {
  centerLatitude?: number;
  centerLongitude?: number;
  defaultRadiusKm?: number;
}

// ─── Subscription Plans ───────────────────────────────────────────────────

export type SubscriberType = 'merchant' | 'professional';
export type SubscriptionPlan = 'premium' | 'featured';

export interface SubscriptionPlanInfo {
  plan: SubscriptionPlan;
  subscriberType: SubscriberType;
  amount: number;
  currency: string;
  label: string;
  features: string[];
}

// ─── Commission Config ────────────────────────────────────────────────────

export interface CommissionConfig {
  type: 'flash_sale' | 'redemption' | 'service_match';
  label: string;
  minAmount: number;
  maxAmount: number;
  defaultAmount: number;
  description: string;
}
