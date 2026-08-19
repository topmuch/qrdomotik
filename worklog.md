---
Task ID: 1
Agent: Main Orchestrator
Task: Étape 1 — Structure projet V2 + Schéma DB complet

Work Log:
- Analysé le schéma V1 existant (9 tables, 9 QR types)
- Conçu le schéma V2 complet (15 tables, 13 QR types)
- Mis à jour prisma/schema.prisma avec toutes les tables V1+V2
- Tables V1 enrichies : HomeMember (nickname, points, invitedAt, joinedAt, updatedAt), QrCode (isPrivate), Product (isOnShoppingList), ProductInstance (homeId), User (avatarColor, assignedChores relation)
- Tables V2 nouvelles : Chore, ChoreCompletion, Invitation, GuestbookEntry, PushSubscription, Notification
- Poussé le schéma en DB avec db:push --force-reset
- Généré le client Prisma
- Mis à jour src/types/index.ts avec tous les types V2 (QrType étendu, permissions par rôle, types de contenu V2, enums enrichis)
- Mis à jour src/lib/constants.ts avec constantes V2 (seuils, limites, cooldowns, rate limiting, avatar colors)
- Mis à jour src/store/home-store.ts avec état V2 (membres, notifications, permissions, refreshAll)
- ESLint passe sans erreur
- Dev server compile et sert la page (22KB HTML, titre correct)

Stage Summary:
- 15 tables Prisma (9 V1 + 6 V2)
- 13 types de QR codes (9 V1 + 4 V2: guestbook, energy_counter, keys_tracker, daily_menu)
- Système de permissions par rôle (owner/admin/member/child) avec matrice fine
- Types TypeScript complets pour toutes les entités V2
- Store Zustand enrichi avec gestion membres, notifications, permissions
- Base de données synchronisée et Prisma client régénéré
---
Task ID: 2b
Agent: API Invitations Agent
Task: Création de l'API Invitations pour le système multi-utilisateurs

Work Log:
- Lu le worklog, permissions.ts, constants.ts, schema.prisma, types/index.ts et routes existantes pour comprendre les patterns du projet
- Créé /api/invitations/route.ts (GET + POST)
  - GET: liste les invitations pending d'une maison (query param homeId), requiert canInviteMembers, retourne les invitations avec nom de l'inviteur
  - POST: crée une invitation, validation Zod v4 (email, role enum, nickname optionnel), vérifie canInviteMembers + INVITABLE_ROLES, vérifie email pas déjà membre, vérifie pas d'invitation pending en doublon, vérifie limite MAX_MEMBERS_PER_HOME, génère token via generateInvitationToken(), expireAt = now + INVITATION_EXPIRY_DAYS, crée ActivityLog 'member_invited'
