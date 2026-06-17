import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Sitio estático para Cloudflare Pages.
// i18n nativo: ES por defecto en la raíz, EN bajo /en/.
export default defineConfig({
  site: 'https://kasperskypanama.com',
  trailingSlash: 'always',
  build: {
    format: 'directory', // genera /ruta/index.html -> URLs con carpeta y "/" final
  },
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en'],
    routing: {
      prefixDefaultLocale: false, // ES sin prefijo, EN con /en/
    },
  },
  integrations: [
    sitemap({
      filter: (page) =>
        !/\/(cotizar|gracias|quote|thank-you)\/?$/.test(page),
      i18n: {
        defaultLocale: 'es',
        locales: { es: 'es-PA', en: 'en' },
      },
    }),
  ],
});
