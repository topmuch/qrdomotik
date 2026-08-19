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
  | 'daily_menu';

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
    types: ['doorman'],
  },
  famille: {
    label: 'Famille',
    types: ['chores', 'stock_dlc', 'energy_counter'],
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
