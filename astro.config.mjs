import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

const staging = process.env.DEPLOY_TARGET === 'github';

export default defineConfig({
  site: staging ? 'https://firdosi.github.io' : 'https://rkrenosolution.com',
  base: staging ? '/rkreno' : '/',
  output: 'static',
  trailingSlash: 'always',
  integrations: [sitemap({
    filter: (page) => !page.includes('/404/')
  })]
});
