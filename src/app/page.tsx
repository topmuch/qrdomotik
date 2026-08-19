'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Wifi,
  ExternalLink,
  BookOpen,
  StickyNote,
  ShoppingCart,
  DoorOpen,
  Pill,
  Star,
  Package,
  Database,
  FolderTree,
  Layers,
  ArrowRight,
  CheckCircle2,
  Shield,
  Zap,
  Users,
  Home,
  QrCode,
  Table2,
  FileJson,
  Clock,
  Lock,
  Globe,
} from 'lucide-react';

// ─── Data ──────────────────────────────────────────────────────────────

const QR_MODULES = [
  {
    type: 'wifi',
    label: 'Wi-Fi',
    icon: Wifi,
    description: 'Partagez vos identifiants sans les dicter',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dotColor: 'bg-emerald-500',
    jsonExample: '{ "ssid": "MonWiFi", "password": "••••••••", "security": "WPA2" }',
  },
  {
    type: 'link',
    label: 'Lien Externe',
    icon: ExternalLink,
    description: 'Playlist Spotify, manuel PDF, site web...',
    color: 'bg-violet-50 text-violet-700 border-violet-200',
    dotColor: 'bg-violet-500',
    jsonExample: '{ "url": "https://...", "title": "Playlist Cuisine" }',
  },
  {
    type: 'info',
    label: 'Guide Maison',
    icon: BookOpen,
    description: 'Considnes, astuces, mode d\'emploi',
    color: 'bg-sky-50 text-sky-700 border-sky-200',
    dotColor: 'bg-sky-500',
    jsonExample: '{ "title": "Bienvenue", "body": "# Guide de la maison..." }',
  },
  {
    type: 'postit',
    label: 'Post-it Numérique',
    icon: StickyNote,
    description: 'Message court modifiable en temps réel',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    dotColor: 'bg-amber-500',
    jsonExample: '{ "message": "N\'oublie pas de...", "color": "yellow" }',
  },
  {
    type: 'shopping_list',
    label: 'Liste de Courses',
    icon: ShoppingCart,
    description: 'Liste collaborative avec cases à cocher',
    color: 'bg-rose-50 text-rose-700 border-rose-200',
    dotColor: 'bg-rose-500',
    jsonExample: '{ "items": [{ "text": "Lait", "checked": false }] }',
  },
  {
    type: 'doorman',
    label: 'Portier Virtuel',
    icon: DoorOpen,
    description: 'Gestion des livraisons à distance',
    color: 'bg-orange-50 text-orange-700 border-orange-200',
    dotColor: 'bg-orange-500',
    jsonExample: '{ "predefinedInstructions": [...], "showRingButton": true }',
    featured: true,
  },
  {
    type: 'medication',
    label: 'Médicaments',
    icon: Pill,
    description: 'Suivi quotidien de prise',
    color: 'bg-teal-50 text-teal-700 border-teal-200',
    dotColor: 'bg-teal-500',
    jsonExample: '{ "medications": [{ "name": "Vitamine D", "dosage": "1 comprimé" }] }',
  },
  {
    type: 'chores',
    label: 'Corvées Enfants',
    icon: Star,
    description: 'Tâches gamifiées avec points',
    color: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
    dotColor: 'bg-fuchsia-500',
    jsonExample: '{ "chores": [{ "title": "Ranger", "points": 10 }] }',
  },
  {
    type: 'stock_dlc',
    label: 'Stock & DLC',
    icon: Package,
    description: 'Alertes de péremption automatiques',
    color: 'bg-lime-50 text-lime-700 border-lime-200',
    dotColor: 'bg-lime-600',
    jsonExample: '{ "tracked": true, "alertDays": 3 }',
  },
] as const;

