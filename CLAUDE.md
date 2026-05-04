# Food Maps — Claude Code Context

## What this project is

A personal food map app where users pin and review restaurants on an interactive Mapbox map. Built as a learning project with two goals:
1. Explore a new frontend stack (different from daily work with React/MUI/Emotion)
2. Build toward requirements of a geospatial & 3D SaaS platform job listing (Mapbox/MapLibre, vector geometry, tiling, 3D rendering, performance)

FE-only app — Supabase handles all backend (Postgres, Auth, RLS).

## Stack

| Layer | Choice |
|---|---|
| Build | Vite |
| Framework | React 19 + TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Routing | React Router v7 |
| Map | Mapbox GL JS via `react-map-gl` v8 |
| Backend | Supabase (Postgres + Auth + RLS) |
| Server state | TanStack Query v5 |
| Forms | React Hook Form v7 + Zod v4 |
| Toasts | Sonner |
| Testing | Vitest + Testing Library + Playwright |

## Key import conventions

- Path alias `@/` maps to `./src/` — configured in `vite.config.ts` and `tsconfig.app.json`
- Map imports come from `react-map-gl/mapbox` (not `react-map-gl`)
- `defineConfig` in `vite.config.ts` comes from `vitest/config`, not `vite` — required for test config to work
- `tsconfig.app.json` has `"ignoreDeprecations": "6.0"` for TypeScript 7.0 `baseUrl` deprecation

## Project structure

```
src/
  components/
    layout/       Navbar.tsx
    map/          FoodMap.tsx, FilterPanel.tsx, RestaurantPopup.tsx, RestaurantMarker.tsx
    restaurants/  RestaurantForm.tsx
    ui/           shadcn components
  context/        AuthContext.tsx
  hooks/          useRestaurants.ts, useFilters.ts, useGeolocation.ts
  lib/            supabase.ts, geojson.ts, queryClient.ts, utils.ts
  pages/          MapPage.tsx, AuthPage.tsx
  types/          restaurant.ts, filters.ts
```

## Core types

```typescript
// src/types/restaurant.ts
export type Cuisine = 'italian' | 'japanese' | 'mexican' | 'american' | 'chinese' | 'indian' | 'thai' | 'mediterranean' | 'other'
export type PriceRange = 1 | 2 | 3
export interface Restaurant {
  id: string; name: string; cuisine: Cuisine; rating: number
  price_range: PriceRange; notes: string; address: string
  latitude: number; longitude: number
  created_by: string | null; created_at: string
}
export type RestaurantInsert = Omit<Restaurant, 'id' | 'created_at'>
export type RestaurantFormData = Omit<RestaurantInsert, 'created_by'>
// RestaurantFormData is what the form handles; MapPage adds created_by before inserting
```

## Environment variables

Create a `.env.local` file in the project root (gitignored — not in repo):
```
VITE_SUPABASE_URL=https://jlpqgjidvrtlbqatwyur.supabase.co
VITE_SUPABASE_ANON_KEY=<supabase anon key>
VITE_MAPBOX_TOKEN=<mapbox public token>
```

## Supabase setup notes

- Table: `restaurants` with columns matching the `Restaurant` interface
- RLS is enabled. Policies: anyone can SELECT; INSERT/DELETE require `auth.uid() = created_by`
- The `restaurants` table needed a manual `GRANT` — Supabase had "Automatically expose new tables" unchecked
- Auth: email/password via Supabase Auth, managed in `AuthContext`

## Architecture decisions

### Map rendering — hybrid approach
Mapbox Layers handle clusters and heatmap; DOM `<Marker>` components handle individual restaurant pins. This is because Mapbox symbol layers use SDF fonts (monochrome only) — color emoji are invisible in them. Markers are only rendered when `zoom >= CLUSTER_MAX_ZOOM (14)`.

### Two GeoJSON sources
`restaurants-heatmap` (no clustering) and `restaurants` (cluster: true) are separate sources. A single clustered source would aggregate points and break the heatmap.

### Heatmap vs clusters — mutually exclusive
Toggling heatmap hides all cluster layers and vice versa. Button label: "🌡️ Heatmap" (click to enable) / "🔵 Clusters" (click to go back).

### MapboxDraw initialization
The draw control must be added after the map fires its `load` event. The `useEffect` in `FoodMap.tsx` depends on `mapLoaded` state which is set via `<Map onLoad={() => setMapLoaded(true)}>`. Initializing before load causes the control to silently fail.

### Geolocation — three levels
1. Default: New York (`{latitude: 40.7484, longitude: -73.9857}`)
2. IP geolocation via `ipapi.co/json/` — city-level, no browser prompt
3. Browser `navigator.geolocation` — precise, requires user permission

Each level triggers a `flyTo()` animation on the map.

## Features built (Phase 1 + Phase 2 in progress)

### Phase 1 — complete
- [x] Restaurant pins on map with emoji by cuisine type
- [x] Click map to open "Add restaurant" form (authenticated users only)
- [x] RestaurantForm with React Hook Form + Zod validation
- [x] View restaurant details in popup (name, cuisine, rating, price, notes, address)
- [x] Delete own restaurants (with confirmation dialog)
- [x] Supabase CRUD with TanStack Query
- [x] Auth (email/password login + signup) with protected actions
- [x] Loading / error / success UI states with Sonner toasts
- [x] Filter panel: by cuisine, minimum rating, price range
- [x] IP + browser geolocation with animated flyTo

### Phase 2 — in progress
- [x] Restaurant clustering (Mapbox GeoJSON cluster source)
- [x] Cluster click → zoom in with `getClusterExpansionZoom`
- [x] Heatmap layer (mutually exclusive with clusters)
- [x] Draw-to-search: MapboxDraw polygon → spatial filter via `@turf/boolean-point-in-polygon`
- [ ] Neighborhood polygon boundaries with hover effects (not started)

## Known gotchas

- `z.coerce.number()` returns `unknown` in Zod v4 — use `z.number()` with `valueAsNumber: true` on the input's `register()` call
- `PriceRange` (1|2|3) must use `z.union([z.literal(1), z.literal(2), z.literal(3)])` in Zod — plain `z.number()` infers as `number`
- `AlertDialogTrigger` — do not use `asChild` prop; wrap the button inside without it
- `NavigationControl` needs `style={{ marginTop: '100px' }}` to clear the navbar + filter panel
- Cluster `interactiveLayerIds={['clusters']}` is required on the Map component for cluster clicks to register
- Marker clicks need `e.stopPropagation()` on the inner div, otherwise the map's `onClick` fires instead

## Commands

```bash
npm run dev      # start dev server
npm run build    # type-check + production build
npm run test     # vitest
```
