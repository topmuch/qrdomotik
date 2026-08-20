# Agent: Scraping Service Agent
## Task ID: v3e2-2

### Task
Création du mini-service de scraping Playwright (Carrefour/Auchan) sur le port 3005.

### Files Created
- `mini-services/scraping-service/package.json` — @qrdomotik/scraping-service, deps: playwright, @prisma/client
- `mini-services/scraping-service/tsconfig.json` — ES2022, ESNext, bundler, strict
- `mini-services/scraping-service/db.ts` — PrismaClient singleton via import relatif du parent
- `mini-services/scraping-service/types.ts` — ScrapedPromo, ScrapingResult, ScrapingSource, constantes SCRAPING_*
- `mini-services/scraping-service/scrapers/base.ts` — BaseScraper abstraite avec retry, browser lifecycle, keyword extraction
- `mini-services/scraping-service/scrapers/carrefour.ts` — CarrefourScraper avec sélecteurs multiples, fallback générique, anti-bot detection
- `mini-services/scraping-service/scrapers/auchan.ts` — AuchanScraper même structure adaptée à Auchan
- `mini-services/scraping-service/scheduler.ts` — ScrapingScheduler avec cron 3h00, runAllSources, runSource, DB job management
- `mini-services/scraping-service/index.ts` — Bun.serve() port 3005, routes /health, /scheduler/status, /trigger, /jobs, /jobs/:id, /stats

### Verification
- `bun install` réussi (playwright 1.62.1, @prisma/client 6.19.3)
- Playwright Chromium installé (v1234)
- Service démarre correctement, scheduler initialisé pour 3h00
