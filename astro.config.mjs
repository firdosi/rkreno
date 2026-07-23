import { defineConfig } from 'astro/config';

const staging = process.env.DEPLOY_TARGET === 'github';

export default defineConfig({
  site: staging ? 'https://firdosi.github.io' : 'https://rkrenosolution.com',
  base: staging ? '/rkreno' : '/',
  output: 'static',
  trailingSlash: 'always',
});
