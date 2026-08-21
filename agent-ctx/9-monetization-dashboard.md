# Task 9: Stripe Connect + Monetization Dashboard

## Files Created

### API Routes
1. **`src/app/api/subscriptions/[id]/route.ts`**
   - GET: Fetch subscription by ID with professional details (businessName, category, isVerified, isActive)
   - PATCH: Cancel subscription (action=cancel), sets status='cancelled', creates Notification for subscriber
   - Uses Next.js 16 async params (`params: Promise<{ id: string }>`)
   - Guards: 404 if not found, 400 if already cancelled or invalid action

2. **`src/app/api/subscriptions/plans/route.ts`**
   - GET: Returns 4 plans as JSON array
   - Merchants: Premium (19.90€/mois, 5 features), Featured (49.90€/mois, 7 features)
   - Professionals: Premium (14.90€/mois, 5 features), Featured (34.90€/mois, 7 features)
   - Uses `SubscriptionPlanInfo` type from `@/types`

### Components
3. **`src/components/monetization/MonetizationDashboard.tsx`** (rewritten)
   - **Revenue cards** (top row): Total revenus mois en cours (emerald gradient), Commissions mois, Abonnements actifs, Transactions ce mois
   - **Revenue chart**: recharts BarChart with 3 bars (revenue, commissions, subscriptions) for last 6 months, custom tooltip, ResponsiveContainer
   - **Recent transactions table**: Fetches GET /api/transactions, shows date/type/amount/status/reference, colored badges for status, type icons
   - **Subscription plans section**: Fetches GET /api/subscriptions/plans, 4-column grid of PlanCard components, "POPULAIRE" badge on featured, "S'abonner" button with toast.info
   - Uses Tabs (Revenus/Transactions/Plans), shadcn/ui Card/Table/Badge/Button/Tabs
   - Emerald/green theme for revenue, slate for the rest
   - Responsive design (grid-cols-2 → lg:grid-cols-4)
   - Loading states with skeletons/pulse, empty states with icons

4. **`src/components/monetization/CommissionConfig.tsx`** (new)
   - Settings panel for all 6 commission types from COMMISSIONS constant
   - Input fields with min/max clamping, step 0.01
   - Info boxes (slate bg) explaining each commission type
   - Save button with loading state, simulated save (toast.success)
   - Responsive 2-column grid (lg), staggered motion animations

## Notes
- ESLint passes clean (0 errors, 0 warnings)
- Dev server compiles without errors
- No modifications to src/app/page.tsx
- Plans API uses correct pricing per spec (merchants: 19.90/49.90, professionals: 14.90/34.90)
- The Subscription model has a `professional` relation but no `merchant` relation in the schema, so the [id] route only includes professional details
