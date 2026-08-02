import fs from 'node:fs';
import path from 'node:path';
import { load } from 'cheerio';

const root = process.cwd();
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'config/blog-post-index.json'), 'utf8'));
const htmlPath = path.join(root, 'dist/blog/index.html');
if (!fs.existsSync(htmlPath)) throw new Error(`Missing built archive: ${htmlPath}`);
const $ = load(fs.readFileSync(htmlPath, 'utf8'));
const cards = $('.recovery-article-card').toArray().map((node) => ({ href: ($(node).attr('href') || '').replace(/^\/rkreno/, ''), title: $(node).find('strong').first().text().replace(/\s+/g, ' ').trim(), image: ($(node).find('img').attr('src') || '').replace(/^\/rkreno/, '') }));
const routes = cards.map((card) => card.href);
const expected = manifest.posts.map((post) => post.route);
const duplicates = routes.filter((route, index) => routes.indexOf(route) !== index);
const missing = expected.filter((route) => !routes.includes(route));
const extra = routes.filter((route) => !expected.includes(route));
const brokenRoutes = expected.filter((route) => !fs.existsSync(path.join(root, 'dist', route.slice(1), 'index.html')));
const brokenImages = manifest.posts.filter((post) => !post.imagePath.startsWith('/') || !fs.existsSync(path.join(root, 'public', post.imagePath.slice(1))));
const wrongTitles = manifest.posts.filter((post) => cards.find((card) => card.href === post.route)?.title !== post.title);
const wrongImages = manifest.posts.filter((post) => cards.find((card) => card.href === post.route)?.image !== post.imagePath);
const forbidden = routes.filter((route) => /category|tag|blog-grid|blog-full-width|blog-standard|blog-detail/.test(route));
const checks = {
  expectedCount: manifest.expectedPostCount === 14,
  renderedCount: cards.length === manifest.expectedPostCount,
  exactRoutesOnce: missing.length === 0 && duplicates.length === 0 && extra.length === 0,
  newestFirst: JSON.stringify(routes) === JSON.stringify(expected),
  routesReturn200: brokenRoutes.length === 0,
  localImages: brokenImages.length === 0 && wrongImages.length === 0,
  exactTitles: wrongTitles.length === 0,
  noContamination: forbidden.length === 0,
  petalingJayaOnce: routes.filter((route) => route === '/office-renovation-petaling-jaya-corporate-fit-out-experts/').length === 1,
  waterproofingGuideOnce: routes.filter((route) => route === '/waterproofing-contractor-kuala-lumpur-the-complete-guide-to-stopping-leaks-2026/').length === 1,
  recoveredPostsPresent: ['/house-renovation-in-kuala-lumpur-the-ultimate-planning-cost-guide-2026/','/upah-pasang-aircond-selangor-panduan-harga-pemasangan-2026/','/pakej-deep-cleaning-rumah-kl-termasuk-pre-hari-raya/','/commercial-retail-shop-renovation-in-kuala-lumpur/','/pu-injection-waterproofing-kl-how-to-fix-wall-cracks-permanently/'].every((route) => routes.includes(route))
};
const failures = Object.entries(checks).filter(([, pass]) => !pass);
const result = { status: failures.length ? 'FAILED' : 'PASSED', expectedPostCount: manifest.expectedPostCount, renderedCardCount: cards.length, missingPostCount: missing.length, duplicatePostCount: duplicates.length, extraNonPostCardCount: extra.length + forbidden.length, brokenCardLinkCount: brokenRoutes.length, brokenCardImageCount: brokenImages.length + wrongImages.length, wrongTitleCount: wrongTitles.length, publicationDateOrdering: checks.newestFirst ? 'PASSED' : 'FAILED', petalingJayaCard: checks.petalingJayaOnce ? 'PASSED' : 'FAILED', recoveredPosts: checks.recoveredPostsPresent ? 'PASSED' : 'FAILED', checks };
const reportDir = path.join(root, 'reports/public/page-recovery/waterproofing-contractor-kl-complete-guide');
fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(path.join(reportDir, 'blog-validation.json'), `${JSON.stringify(result, null, 2)}\n`);
console.log(`BLOG POST INDEX ${result.status}: ${cards.length}/${manifest.expectedPostCount}`);
if (failures.length) { failures.forEach(([name]) => console.error(`FAIL ${name}`)); process.exitCode = 1; }
