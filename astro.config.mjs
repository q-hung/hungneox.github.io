import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://butchiso.com',
  redirects: {
    '/en/blog/2013-08-03-sphinx-and-vietnamese-searching':
      '/en/blog/2013-08-03-sphinx-vietnamese-full-text-search-charset-table',
  },
  integrations: [sitemap()],
  markdown: {
    shikiConfig: {
      themes: {
        light: 'vitesse-light',
        dark: 'vitesse-dark',
      },
    },
  },
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'vi'],
    routing: {
      prefixDefaultLocale: false
    }
  }
});
