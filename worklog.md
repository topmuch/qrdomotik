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
