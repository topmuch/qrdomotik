# QR Domotik — Worklog

---
Task ID: 1
Agent: Main Architect
Task: Étape 1 — Structure du projet et Schéma de Base de Données

Work Log:
- Analysé le projet existant (Next.js 16, Prisma, shadcn/ui)
- Installé la librairie `qrcode` + `@types/qrcode`
- Créé le schéma Prisma complet avec 9 tables et toutes les relations
- Poussé le schéma en base SQLite (db:push)
- Créé la structure de dossiers du projet (api/, components/, types/, store/, lib/)
- Créé les types TypeScript (src/types/index.ts) avec tous les types de QR, contenus JSON, rôles, etc.
- Créé l'utilitaire de génération de slugs (src/lib/slug.ts)
- Créé les constantes de l'application (src/lib/constants.ts)
- Généré les images de branding (logo + hero banner)
- Construit la landing page architecturale avec 3 onglets (Modules QR, Schéma BDD, Structure)
- Mis à jour le layout avec le branding QR Domotik
- Vérifié le lint (0 erreurs)
- Vérifié visuellement avec Agent Browser (3 onglets fonctionnels, footer sticky, aucun bug)

Stage Summary:
- Schéma Prisma : 9 tables (users, homes, home_members, rooms, qr_codes, qr_contents, activity_logs, products, product_instances)
- Types TypeScript : QrType (9 types), HomeMemberRole, ProductCategory, ProductStatus, interfaces de contenu JSON
- Landing page : Hero branding, 9 modules QR avec exemples JSON, diagramme de relations, structure projet
- Prochaine étape : Étape 2 — Authentification + Dashboard Home/Room

---
Task ID: 2
Agent: Main Architect
Task: Étape 2 — Authentification et Dashboard propriétaire (Home & Room)

Work Log:
- Installé bcryptjs + @types/bcryptjs
- Configuré NextAuth.js v4 (CredentialsProvider, JWT strategy, callbacks)
- Créé /api/auth/[...nextauth]/route.ts (handler GET+POST)
- Créé /api/auth/register/route.ts (inscription avec validation Zod, hash bcrypt, création maison par défaut)
- Créé /api/homes/route.ts (GET liste, POST création)
- Créé /api/homes/[id]/route.ts (GET détail, PATCH mise à jour, DELETE suppression)
- Créé /api/rooms/route.ts (GET liste par homeId, POST création)
- Créé /api/rooms/[id]/route.ts (GET, PATCH, DELETE avec vérification rôle)
- Créé src/store/home-store.ts (Zustand : homes, selectedHome, rooms, refresh)
- Créé src/components/providers.tsx (SessionProvider wrapper)
- Construit la page principale avec 2 états : AuthForm (login/register) et Dashboard
- Dashboard : sidebar homes responsive, grille de pièces avec icônes, CRUD complet
- Sélecteur d'icônes de pièces (13 icônes Lucide)
- Corrigé le bug de mise à jour du compteur sidebar après CRUD rooms
- Vérifié le flow complet : Inscription → Dashboard → Création maison → Ajout de pièces
- Vérifié lint (0 erreurs), dev logs (aucune erreur runtime)

Stage Summary:
- Auth : NextAuth CredentialsProvider + JWT, bcrypt hash, auto-login après inscription
- API Routes : 7 endpoints REST (auth/register, homes CRUD, rooms CRUD)
- UI : Login/Register animé (Framer Motion), Dashboard responsive avec sidebar
- Sécurité : Vérification membership sur chaque endpoint (RLS applicatif)
- Prochaine étape : Étape 3 — Moteur de création QR Code

---
Task ID: 3
Agent: Main Architect
Task: Étape 3 — Moteur de création QR Code (formulaire type + slug + PNG)

Work Log:
- Créé /api/qr-codes/route.ts (GET liste filtrée par homeId/roomId, POST création avec slug auto)
- Créé /api/qr-codes/[id]/route.ts (GET, PATCH toggle/content, DELETE avec vérification rôle)
- Créé /api/qr-codes/generate/route.ts (génération PNG via lib qrcode, encodage URL publique)
- Mis à jour src/store/home-store.ts (ajout qrCodes, selectedRoomId, refreshQrCodes)
- Construit QrTypeSelector — grille visuelle des 9 types avec icônes et descriptions
- Construit le dialog de création QR : nom, type, pièce, PIN optionnel
- Construit la grille de QR codes dans le dashboard avec badges couleur par type
- Construit le dialog de preview : QR code rendu, slug copiable, boutons Télécharger PNG + Copier lien
- Ajouté le toggle Actif/Désactivé sur chaque carte QR
- Remplacé le composant Select par un select natif (correction crash Radix UI)
- Vérifié le flow : Nouveau QR → Remplir formulaire → Création → Preview auto → Téléchargement
- Vérifié l'endpoint PNG (HTTP 200, Content-Type: image/png, 2.8 KB)
- Lint 0 erreurs

Stage Summary:
- 3 endpoints API QR codes (GET list, POST create, GET/PATCH/DELETE by id)
- 1 endpoint génération PNG (/api/qr-codes/generate?slug=xxx&size=400)
- Slug unique auto-généré (6 chars, crypto-secure)
- Contenu JSON par défaut initialisé pour chaque type de module
- Preview QR avec téléchargement PNG (600px) et copie du lien public
- Toggle actif/désactivé pour chaque QR code
- Filtrage par pièce dans le sidebar
- Prochaine étape : Étape 4 — Pages publiques dynamiques (/r/[slug])

