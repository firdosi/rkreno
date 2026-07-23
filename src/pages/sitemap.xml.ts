import type { APIRoute } from 'astro';
import pages from '@data/site-pages.json';

export const prerender = true;

interface PageRecord {
  canonical: string;
  path: string;
  status: number;
  title: string;
  type: string;
}

const escapeXml = (value: string) =>
  value.replace(/[<>&'"]/g, (character) => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    "'": '&apos;',
    '"': '&quot;',
  })[character] || character);

export const GET: APIRoute = () => {
  const urls = (pages as PageRecord[])
    .filter((page) => page.status === 200 && page.type !== 'template' && page.title)
    .map((page) => `  <url><loc>${escapeXml(page.canonical)}</loc></url>`)
    .join('\n');
  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    '</urlset>',
    '',
  ].join('\n');
  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
