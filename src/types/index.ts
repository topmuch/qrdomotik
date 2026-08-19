// ═══════════════════════════════════════════════════════════════════════════════
// QR DOMOTIK — Types TypeScript partagés
// ═══════════════════════════════════════════════════════════════════════════════

// ─── QR Code Types ─────────────────────────────────────────────────────────

export type QrType =
  | 'wifi'
  | 'link'
  | 'info'
  | 'postit'
  | 'shopping_list'
  | 'doorman'
  | 'medication'
  | 'chores'
  | 'stock_dlc';

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
};

export const QR_TYPE_DESCRIPTIONS: Record<QrType, string> = {
  wifi: 'Partagez vos identifiants Wi-Fi sans les dicter',
  link: 'Redirigez vers une playlist, un manuel PDF, un site...',
  info: `Guide d2019utilisation de la maison, consignes, astuces`,
  postit: 'Message court modifiable en temps réel',
  shopping_list: 'Liste collaborative avec cases à cocher',
  doorman: 'Gérez les livraisons et visites à distance',
  medication: 'Suivi quotidien de prise de médicaments',
  chores: 'Tâches gamifiées avec système de points',
  stock_dlc: 'Suivi des stocks et alertes de péremption',
};

// ─── Home Member Roles ────────────────────────────────────────────────────

export type HomeMemberRole = 'owner' | 'admin' | 'member' | 'child';

export const MEMBER_ROLE_LABELS: Record<HomeMemberRole, string> = {
  owner: 'Propriétaire',
  admin: 'Administrateur',
  member: 'Membre',
  child: 'Enfant',
};

// ─── Product Categories ───────────────────────────────────────────────────

export type ProductCategory =
  | 'laitier'
  | 'viande'
  | 'epicerie'
  | 'boisson'
  | 'fruit'
  | 'conserve'
  | 'autre';

export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  laitier: 'Produits laitiers',
  viande: 'Viandes & Poissons',
  epicerie: 'Épicerie',
  boisson: 'Boissons',
  fruit: 'Fruits & Légumes',
  conserve: 'Conserves',
  autre: 'Autre',
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

// ─── Activity Log Action Types ────────────────────────────────────────────

export type ActivityActionType =
  | 'ring'
  | 'message_left'
  | 'instruction_used'
  | 'wifi_connected'
  | 'medication_taken'
  | 'chore_completed'
  | 'item_checked'
  | 'item_added'
  | 'item_removed'
  | 'product_scanned'
  | 'product_consumed';

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
  body: string; // Markdown ou HTML
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
}

export interface ShoppingListContent {
  items: ShoppingItem[];
}

export interface DoormanInstruction {
  id: string;
  label: string; // ex: "Laisser chez le gardien"
  description?: string;
}

export interface DoormanContent {
  predefinedInstructions: DoormanInstruction[];
  showMessageField: boolean;
  showRingButton: boolean;
  welcomeMessage?: string;
}

export interface MedicationEntry {
  name: string;
  dosage: string;
  time?: string; // ex: "08:00"
}

export interface MedicationContent {
  medications: MedicationEntry[];
  reminderMessage?: string;
}

export interface ChoreItem {
  id: string;
  title: string;
  points: number;
  assignedTo?: string; // userId de l'enfant
  completed: boolean;
  completedAt?: string;
  completedBy?: string;
}

export interface ChoresContent {
  chores: ChoreItem[];
  rewardMessage?: string;
}

export type QrContentUnion =
  | WifiContent
  | LinkContent
  | InfoContent
  | PostitContent
  | ShoppingListContent
  | DoormanContent
  | MedicationContent
  | ChoresContent;

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