const TABLES = [
  {
    name: 'users',
    label: 'Utilisateurs',
    icon: Users,
    fields: ['id', 'email', 'password_hash', 'full_name', 'avatar_url', 'created_at'],
    color: 'border-slate-300',
    headerColor: 'bg-slate-100',
  },
  {
    name: 'homes',
    label: 'Maisons',
    icon: Home,
    fields: ['id', 'owner_id → users', 'name', 'address', 'timezone', 'created_at'],
    color: 'border-emerald-300',
    headerColor: 'bg-emerald-50',
  },
  {
    name: 'home_members',
    label: 'Membres',
    icon: Users,
    fields: ['id', 'home_id → homes', 'user_id → users', 'role (enum)', 'created_at'],
    color: 'border-sky-300',
    headerColor: 'bg-sky-50',
  },
  {
    name: 'rooms',
    label: 'Pièces',
    icon: DoorOpen,
    fields: ['id', 'home_id → homes', 'name', 'icon', 'sort_order', 'created_at'],
    color: 'border-violet-300',
    headerColor: 'bg-violet-50',
  },
  {
    name: 'qr_codes',
    label: 'QR Codes',
    icon: QrCode,
    fields: ['id', 'home_id → homes', 'room_id → rooms', 'name', 'type (enum)', 'public_slug (unique)', 'is_active', 'pin_code', 'is_present_mode'],
    color: 'border-amber-300',
    headerColor: 'bg-amber-50',
  },
  {
    name: 'qr_contents',
    label: 'Contenus QR',
    icon: FileJson,
    fields: ['id', 'qr_code_id → qr_codes (1:1)', 'content_json', 'updated_at'],
    color: 'border-rose-300',
    headerColor: 'bg-rose-50',
  },
  {
    name: 'activity_logs',
    label: 'Journal',
    icon: Clock,
    fields: ['id', 'home_id → homes', 'qr_code_id → qr_codes', 'user_id (nullable)', 'action_type', 'details_json', 'visitor_name', 'created_at'],
    color: 'border-orange-300',
    headerColor: 'bg-orange-50',
  },
  {
    name: 'products',
    label: 'Produits',
    icon: Package,
    fields: ['id', 'home_id → homes', 'name', 'category (enum)', 'min_stock_threshold', 'current_stock'],
    color: 'border-lime-300',
    headerColor: 'bg-lime-50',
  },
  {
    name: 'product_instances',
    label: 'Instances Produits',
    icon: Table2,
    fields: ['id', 'product_id → products', 'purchase_date', 'expiry_date', 'status (enum: fresh/warning/critical/expired/consumed)'],
    color: 'border-teal-300',
    headerColor: 'bg-teal-50',
  },
];

const PROJECT_STRUCTURE = [
  { path: 'src/app/', label: 'Pages & Routes', icon: Globe, items: ['page.tsx (Landing)', 'layout.tsx (Root)', 'api/auth/ (NextAuth)', 'api/homes/', 'api/rooms/', 'api/qr-codes/', 'api/r/[slug]/ (Public QR)'] },
  { path: 'src/components/', label: 'Composants', icon: Layers, items: ['ui/ (shadcn/ui)', 'dashboard/', 'qr/', 'modules/'] },
  { path: 'src/lib/', label: 'Utilitaires', icon: FileJson, items: ['db.ts (Prisma)', 'utils.ts', 'auth.ts', 'slug.ts', 'constants.ts'] },
  { path: 'src/types/', label: 'Types', icon: FileJson, items: ['index.ts (Types QR, Contenus JSON)'] },
  { path: 'src/store/', label: 'État', icon: Database, items: ['home-store.ts (Zustand)'] },
  { path: 'prisma/', label: 'Base de données', icon: Database, items: ['schema.prisma (9 tables)'] },
];

// ─── Animation variants ────────────────────────────────────────────────

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

// ─── Component ─────────────────────────────────────────────────────────

