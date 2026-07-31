import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const row = (values) => `| ${values.join(' | ')} |`;
const pass = (value) => value ? 'PASS' : 'FAIL';

export async function writePrompt2Reports(root, { prompt2, browserResult }) {
  const reportDir = path.join(root, 'reports/public/migration');
  await mkdir(reportDir, { recursive: true });
  const requirements = JSON.parse(await readFile(path.join(root, 'config/prompt-2-content-requirements.json'), 'utf8'));
  const inventory = {
    generatedAt: new Date().toISOString(), scope: requirements.scope, routeCount: requirements.routes.length,
    routes: requirements.routes.map((item) => ({ route: item.route, pageType: item.pageType, sourceStatus: item.sourceStatus, sourceSnapshot: item.sourceSnapshot, contentRequirements: { h1: item.requiredH1, headings: item.requiredHeadings, statements: item.requiredStatements, lists: item.minLists, tables: item.minTables, faqs: item.minFaqs, images: item.minImages, links: item.requiredLinks, pricing: item.pricing } })),
  };
  await writeFile(path.join(reportDir, 'prompt-2-content-inventory.json'), `${JSON.stringify(inventory, null, 2)}\n`);
  const header = ['Route', 'Status', 'H1', 'Headings', 'Statements', 'Lists', 'Tables', 'FAQs', 'Areas', 'CTA', 'Images', 'Links'];
  const details = prompt2.results.map((item) => row([item.route, item.status, pass(item.checks.h1), pass(item.checks.headings), pass(item.checks.statements), pass(item.checks.lists), pass(item.checks.tables), pass(item.checks.faqs), pass(item.checks.areas), pass(item.checks.cta), pass(item.checks.images && item.checks.imageQuality), pass(item.checks.links)]));
  const completeness = ['# Prompt 2 Content Completeness', '', row(header), row(header.map(() => '---')), ...details, '', `Result: ${prompt2.errors.length ? 'FAIL' : 'PASS'}. COMPLETE: ${prompt2.complete}; NEW_PAGE: ${prompt2.newPages}; MISSING_CONTENT: ${prompt2.results.filter((item) => item.status === 'MISSING_CONTENT').length}.`].join('\n');
  await writeFile(path.join(reportDir, 'prompt-2-content-completeness.md'), `${completeness}\n`);
  const typeReport = (type, title) => ['# '+title, '', row(['Route','Status','Headings','Lists','Tables','FAQs','Images','Internal links']), row(['---','---','---:','---:','---:','---:','---:','---:']), ...prompt2.results.filter((item) => item.pageType === type).map((item) => row([item.route,item.status,item.evidence.headings,item.evidence.lists,item.evidence.tables,item.evidence.faqs,item.evidence.images,item.evidence.internalLinks]))].join('\n');
  await writeFile(path.join(reportDir, 'prompt-2-core-pages.md'), `${typeReport('core', 'Prompt 2 Core Pages')}\n`);
  await writeFile(path.join(reportDir, 'prompt-2-service-pages.md'), `${typeReport('service', 'Prompt 2 Service Pages')}\n`);
  const images = ['# Prompt 2 Image Validation','',row(['Route','Images','Local, alt and dimensions','Status']),row(['---','---:','---','---']),...prompt2.results.map((item)=>row([item.route,item.evidence.images,pass(item.checks.imageQuality),item.checks.images&&item.checks.imageQuality?'PASS':'FAIL']))].join('\n');
  await writeFile(path.join(reportDir, 'prompt-2-image-validation.md'), `${images}\n`);
  const links = ['# Prompt 2 Internal Links','',row(['Route','Internal links','Required contextual links','CTA']),row(['---','---:','---','---']),...prompt2.results.map((item)=>row([item.route,item.evidence.internalLinks,pass(item.checks.links),pass(item.checks.cta)]))].join('\n');
  await writeFile(path.join(reportDir, 'prompt-2-internal-links.md'), `${links}\n`);
  const responsiveErrors = browserResult?.errors || [];
  const responsive = ['# Prompt 2 Responsive Validation','',`Routes: ${prompt2.routes.length}`,`Viewports: desktop 1440px, tablet 768px, mobile 390px`,`Rendered checks: ${browserResult?.checkedPages ?? 'covered by migration browser run'}`,`Result: ${responsiveErrors.length ? 'FAIL' : 'PASS'}`,...responsiveErrors.map((error)=>`- ${error}`)].join('\n\n');
  await writeFile(path.join(reportDir, 'prompt-2-responsive-validation.md'), `${responsive}\n`);
  const summary = ['# Prompt 2 Validation Summary','',`Result: ${prompt2.errors.length || responsiveErrors.length ? 'FAIL' : 'PASS'}`,`Scoped routes: ${prompt2.routes.length}`,`Core pages: ${prompt2.results.filter((item)=>item.pageType==='core').length}`,`Service pages: ${prompt2.results.filter((item)=>item.pageType==='service').length}`,`COMPLETE: ${prompt2.complete}`,`NEW_PAGE: ${prompt2.newPages}`,`MISSING_CONTENT: ${prompt2.results.filter((item)=>item.status==='MISSING_CONTENT').length}`,`Responsive checks: ${browserResult?.checkedPages ?? 0}`,`Errors: ${prompt2.errors.length + responsiveErrors.length}`].join('\n\n');
  await writeFile(path.join(reportDir, 'prompt-2-validation-summary.md'), `${summary}\n`);
}
