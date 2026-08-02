import { createReadStream, existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';

const root = process.cwd(); const dist = path.join(root, 'dist');
const reportDir = path.join(root, 'reports/public/page-recovery/upah-pasang-aircond-selangor-guide');
await mkdir(reportDir, { recursive: true });
const mime = { '.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml' };
const server = createServer((request, response) => {
  const url = new URL(request.url, 'http://127.0.0.1'); const pathname = decodeURIComponent(url.pathname).replace(/^\/rkreno(?=\/|$)/, '') || '/';
  let file = path.join(dist, pathname.replace(/^\//, '')); if (pathname.endsWith('/')) file = path.join(file, 'index.html');
  if (!existsSync(file)) return response.writeHead(404).end('Not found'); response.setHeader('content-type', mime[path.extname(file).toLowerCase()] || 'application/octet-stream'); createReadStream(file).pipe(response);
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve)); const port = server.address().port;
const browser = await chromium.launch({ headless:true }); const route = '/upah-pasang-aircond-selangor-panduan-harga-pemasangan-2026/';
const viewports = [{name:'desktop',width:1440,height:1000},{name:'tablet',width:768,height:1024},{name:'mobile',width:390,height:844}]; const results=[]; const smokeResults=[];
try {
  for (const viewport of viewports) {
    const page = await browser.newPage({ viewport }); const consoleErrors=[]; const failedRequests=[];
    page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); }); page.on('requestfailed', (request) => failedRequests.push(request.url()));
    await page.goto(`http://127.0.0.1:${port}/rkreno${route}`, { waitUntil:'networkidle' });
    await page.evaluate(() => { document.querySelectorAll('.airguide-page img').forEach((image) => { image.loading='eager'; }); window.scrollTo(0,document.documentElement.scrollHeight); });
    await page.waitForFunction(() => [...document.querySelectorAll('.airguide-page img')].every((image) => image.complete && image.naturalWidth > 0), null, { timeout:10000 });
    await page.evaluate(() => window.scrollTo(0,0)); await page.waitForTimeout(150); await page.evaluate(() => document.querySelector('.rk-header')?.classList.remove('is-stuck'));
    await page.addStyleTag({content:'.rk-header.is-stuck .rk-header__desktop,.rk-header__desktop,.rk-header.is-stuck .rk-mobilebar,.rk-mobilebar{position:static!important;inset:auto!important}'});
    const metrics = await page.evaluate(() => ({ overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth, brokenImages:[...document.querySelectorAll('.airguide-page img')].filter((image)=>image.complete&&image.naturalWidth===0).length, h1Count:document.querySelectorAll('.airguide-page h1').length, sectionCount:document.querySelectorAll('[data-airguide-section]').length, priceCardCount:document.querySelectorAll('.airguide-price-grid article').length, faqCount:document.querySelectorAll('.airguide-faq details').length, whatsappCount:document.querySelectorAll('.airguide-page a[href^="https://wa.me/"]').length, minBodyFont:Math.min(...[...document.querySelectorAll('.airguide-page p:not(.airguide-kicker):not(.airguide-number):not(.airguide-breadcrumb),.airguide-page li')].filter((node)=>node.getBoundingClientRect().height>0).map((node)=>parseFloat(getComputedStyle(node).fontSize))) }));
    if (viewport.name === 'mobile') { const faq=page.locator('.airguide-faq details').nth(1); await faq.locator('summary').focus(); await page.keyboard.press('Enter'); metrics.faqKeyboardToggle=await faq.evaluate((node)=>node.open); const menuButton=page.getByRole('button',{name:/open navigation/i}).first(); await menuButton.click(); metrics.mobileMenuOpened=await page.locator('.rk-header.is-drawer-open').count()===1; await page.keyboard.press('Escape'); }
    await page.screenshot({path:path.join(reportDir,`${viewport.name}.png`),fullPage:true}); results.push({...viewport,consoleErrors,failedRequests,...metrics}); await page.close();
  }
  const smokePage=await browser.newPage({viewport:{width:390,height:844}});
  for (const pathname of ['/', '/aircond-installation-kl/', '/upah-pasang-aircond-selangor/', '/house-renovation-in-kuala-lumpur-the-ultimate-planning-cost-guide-2026/', '/electrical-services-selangor/', '/blog/', '/contact-us/']) {
    const response=await smokePage.goto(`http://127.0.0.1:${port}/rkreno${pathname}`,{waitUntil:'networkidle'}); smokeResults.push({pathname,status:response?.status()??0,h1Count:await smokePage.locator('h1').count(),headerCount:await smokePage.locator('.rk-header').count(),footerCount:await smokePage.locator('[data-shared-footer]').count(),guideCount:await smokePage.locator('[data-upah-pasang-aircond-selangor-guide]').count()});
  } await smokePage.close();
} finally { await browser.close(); await new Promise((resolve)=>server.close(resolve)); }
const failures=results.flatMap((item)=>[item.overflow>1?`${item.name}: overflow ${item.overflow}`:null,item.brokenImages?`${item.name}: broken images ${item.brokenImages}`:null,item.consoleErrors.length?`${item.name}: console errors`:null,item.failedRequests.length?`${item.name}: failed requests`:null,item.minBodyFont<16?`${item.name}: body text ${item.minBodyFont}px`:null,item.h1Count!==1?`${item.name}: H1 count ${item.h1Count}`:null,item.sectionCount!==15?`${item.name}: section count ${item.sectionCount}`:null,item.priceCardCount!==2?`${item.name}: price cards ${item.priceCardCount}`:null,item.faqCount!==8?`${item.name}: FAQs ${item.faqCount}`:null,item.whatsappCount!==3?`${item.name}: WhatsApp ${item.whatsappCount}`:null].filter(Boolean));
if(!results[2].faqKeyboardToggle)failures.push('mobile: FAQ keyboard toggle failed'); if(!results[2].mobileMenuOpened)failures.push('mobile: navigation did not open');
for(const smoke of smokeResults){if(smoke.status!==200||smoke.h1Count!==1||smoke.headerCount!==1||smoke.footerCount!==1)failures.push(`smoke ${smoke.pathname}: status=${smoke.status}, h1=${smoke.h1Count}, header=${smoke.headerCount}, footer=${smoke.footerCount}`);if(smoke.pathname!==route&&smoke.guideCount!==0)failures.push(`smoke ${smoke.pathname}: guide renderer leaked`);}
await writeFile(path.join(reportDir,'visual-metrics.json'),`${JSON.stringify({status:failures.length?'FAILED':'PASSED',viewports:results,smokeRoutes:smokeResults,failures},null,2)}\n`);
console.log(`UPAH PASANG AIRCOND SELANGOR GUIDE VISUAL ${failures.length?'FAILED':'PASSED'}`); results.forEach((item)=>console.log(`${item.name}: overflow=${item.overflow}, broken=${item.brokenImages}, console=${item.consoleErrors.length}, minFont=${item.minBodyFont}`)); if(failures.length){failures.forEach((failure)=>console.error(`FAIL ${failure}`));process.exitCode=1;}
