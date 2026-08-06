import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: parseInt(process.env.PORT || '8443', 10),
    strictPort: true,
    proxy: {
      // Optional CORS-safe path: set VITE_PB_URL=/pb
      '/pb': {
        target: 'https://detailing-pb.fly.dev',
        changeOrigin: true,
        secure: true,
        rewrite: (p) => p.replace(/^\/pb/, ''),
      },
      // Detailing apps/api (geocode + route-trip): set VITE_APP_API_URL=/app-api
      '/app-api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/app-api/, ''),
      },
      // Same-origin street tiles (preview/browsers often blank on third-party CDNs)
      '/map-tiles/osm': {
        target: 'https://tile.openstreetmap.org',
        changeOrigin: true,
        secure: true,
        rewrite: (p) => p.replace(/^\/map-tiles\/osm/, ''),
        headers: {
          'User-Agent': 'RinseDesktopCRM/1.0 (route planner; contact@rinsehq.com)',
        },
      },
      '/map-tiles/carto': {
        target: 'https://a.basemaps.cartocdn.com',
        changeOrigin: true,
        secure: true,
        rewrite: (p) => p.replace(/^\/map-tiles\/carto/, '/rastertiles/voyager'),
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: parseInt(process.env.PORT || '8443', 10),
  },
})
