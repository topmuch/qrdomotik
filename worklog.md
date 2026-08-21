# QR Domotik — Worklog

---
Task ID: 1
Agent: Main
Task: Build complete Dashboard (Superadmin + Client) with sidebar navigation

Work Log:
- Created dashboard store (`src/store/dashboard-store.ts`) for client-side SPA navigation
- Created 4 API routes: admin stats, admin users, admin batch detail/delete, admin QR reset
- Fixed `isActive` field not existing in User schema - removed all references
- Fixed JWT callback to persist role on token refresh
- Added NEXTAUTH_SECRET and NEXTAUTH_URL to .env
- Created admin user (admin@qrdomotik.com / admin123)
- Fixed `CornersIcon` non-existent import from lucide-react
- Used `next/dynamic` with `ssr: false` to avoid OOM during compilation
- Fixed ClientOverview and ClientHomes to handle both `_count` and flat count API responses

Stage Summary:
- Dashboard Layout: `/src/components/dashboard/DashboardLayout.tsx` — Sidebar SPA with collapsible nav, tooltips, dynamic imports
- Admin Pages (6): Overview (charts), Batch Generator (full design config + PDF), Batch Manager (table), QR Manager (table + filters), Users (table), Stats (same as overview)
- Client Pages (7): Overview, Physical QR (3 tabs: activate/batch/my codes), QR Codes (placeholder), Homes (CRUD), Rooms (CRUD), Activity (logs), Settings (profile + prefs)
- API Routes (4): `/api/admin/stats`, `/api/admin/users`, `/api/admin/batches/[id]`, `/api/admin/reset-qr`
- Login: admin@qrdomotik.com / admin123 (superadmin role)
- Landing page loads correctly (212KB, 7.4s compile)

---
Task ID: 1-a
Agent: Display Modules Builder
Task: Enhance 3 existing modules + build 6 new display modules
Work Log:
- Enhanced WifiModule with native WIFI: protocol connect button, hiddenNetwork support, OPEN security handling
- Enhanced LinkModule with domain preview, favicon, URL validation (invalid URL state)
- Enhanced InfoModule with react-markdown + remark-gfm rendering and prose styling
- Built DailyMenuModule (daily_menu) — amber/orange theme, French date, meal sections with icons
- Built TodoListModule (todo_list) — teal theme, progress bar, interactive checkboxes
- Built GuestbookModule (guestbook) — rose theme, form + messages list, API integration, relative time (date-fns fr)
- Built EnergyCounterModule (energy_counter) — teal/green theme, current reading, consumption delta, add readings via API, history list
- Built KeysTrackerModule (keys_tracker) — amber theme, borrow/return toggle, borrower name form, API integration
- Built DeepCleaningModule (deep_cleaning) — violet/purple theme, frequency badges, progress bar, local checkbox state
- Installed remark-gfm dependency
Stage Summary:
- 9 module display components ready in src/components/modules/
- Guestbook, Energy, Keys modules integrate with API routes (to be built separately)
- All modules use 'use client', shadcn/ui, lucide-react, Tailwind CSS, view logging on mount
- ESLint passes clean

---
Task ID: 1-b
Agent: API Routes Builder
Task: Build 4 API routes + add new types to types/index.ts

Work Log:
- Added todo_list and deep_cleaning to QrType union (already done by 1-a, verified)
- Added labels, icons, descriptions for new types (already done by 1-a, verified)
- Added guestbook_entry_added, energy_reading_added, key_borrowed, key_returned to ACTION_TYPE_LABELS
- Added matching icons to ACTION_TYPE_ICONS
- Added EnergyReading interface, updated EnergyCounterContent with readings field
- Added KeysTrackerItem interface with isBorrowed/borrowedBy, updated KeysTrackerContent to use it
- Added TodoListContent, GuestbookEntryData, DeepCleaningItem, DeepCleaningContent interfaces
- Added TodoListContent and DeepCleaningContent to QrContentUnion
- Built /api/modules/[slug]/guestbook (GET entries, POST new entry, uses GuestbookEntry table)
- Built /api/modules/[slug]/energy (GET readings, POST new reading, stores in QrContent.contentJson)
- Built /api/modules/[slug]/keys (GET items, PATCH toggle borrowed, stores in QrContent.contentJson)
- Built /api/modules/[slug]/checklist (GET/POST/PATCH/DELETE, generic for todo_list/deep_cleaning/shopping_list)

Stage Summary:
- 4 new API route files created under /api/modules/[slug]/
- types/index.ts updated: 4 new action type labels/icons, 6 new content interfaces, 2 types added to QrContentUnion
- All routes are public (no auth), use Prisma/SQLite, zod validation, try/catch error handling
- ESLint passes clean

---
Task ID: 1-c
Agent: Main
Task: Update ContentEditor.tsx with 6 new editors + update /r/[slug]/page.tsx routing

Work Log:
- Enhanced WifiEditor: added hiddenNetwork toggle, conditional password field for OPEN security
- Enhanced InfoEditor: added Markdown support hint, font-mono textarea, larger rows
- Added DailyMenuEditor: meal type selector (4 options with emojis), dish/notes inputs, add/remove
- Added TodoListEditor: title input, add/remove items, cyan theme
- Added GuestbookEditor: title/subtitle inputs, requireName checkbox, moderation info box
- Added EnergyCounterEditor: type (electricity/water/gas), meterId, provider, unit, currentReading, notes
- Added KeysTrackerEditor: add/remove items, name/description/location per item
- Added DeepCleaningEditor: title input, task items with frequency selector (5 options), lastDone display
- Updated ContentEditor switch to route all 6 new types
- Updated /r/[slug]/page.tsx: added 7 new module imports + 7 new switch cases

Stage Summary:
- ContentEditor.tsx now supports 15 QR types (was 9)
- /r/[slug]/page.tsx routes all 15 module types
- Lint clean, dev server compiles without errors
- All V1 modules (1-12) and V2 modules (1-6) are covered