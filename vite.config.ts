/// <reference types="vitest" />

import { fileURLToPath } from 'node:url'
import legacy from '@vitejs/plugin-legacy'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

/**
 * Build "browser" penuh @lit/react (bukan build "node"/SSR).
 * Build node MEMBUANG props Stencil (label/value/onIonInput) —
 * tanpa ini semua komponen web Ionic (ion-input dsb.) tidak
 * menerima props dalam ujian, walaupun ia berfungsi di browser.
 */
const litReactBrowserBuild = fileURLToPath(
  new URL('./node_modules/@lit/react/index.js', import.meta.url)
)

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    legacy()
  ],
  resolve: {
    /**
     * Keutamaan syarat 'browser' semasa Vitest (Node) menyelesaikan import,
     * supaya pakej yang mempunyai eksport berpisah browser/node (cth. @lit/react)
     * menyelesaikan build client semasa ujian.
     */
    conditions: ['browser']
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    alias: {
      // Pastikan @lit/react sentiasa menyelesaikan build browser penuh
      // dalam ujian (sama seperti semasa `npm run dev` / build sebenar).
      '@lit/react': litReactBrowserBuild
    },
    server: {
      deps: {
        /**
         * Inline-kan lapisan wrapper React Ionic supaya Vite (bukan Node
         * native) yang menyelesaikan import mereka. Tanpa ini, pakej
         * yang di-external-kan memuat @lit/react build node/SSR yang
         * membuang props Stencil (label/value/onIonInput) — lalu semua
         * komponen web Ionic tidak menerima props dalam ujian.
         */
        inline: [
          '@ionic/react',
          '@ionic/react-router',
          '@stencil/react-output-target',
          '@lit/react'
        ]
      }
    }
  }
})
