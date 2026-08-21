# Task 6: Artisan Registration + Verification

## Files Created

### 1. `src/components/artisan/ArtisanRegistration.tsx`
- 4-step mobile-first registration form ('use client')
- **Step 1 — Informations**: businessName, category Select grouped by PROFESSIONAL_GROUP_LABELS, description Textarea
- **Step 2 — Localisation**: address, latitude/longitude, serviceRadiusKm slider (1-50km), isUrgentAvailable Switch toggle
- **Step 3 — Services**: up to 5 services, each with name, description, basePrice, priceUnit Select (PRICE_UNIT_LABELS), durationMinutes, isUrgent toggle
- **Step 4 — Documents**: URL placeholders for Kbis & insurance (add to verificationDocsJson), portfolio image URLs (up to 5, stored in portfolioImagesJson)
- Step indicator at top with icons (1/4, 2/4, etc.), active/done/pending states
- On submit: POST /api/professionals, then POST /api/services for each service
- Success state: confirmation card with amber "En attente de vérification" message
- Uses shadcn/ui (Card, Button, Input, Label, Select, Textarea, Switch, Slider, Badge), Framer Motion transitions
- Blue/slate theme, responsive (max-w-md mx-auto)

### 2. `src/app/api/professionals/verify/route.ts`
- PATCH: Verify or reject a professional
- Body validated with zod: { professionalId, action: 'verify' | 'reject', reason? }
- Verify: sets isVerified=true, creates success Notification for the professional's userId
- Reject: sets isVerified=false, creates rejection Notification with reason (or default message)
- Uses `import { db } from '@/lib/db'`, proper error handling, 404 for missing professional

### 3. `src/components/artisan/VerificationBadge.tsx`
- Small badge component with `isVerified: boolean` and `size?: 'sm' | 'md'` props
- Verified: emerald background, ShieldCheck icon, "Vérifié" text
- Not verified: slate/gray background, Shield icon, "Non vérifié" text
- Pure display component, no client-side hooks needed

### 4. `src/app/api/services/[id]/route.ts`
- GET: Single service with professional name (includes professional: { id, businessName, category, isVerified })
- PUT: Update service fields (name, description, basePrice, priceUnit, durationMinutes, isUrgent, isActive) — zod validated
- DELETE: Soft-delete (sets isActive=false)
- Uses Next.js 16 async params pattern, proper 404 handling, typed ApiResponse

## Lint
- ESLint passes clean (0 errors, 0 warnings)
- Dev server compiles without errors