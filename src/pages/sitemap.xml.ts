import type { APIRoute } from 'astro';
import pages from '@data/site-pages.json';
import routePolicy from '@data/route-policy.json';
import taxonomyArchives from '@data/taxonomy-archives.json';

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
  const heldRoutes = ['/company-history/', '/our-projects-2/', '/our-projects/', '/our-team/', '/testimonials/'];
  const excluded = new Set([...routePolicy.excluded, ...heldRoutes, '/thank-you/', ...Object.keys(taxonomyArchives)]);
  const urls = [
    ...(pages as PageRecord[])
    .filter((page) =>
      page.status === 200
      && page.type !== 'template'
      && page.title
      && !excluded.has(page.path)
    ),
    {
      canonical: 'https://rkrenosolution.com/demolition-contractor-kl-selangor/',
      path: '/demolition-contractor-kl-selangor/',
      status: 200,
      title: 'Demolition Contractor KL & Selangor',
      type: 'service',
    },
  ]
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
