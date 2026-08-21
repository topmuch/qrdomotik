# Task 3 — Merchant Registration + Espace Pro

## Files Created

### API Routes (4)
1. `src/app/api/merchants/[id]/route.ts` — GET/PUT/DELETE single merchant
2. `src/app/api/merchants/[id]/promos/route.ts` — GET/POST merchant promos
3. `src/app/api/merchants/[id]/stats/route.ts` — GET merchant stats
4. `src/app/api/coupons/route.ts` — POST (generate coupon) / GET (list user coupons)

### Components (2)
5. `src/components/merchant/MerchantRegistration.tsx` — Registration form
6. `src/components/merchant/MerchantDashboard.tsx` — Espace Pro dashboard

### Modified Files
7. `prisma/schema.prisma` — Added `status` field to PromoRedemption
8. `src/app/page.tsx` — Updated to show merchant UI

## Issues Encountered
- None. ESLint clean, db:push successful, dev server compiles.