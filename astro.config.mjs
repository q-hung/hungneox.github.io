import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://butchiso.com',
  redirects: {
    // Legacy /feed.xml (Jekyll). Real feed is `rss.xml.ts` — `feed.xml.ts` breaks Vite on Windows.
    '/feed.xml': '/rss.xml',
    '/en/blog/2013-08-03-sphinx-and-vietnamese-searching':
      '/en/blog/2013-08-03-sphinx-vietnamese-full-text-search-charset-table',
    '/en/blog/2016-07-19-solid-5-nguyen-tac-cua-thiet-ke-huong-doi-tuong':
      '/en/blog/2016-07-19-solid-five-principles-of-object-oriented-design',
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