- Créé /api/invitations/[token]/route.ts (GET + POST)
  - GET: public (pas d'auth), retourne homeName/inviterName/role/nickname/email, vérifie token existe + pas expiré/révoqué/accepté, auto-marque les invitations expirées
  - POST: auth requise, vérifie email utilisateur correspond à invitation, vérifie pas déjà membre, crée HomeMember avec joinedAt, met à jour invitation status='accepted', crée ActivityLog 'member_joined', retourne les infos du membership
- Utilisé Zod v4 (import z from 'zod/v4'), patterns Next.js 16 (params: Promise), format réponse standard { success, data, error, message }

Stage Summary:
- 2 fichiers API créés : /api/invitations/route.ts et /api/invitations/[token]/route.ts
- 4 endpoints : GET list, POST create, GET details (public), POST accept
- Sécurité complète : permission checks, INVITABLE_ROLES validation, doublon email/membre, limite membres, auto-expiration
- Activity logs pour 'member_invited' et 'member_joined'
---
Task ID: 2c+2d
Agent: API Members + Notifications Agent
Task: Creation de l API Membres et de l API Notifications

Work Log:
- Lu le worklog, permissions.ts, schema.prisma, types/index.ts et routes existantes
- Cree /api/members/route.ts (GET + PATCH + DELETE)
  - GET: liste les membres d une maison (query homeId), auth + membership, retourne membres avec user info + points, tri owner > role > joinedAt
  - PATCH: modifie role/nickname, canManageMembers (owner), bloque auto-modif role et dernier owner, ActivityLog member_role_changed
  - DELETE: retire membre, canManageMembers (owner), bloque retrait de soi-meme et dernier owner, cascade delete
- Cree /api/notifications/route.ts (GET + PATCH)
  - GET: liste notifications utilisateur, unreadOnly filter, homeName inclus, 50 max, retourne unreadCount
  - PATCH: marque comme lues, 3 modes (id unique / ids lot / all non lues), retourne markedCount

Stage Summary:
- 2 fichiers API : /api/members/route.ts et /api/notifications/route.ts
- 5 endpoints total
- Securite : canManageMembers, userId filter sur notifications
- Validations : auto-modif role bloquee, dernier owner protege, retrait soi-meme bloque
- Activity log pour member_role_changed
---
---
Task ID: 2e
Agent: Dashboard UI Agent
Task: Création du panneau Membres, du dialogue d'invitation et de la cloche de notifications

Work Log:
- Lu le worklog, page.tsx, home-store.ts, types/index.ts, permissions.ts, constants.ts pour comprendre les patterns et types existants
- Créé /src/components/dashboard/MembersPanel.tsx (537 lignes)
  - Panneau complet affichant la liste des membres avec avatars colorés (hash-based fallback), badges de rôle (MEMBER_ROLE_LABELS/COLORS)
  - Affichage des points pour les enfants avec icône étoile, surnom en italique guillemets
  - Boutons Modifier le rôle et Retirer pour le owner (sauf soi-même et autres owners)
  - Bouton Surnom pour les enfants (owner only)
  - Section invitations en attente avec fetch GET /api/invitations?homeId=xxx
  - 3 dialogs intégrés : modification rôle (Select), modification surnom (Input), confirmation retrait (destructive)
  - Appels API : PATCH /api/members (rôle, surnom), DELETE /api/members (retrait)
  - Animations Framer Motion sur la liste des membres et invitations (AnimatePresence, motion.div)
  - Responsive mobile-first, ScrollArea max-h-96
- Créé /src/components/dashboard/InviteDialog.tsx (130 lignes)
  - Dialog shadcn/ui avec formulaire : email (validation regex), surnom optionnel, rôle (Select filtré par INVITABLE_ROLES)
  - POST /api/invitations avec { homeId, email, role, nickname }
  - Toast succès/erreur, callback onSuccess pour refresh members + invitations
  - Reset du formulaire à l'ouverture, role par défaut = premier rôle invitable
- Créé /src/components/dashboard/NotificationBell.tsx (262 lignes)
  - Icône Bell avec badge rouge animé (spring animation) montrant le compteur unreadCount
  - Popover shadcn/ui aligné à droite, largeur responsive w-80/sm:w-96
  - Liste des 10 dernières notifications avec icônes par type (8 types), titre, body, temps relatif
  - Point vert pour notifications non lues, optimiste mark-as-read au clic (PATCH /api/notifications)
  - Bouton Tout marquer comme lu en footer (PATCH avec markAll:true)
  - Auto-refresh toutes les 30 secondes quand le popover est ouvert (setInterval nettoyé au unmount)
  - État vide avec message Aucune notification
  - Tous les textes en français

Stage Summary:
- 3 fichiers créés : MembersPanel.tsx, InviteDialog.tsx, NotificationBell.tsx
- Composants 100% client-side ('use client')
- Utilisation exclusive de shadcn/ui (Dialog, Popover, Select, Badge, ScrollArea, Separator, Button, Input, Label)
- Intégration avec le store Zustand (useHomeStore) et les types partagés
- Bracket balance vérifié sur les 3 fichiers
- Aucun fichier existant modifié
---
---
Task ID: 2a
Agent: Main Orchestrator
Task: Créer l'utilitaire de permissions centralisé

Work Log:
- Créé src/lib/permissions.ts avec checkMembership(), requirePermission(), hasPermission(), hasMinRole()
- Matrice de permissions ROLE_PERMISSIONS importée depuis types/index.ts
- INVITABLE_ROLES: quels rôles chaque rôle peut inviter
- generateInvitationToken(): token hex 32 chars sécurisé
- homeWhere(): helper Prisma pour filtrer par maison

Stage Summary:
- Utilitaire centralisé pour RLS émulé au niveau applicatif
- Utilisé par toutes les APIs V2

---
Task ID: 2b
Agent: Sub-agent
Task: API Invitations (liste, création, acceptation)

Work Log:
- Créé src/app/api/invitations/route.ts (GET + POST)
- Créé src/app/api/invitations/[token]/route.ts (GET + POST accept)
- Validation complète: email dupliqué, invitation en attente, limite membres
- Auto-expiration des invitations lors du GET
- ActivityLogs de type member_invited et member_joined

Stage Summary:
- 4 endpoints d'invitation fonctionnels
- Zod v4, Next.js 16 params pattern

---
Task ID: 2c+2d
Agent: Sub-agent
Task: API Members + Notifications

Work Log:
- Créé src/app/api/members/route.ts (GET, PATCH, DELETE)
- Créé src/app/api/notifications/route.ts (GET, PATCH)
- Tri des membres par hiérarchie de rôle
- Permission canManageMembers (owner seul)
- Notifications: filtre unreadOnly, marquer lu (unique/batch/all)

Stage Summary:
- 5 endpoints membres + notifications
- Protection complète contre suppression du dernier owner

---
Task ID: 2e
Agent: Sub-agent full-stack-developer
Task: Frontend Members Panel + Invite Dialog + Notification Bell

Work Log:
- Créé src/components/dashboard/MembersPanel.tsx (537 lignes)
- Créé src/components/dashboard/InviteDialog.tsx (130 lignes)
- Créé src/components/dashboard/NotificationBell.tsx (262 lignes)
- Intégré dans page.tsx: imports, icones V2, bouton Membres, NotificationBell dans header
- Mise à jour QR_COLOR_MAP et QR_ICON_MAP pour les 13 types V2
- Footer mis à jour: 13 modules, multi-utilisateurs, rôles, notifications

Stage Summary:
- 3 composants frontend complets
- Dashboard intégré avec panneau membres, cloche notifications
- 13 types de QR codes supportés dans le sélecteur
