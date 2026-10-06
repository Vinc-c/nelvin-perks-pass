import react from '@vitejs/plugin-react'
import path from 'node:path'
import { defineConfig, loadEnv } from 'vite'

// Replaces __SITE_URL__ in index.html (canonical, Open Graph, JSON-LD) with
// VITE_SITE_URL, e.g. https://app.nelvin.com. Falls back to relative URLs.
function siteUrlPlugin(siteUrl) {
  return {
    name: 'nelvin-site-url',
    transformIndexHtml: (html) => html.replaceAll('__SITE_URL__', siteUrl),
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const siteUrl = (env.VITE_SITE_URL || '').replace(/\/+$/, '')

  return {
    plugins: [react(), siteUrlPlugin(siteUrl)],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, './src'),
      },
    },
    build: {
      rolldownOptions: {
        output: {
          // Keep heavy vendor libraries out of the main bundle.
          advancedChunks: {
            groups: [
              { name: 'react-vendor', test: /node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/ },
              { name: 'supabase', test: /node_modules[\\/]@supabase[\\/]/ },
              { name: 'charts', test: /node_modules[\\/](recharts|d3-[^\\/]+)[\\/]/ },
              { name: 'maps', test: /node_modules[\\/](leaflet|react-leaflet)[\\/]/ },
              { name: 'motion', test: /node_modules[\\/]framer-motion[\\/]/ },
            ],
          },
        },
      },
    },
  }
})
