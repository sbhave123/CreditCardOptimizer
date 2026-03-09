# CardWise - Credit Card Recommendation App

## Overview
CardWise helps users find the optimal credit card based on their spending habits and travel patterns. Users can create multiple "sessions" to test different spending scenarios and compare credit card recommendations.

## Recent Changes
- 2026-03-09: Removed Travel from Spending tab (travel comes solely from Travel tab), expanded card database from 15 to 40+ cards, added point value explanation in "Why This Card" breakdown
- 2026-03-09: Added per-category reward breakdown in "Why This Card" (shows spend x multiplier x point value = reward), current card comparison section (swap/keep-both/current-is-better advice), and dropdown card selection replacing free-text input
- 2026-02-12: Initial MVP build - Auth, schema, frontend, backend, recommendation engine

## Architecture

### Tech Stack
- **Frontend**: React + Vite, Tailwind CSS, Shadcn UI, Wouter routing, TanStack Query
- **Backend**: Express.js, Drizzle ORM, PostgreSQL
- **Auth**: Replit Auth (OpenID Connect)

### Key Files
- `shared/schema.ts` - Data models (spendingSessions, relations)
- `shared/models/auth.ts` - Auth models (users, sessions)
- `server/routes.ts` - API endpoints (CRUD sessions, recommendations)
- `server/storage.ts` - Database storage layer
- `server/creditCards.ts` - 40+ credit card database
- `server/recommendationEngine.ts` - Scoring algorithm
- `client/src/pages/landing.tsx` - Landing page (unauthenticated)
- `client/src/pages/dashboard.tsx` - Session management dashboard
- `client/src/pages/session.tsx` - Session editor with spending/travel/cards/results tabs

### Data Flow
1. User logs in via Replit Auth
2. Creates spending sessions with monthly spending, travel plans, current cards
3. Clicks "Get Recommendations" to run the recommendation engine
4. Engine scores 40+ credit cards against the user's profile
5. Top 5 results returned with explanations, break-even analysis, and action items

### Design
- Dark mode default with purple primary accent
- DM Sans for body, Playfair Display for headings
- Minimalist, fun approach to finances with color accents (chart colors)

## User Preferences
- Minimalist with modern UI
- Dark mode preferred
- Pop of colors for engagement
- Easy navigation
