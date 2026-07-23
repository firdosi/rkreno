import type { APIRoute } from 'astro';
import { isIndexable } from '../config/runtime';

export const prerender = true;

export const GET: APIRoute = () => {
  const body = isIndexable
    ? [
        'User-agent: *',
        'Allow: /',
        '',
        'Sitemap: https://rkrenosolution.com/sitemap.xml',
        '',
      ].join('\n')
    : [
        'User-agent: *',
        'Disallow: /',
        '',
      ].join('\n');
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