export default function ArchitecturePage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* ─── Hero ─── */}
      <header className="relative overflow-hidden border-b border-slate-200">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-emerald-400 blur-3xl" />
          <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-amber-400 blur-3xl" />
        </div>
        <div className="relative container mx-auto px-4 py-12 md:py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col md:flex-row items-center gap-8"
          >
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-emerald-300 text-sm font-medium mb-4">
                <QrCode className="w-4 h-4" />
                Étape 1 — Architecture & Schéma
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight">
                QR <span className="text-emerald-400">Domotik</span>
              </h1>
              <p className="mt-4 text-lg md:text-xl text-slate-300 max-w-2xl leading-relaxed">
                Plateforme SaaS de maison <span className="text-white font-semibold">phygitale</span> —
                Transformez chaque pièce avec des QR codes dynamiques.
                Modifiez le contenu à distance, sans réimprimer.
              </p>
              <div className="mt-6 flex flex-wrap gap-3 justify-center md:justify-start">
                <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Schéma DB validé
                </Badge>
                <Badge variant="secondary" className="bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30">
                  <Database className="w-3.5 h-3.5 mr-1" /> 9 tables Prisma
                </Badge>
                <Badge variant="secondary" className="bg-sky-500/20 text-sky-300 border-sky-500/30 hover:bg-sky-500/30">
                  <Layers className="w-3.5 h-3.5 mr-1" /> 9 modules QR
                </Badge>
              </div>
            </div>
            <div className="flex-shrink-0">
              <div className="relative w-48 h-48 md:w-64 md:h-64">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 opacity-20 blur-xl" />
                <Image
                  src="/qr-domotik-logo.png"
                  alt="QR Domotik Logo"
                  width={256}
                  height={256}
                  className="relative rounded-2xl drop-shadow-2xl"
                  priority
                />
              </div>
            </div>
          </motion.div>
        </div>
      </header>

      {/* ─── Main Content ─── */}
      <main className="flex-1 container mx-auto px-4 py-10">
        <Tabs defaultValue="modules" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="modules" className="gap-2">
              <Layers className="w-4 h-4" />
              <span className="hidden sm:inline">Modules QR</span>
              <span className="sm:hidden">Modules</span>
            </TabsTrigger>
            <TabsTrigger value="schema" className="gap-2">
              <Database className="w-4 h-4" />
              <span className="hidden sm:inline">Schéma BDD</span>
              <span className="sm:hidden">BDD</span>
            </TabsTrigger>
            <TabsTrigger value="structure" className="gap-2">
              <FolderTree className="w-4 h-4" />
              <span className="hidden sm:inline">Structure</span>
              <span className="sm:hidden">Dossiers</span>
            </TabsTrigger>
          </TabsList>

          {/* ═══ TAB 1: QR Modules ═══ */}
          <TabsContent value="modules">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {QR_MODULES.map((mod) => (
                <motion.div key={mod.type} variants={fadeInUp}>
                  <Card className={`h-full border ${mod.color.split(' ').slice(2).join(' ')} hover:shadow-lg transition-all duration-200 relative overflow-hidden`}>
                    {mod.featured && (
                      <div className="absolute top-0 right-0 bg-gradient-to-l from-orange-500 to-orange-400 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                        KILLER FEATURE
                      </div>
                    )}
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-lg ${mod.color.split(' ').slice(0, 2).join(' ')}`}>
                          <mod.icon className="w-5 h-5" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{mod.label}</CardTitle>
                          <CardDescription className="text-xs mt-0.5">{mod.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-lg bg-slate-900 p-3 font-mono text-xs text-emerald-400 leading-relaxed overflow-x-auto">
                        {mod.jsonExample}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>

            {/* ─── Dynamic Engine Explanation ─── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-8"
            >
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-500" />
                    Moteur Dynamique — Comment ça marche
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-center gap-4 text-sm">
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-lg font-mono">
                      <span className="text-slate-500">Propriétaire modifie</span>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                      <span className="font-semibold text-emerald-600">content_json</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 hidden sm:block" />
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-lg font-mono">
                      <span className="text-slate-500">URL reste</span>
                      <span className="font-semibold">/r/</span>
                      <span className="font-mono text-amber-600">x8k2p9</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 hidden sm:block" />
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-700 font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      Contenu changé instantanément
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Le QR code pointe toujours vers la même URL. Le contenu est lu dynamiquement depuis
                    <code className="mx-1 px-1.5 py-0.5 bg-slate-100 rounded text-xs">qr_contents.content_json</code>.
                    Aucune réimpression nécessaire.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* ═══ TAB 2: Database Schema ═══ */}
          <TabsContent value="schema">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="space-y-4"
            >
              {/* ─── Relations Summary ─── */}
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Database className="w-5 h-5 text-slate-600" />
                    Diagramme des Relations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-slate-950 rounded-xl p-4 md:p-6 overflow-x-auto font-mono text-xs md:text-sm leading-relaxed">
                    <pre className="text-slate-300">
{`┌──────────┐     1:N     ┌──────────────┐     1:N     ┌──────────┐
│  users   │────────────▶│    homes     │────────────▶│  rooms   │
│          │             │              │             │          │
│ • id     │       1:N   │ • id         │       1:N   │ • id     │
│ • email  │◀────────────│ • owner_id   │◀────────────│ • home_id│
│ • name   │             │ • name       │             │ • name   │
└──────────┘             └──────┬───────┘             └────┬─────┘
     │                          │                          │
     │ 1:N                      │ 1:N                      │ 1:N
     ▼                          ▼                          ▼
┌──────────────┐     ┌──────────┐     ┌──────────┐   ┌──────────┐
│ home_members │     │ qr_codes │     │ products │   │ qr_codes │
│              │     │          │     │          │   │ (via     │
│ • role       │     │ • slug   │     │ • stock  │   │  room_id)│
│ (enum)       │     │ • type   │     │ • thresh.│   │          │
└──────────────┘     │ • active │     └────┬─────┘   └──────────┘
                     └────┬─────┘          │ 1:N            │
                     1:1  │               ▼                │ 1:1
                     ┌────┴─────────┐ ┌────────────────┐   │
                     │ qr_contents  │ │product_instances│   │
                     │              │ │                │   │
                     │ • content_   │ │ • expiry_date  │   │
                     │   json       │ │ • status (enum)│   │
                     └──────────────┘ └────────────────┘   │
                                                               │
                          ┌──────────────┐                    │
                          │activity_logs  │◀───────────────────┘
                          │              │  (via qr_code_id)
                          │ • action_type│
                          │ • visitor    │
                          │ • details    │
                          └──────────────┘`}
                    </pre>
                  </div>
                </CardContent>
              </Card>

              {/* ─── Tables Detail ─── */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {TABLES.map((table, index) => (
                  <motion.div
                    key={table.name}
                    variants={fadeInUp}
                    custom={index}
                  >
                    <Card className={`h-full border ${table.color}`}>
                      <CardHeader className={`pb-2 ${table.headerColor} rounded-t-lg`}>
                        <CardTitle className="flex items-center gap-2 text-sm">
                          <table.icon className="w-4 h-4" />
                          <span className="font-mono font-bold">{table.name}</span>
                          <Badge variant="outline" className="ml-auto text-xs">
                            {table.fields.length} colonnes
                          </Badge>
                        </CardTitle>
                        <CardDescription className="text-xs">{table.label}</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-3">
                        <div className="space-y-1.5">
                          {table.fields.map((field, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-2 text-xs font-mono text-slate-600"
                            >
                              <div className={`w-1.5 h-1.5 rounded-full ${
                                field.includes('→') ? 'bg-amber-400' :
                                field.includes('id ') && !field.includes('→') ? 'bg-emerald-400' :
                                field.includes('(enum)') ? 'bg-violet-400' :
                                'bg-slate-300'
                              }`} />
                              <span>{field}</span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 pt-2 border-t border-slate-100 flex gap-3 text-[10px] text-slate-400">
                          <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> PK</span>
                          <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-amber-400" /> FK</span>
                          <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-violet-400" /> Enum</span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* ─── Security Notes ─── */}
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Shield className="w-5 h-5 text-emerald-600" />
                    Règles de Sécurité
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex gap-3 p-3 rounded-lg bg-slate-50">
                      <Lock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">PIN Optionnel</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Chaque QR code peut être protégé par un code PIN à 4 chiffres (ex: Portier Virtuel).
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3 p-3 rounded-lg bg-slate-50">
                      <Shield className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">RLS Applicatif</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Un utilisateur ne voit/modifie que les données de ses <code className="text-xs bg-slate-200 px-1 rounded">homes</code>.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3 p-3 rounded-lg bg-slate-50">
                      <Globe className="w-5 h-5 text-sky-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Pages Publiques</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          <code className="text-xs bg-slate-200 px-1 rounded">/r/{'{slug}'}</code> charge en {'<'}1s, QR inactif affiche un message clair.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* ═══ TAB 3: Project Structure ═══ */}
          <TabsContent value="structure">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="space-y-4"
            >
              {PROJECT_STRUCTURE.map((section, index) => (
                <motion.div key={section.path} variants={fadeInUp}>
                  <Card className="border-slate-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <section.icon className="w-4 h-4 text-slate-500" />
                        <code className="font-mono font-bold text-emerald-700">{section.path}</code>
                        <Badge variant="secondary" className="ml-auto text-xs">
                          {section.label}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {section.items.map((item, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 px-3 py-2 rounded-md bg-slate-50 text-xs font-mono text-slate-600 hover:bg-slate-100 transition-colors"
                          >
                            <div className="w-1 h-1 rounded-full bg-emerald-400" />
                            {item}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}

              {/* ─── Tech Stack ─── */}
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg">Stack Technique</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {[
                      'Next.js 16', 'TypeScript', 'Tailwind CSS 4', 'shadcn/ui',
                      'Prisma ORM', 'SQLite', 'NextAuth.js v4', 'Zustand',
                      'TanStack Query', 'Framer Motion', 'qrcode (Node.js)', 'Lucide Icons',
                    ].map((tech) => (
                      <Badge key={tech} variant="outline" className="text-xs">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </main>

      {/* ─── Footer ─── */}
      <footer className="border-t border-slate-200 bg-white mt-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <QrCode className="w-4 h-4" />
              <span className="font-semibold text-foreground">QR Domotik</span>
              <span>— Étape 1 terminée</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Schéma Prisma (9 tables)
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Types TypeScript
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Structure projet
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
