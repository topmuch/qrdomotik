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
