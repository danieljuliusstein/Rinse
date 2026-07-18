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

- `src/app/App.tsx` — root component
- `src/app/components/` — page sections and UI components (`ui/` holds shadcn primitives, `figma/` holds Figma-exported assets/components)
- `src/styles/` — Tailwind, theme, fonts, and global CSS
- `src/assets/` — imported via the `figma:asset/` alias resolved in `vite.config.ts`

## User preferences

None recorded yet.
