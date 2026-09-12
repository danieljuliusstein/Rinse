# Rinse — Premium SaaS Landing Page

Marketing site for **Rinse**, an all-in-one platform for mobile detailing businesses. Originally designed in Figma and exported via Figma Make.

## Stack

- React 18 + TypeScript
- Vite 6 (dev server / bundler)
- Tailwind CSS 4 + shadcn/Radix UI components
- No backend — this is a static marketing site (all content is client-side)

## Running on Replit

- The `Start application` workflow runs `npm run dev`, serving the site on port 5000 (bound to `0.0.0.0`, `allowedHosts: true` in `vite.config.ts` so it works behind the Replit proxy).
- `npm run build` produces a production build in `dist/`.
- `npm run preview` previews the production build.

## Project structure

- `src/app/App.tsx` — routes and top-level page wiring
- `src/app/pages/` — marketing pages (`HomePage`, `FeaturesPage`)
- `src/app/layout/` — shared chrome (`Nav`, `Footer`, `DemoModal`)
- `src/app/sections/` — page sections (mockups nested with their parent section)
- `src/app/shared/` — scroll helpers and shared motion utilities
- `src/app/components/ui/` — shadcn/Radix primitives; `components/figma/` for Figma-exported assets
- `src/styles/` — Tailwind, theme, fonts, and global CSS
- `src/assets/` — static assets (e.g. logo)

## User preferences

None recorded yet.
