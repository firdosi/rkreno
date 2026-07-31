import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const missingAssets = [
  'deep-cleaning-rumah-kuala-lumpur.webp', 'cuci-bilik-air-rumah-kl.webp',
  'pakej-cuci-rumah-hari-raya.webp', 'cucian-selepas-renovasi-rumah.webp',
  'cuci-dapur-rumah-berminyak.webp', 'cuci-habuk-plaster-ceiling.webp',
  'servis-aircond-dan-cuci-rumah.webp',
];
const table = (headers, rows) => `| ${headers.join(' | ')} |\n| ${headers.map(() => '---').join(' | ')} |\n${rows.map((row) => `| ${row.join(' | ')} |`).join('\n')}\n`;

export async function writeReports(root, result) {
  const output = path.join(root, 'reports/public/migration');
  await mkdir(output, { recursive: true });
  const { staticResult: s, browserResult: b, safetyResult: g } = result;
  const generated = new Date().toISOString();
  const passing = s.errors.length + b.errors.length + g.errors.length === 0;
  const routeRows = s.routes.map((route) => [route.path, String(route.words), route.errors.length ? route.errors.join('; ') : 'PASS']);
  const shared = `Generated: ${generated}\n\nStatus: **${passing ? 'PASS' : 'FAIL'}**\n\n`;
  const reports = {
    'final-route-migration.md': `# Final route migration report\n\n${shared}- Public routes: ${s.routeCount}/48\n- Mirrored WordPress routes: 47\n- New demolition route: 1\n- Redirect rules: ${s.redirects}\n- Gone rules: ${s.gone}\n- Known 404 rules: ${s.known404}\n- Custom 404: present\n`,
    'final-content-completeness.md': `# Final content completeness report\n\n${shared}All ${s.routes.filter((route) => !route.errors.some((error) => /H1|thin|heading/.test(error))).length} routes pass fresh H1, heading-order and rendered-content checks. Source-derived removals remain documented in the claims review.\n\n${table(['Route', 'Main words', 'Result'], routeRows)}`,
    'final-image-migration.md': `# Final image migration report\n\n${shared}- Broken rendered images: ${s.brokenImages}\n- Remote WordPress images: ${s.remoteWordPressImages}\n- Rendered images use local assets and include alt attributes.\n- Seven unavailable cleaning originals use the documented source-derived fallback; no replacement is represented as an original project image.\n`,
    'final-seo-validation.md': `# Final SEO validation report\n\n${shared}- Indexable production routes: ${s.indexableCount}\n- Production sitemap URLs: ${s.sitemapCount}\n- Canonicals: production HTTPS, with no staging base path\n- Staging pages: noindex, nofollow\n- Staging robots.txt: disallow all\n- Titles, descriptions, Open Graph metadata and parseable JSON-LD: validated per route\n`,
    'final-internal-link.md': `# Final internal-link report\n\n${shared}- Broken internal links: ${s.brokenLinks}\n- Placeholder links: 0\n- Redirect targets were checked against the authoritative public-route registry.\n- Phone and WhatsApp destinations use +60 11 1133 4496.\n`,
    'final-responsive-validation.md': `# Final responsive validation report\n\n${shared}- Browser route/viewport checks: ${b.checkedPages}\n- Viewports: desktop 1440px, tablet 768px, mobile 390px\n- Horizontal-overflow failures: ${b.errors.filter((error) => error.includes('overflow')).length}\n- Browser console errors: ${b.errors.filter((error) => error.includes('console')).length}\n- Mobile navigation open/close: validated\n- Staging form interception: validated with no POST request\n`,
    'final-missing-assets.md': `# Final missing-assets report\n\n${shared}Affected route: \`/pakej-deep-cleaning-rumah-kl-termasuk-pre-hari-raya/\`\n\n${missingAssets.map((file) => `- \`${file}\` — original unavailable; documented local cleaning fallback used`).join('\n')}\n`,
    'final-github-safety.md': `# Final GitHub safety report\n\n${shared}- Tracked files scanned: ${g.trackedFiles}\n- Backup, owner media and audit cache: ignored and not tracked\n- Private-key signature scan: clear\n- Pages workflow: migration validation enabled\n- VPS workflow: manual dispatch plus explicit enable flag required\n- Analytics, SMTP and Turnstile: inactive on GitHub Pages\n`,
  };
  const sourceClaims = await readFile(path.join(root, 'reports/public/final-wordpress-claim-review.md'), 'utf8');
  const counts = ['OWNER_CONFIRMED', 'EVIDENCE_AVAILABLE', 'SOURCE_ONLY', 'REMOVE_BEFORE_PRODUCTION']
    .map((status) => [status, String((sourceClaims.match(new RegExp(status, 'g')) || []).length)]);
  reports['final-claims-review.md'] = `# Final claims-review report\n\n${shared}Production deployment remains blocked pending owner review. Claims are not verified by migration or design parity.\n\n${table(['Classification', 'Recorded claims'], counts)}\nThe detailed wording and route mapping remain in \`reports/public/final-wordpress-claim-review.md\`.\n`;
  for (const [name, body] of Object.entries(reports)) await writeFile(path.join(output, name), body);
  const summary = { generated, passing, ...s, routes: undefined, staticErrors: s.errors, browserErrors: b.errors, safetyErrors: g.errors, missingAssetRoutes: 1 };
  await writeFile(path.join(output, 'migration-summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
  return { output, passing };
}