---
Task ID: 4-3
Agent: Main Architect
Task: Étape 4 — PIN verify API, PinGate fix, InactiveQr, Public page /r/[slug]

Work Log:
- Créé /api/r/[slug]/verify/route.ts (POST : vérifie PIN 4 chiffres, renvoie contentJson si correct, log pin_verified)
- Corrigé bug Prisma : db.activityLog.create() nécessite le wrapper { data: {...} } (fix dans verify + log routes)
- Réécrit PinGate.tsx : import Button correct, auto-submit après 4 chiffres, appel API verify, gestion erreur/chargement
- Créé InactiveQr.tsx : page « QR Code désactivé » avec nom et maison
- Créé /r/[slug]/page.tsx : page publique complète avec 5 états (loading, 404, inactive, PIN gate, contenu débloqué)
- ModuleRouter : routing dynamique des 9 modules par type de QR
- Header avec branding QR Domotik, badge type, info maison/pièce
- Footer sticky « Propulsé par QR Domotik » avec adresse
- Injection isPresentMode pour module Portier
- Vérifié Agent Browser : page Wifi publique OK, PIN gate + déverrouillage OK, QR inactive OK, 404 OK
- Dashboard intact après modifications
- Lint 0 erreurs

Stage Summary:
- 4 endpoints API publics : GET /api/r/[slug], POST /api/r/[slug]/log, POST /api/r/[slug]/verify
- Page publique /r/[slug] complète avec 5 états (loading, erreur, inactif, PIN, contenu)
- 9 modules rendus dynamiquement selon le type du QR
- Flux PIN : gate → verify API → déverrouillage → module affiché
- Prochaine étape : Étape 5 — Portier Virtuel (présent/absent) + Alertes DLC + finalisation

---
Task ID: 5
Agent: Main Architect
Task: Étape 5 — Portier Virtuel, Contenu dynamique, Stock & DLC, Journal d'activité

Work Log:
- Créé /api/products/route.ts (GET liste par homeId, POST création produit)
- Créé /api/products/[id]/route.ts (GET détail+instances, PATCH produit+instances, DELETE)
  - Actions d'instance : add_instance, update_instance, delete_instance, consume_instance
  - Mise à jour automatique du currentStock après chaque action
- Créé /api/activity-logs/route.ts (GET avec filtres homeId/qrCodeId, labels traduits)
- Créé src/components/dashboard/ContentEditor.tsx
  - 9 éditeurs typés : Wifi, Link, Info, Postit, ShoppingList, Doorman, Medication, Chores, StockDlc
  - WifiEditor : SSID, password, sécurité (WPA/WPA2/WPA3/WEP/OPEN)
  - LinkEditor : titre, URL, description
  - InfoEditor : titre, corps de texte
  - PostitEditor : message + sélecteur couleur (5 couleurs)
  - ShoppingListEditor : ajout/suppression d'articles dynamiques
  - DoormanEditor : message accueil, instructions prédéfinies, toggles message/sonnette
  - MedicationEditor : liste médicaments (nom/dosage/heure), message rappel
  - ChoresEditor : liste tâches avec points, message récompense
  - StockDlcEditor : redirection vers panneau Stock
  - StockDlcPanel : CRUD produits, ajout instances avec date péremption, badges couleur DLC
  - Détection automatique DLC : J+3 orange, J+1 rouge, J+0 expiré
- Créé src/components/dashboard/ActivityLogs.tsx
  - Journal temps réel avec traduction des types d'actions (emoji + label)
  - Filtrage par QR code, refresh manuel, timestamps relatifs
- Intégré dans Dashboard (page.tsx) :
  - Bouton ⚙️ "Modifier le contenu" sur chaque carte QR → Dialog ContentEditor
  - Bouton toggle Présent/Absent sur cartes Portier (ToggleRight/ToggleLeft)
  - Badge "Présent"/"Absent" vert/orange sur cartes Portier
  - Boutons "Activité" et "Stock & DLC" en bas du dashboard
  - Panel ActivityLogs (journal d'activité)
  - Panel StockDlcPanel (gestion stock avec catégories, dates, alertes DLC)
- Mis à jour footer : "Plateforme complète" + badges (9 modules, Contenu dynamique, Stock & DLC, Journal)
- Nettoyé labels de version (Étape 3 → Dashboard, textes de footer)
- Vérifié Agent Browser :
  - Dashboard : 2 QR cards avec tous les boutons (settings, doorman toggle, power, preview, delete)
  - Portier public page : badge "Présent", instructions, boutons message/sonner
  - Stock panel : titre, catégories, formulaire ajout, état vide
  - Activity panel : journal avec état vide
  - Footer sticky mis à jour
- Lint 0 erreurs

Stage Summary:
- 3 endpoints API produits (GET, POST, PATCH/DELETE par id)
- 1 endpoint API activity-logs (GET avec filtres)
- ContentEditor : 9 éditeurs de contenu typés dans un dialog
- StockDlcPanel : CRUD produits + instances + alertes DLC (couleurs par date)
- ActivityLogs : journal d'activité avec labels traduits
- Toggle Présent/Absent sur Portier Virtuel
- Plateforme QR Domotik COMPLETE — 5 étapes terminées
