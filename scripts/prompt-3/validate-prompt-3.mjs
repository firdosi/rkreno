import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { load } from 'cheerio';
const clean = (value = '') => value.replace(/\s+/g, ' ').trim();
const key = (value = '') => clean(value).toLowerCase();
const exists = (file) => access(file).then(() => true).catch(() => false);
const htmlFile = (root, route) => route === '/' ? path.join(root,'dist/index.html') : path.join(root,'dist',route.slice(1),'index.html');
const localFile = (root, src) => path.join(root,'dist',src.replace(/^\/rkreno\/?/,'').replace(/^\//,''));
const normalize = (href = '') => {
  if (/^(?:tel:|mailto:|https?:\/\/wa\.me|#)/i.test(href)) return href;
  try { const url = new URL(href,'https://rkrenosolution.com/'); if(!['rkrenosolution.com','firdosi.github.io'].includes(url.hostname)) return href; return (url.pathname.replace(/^\/rkreno(?=\/|$)/,'') || '/').replace(/([^/])$/,'$1/'); } catch { return href; }
};
export async function validatePrompt3(root) {
  const config = JSON.parse(await readFile(path.join(root,'config/prompt-3-content-requirements.json'),'utf8'));
  const registry = JSON.parse(await readFile(path.join(root,'config/final-route-registry.json'),'utf8'));
  const taxonomies = JSON.parse(await readFile(path.join(root,'src/data/taxonomy-archives.json'),'utf8'));
  const sitemap = await readFile(path.join(root,'dist/sitemap.xml'),'utf8');
  const errors=[]; const results=[]; const titles=new Map(); const descriptions=new Map();
  for (const requirement of config.routes) {
    const info = registry.publicRoutes.find((item) => item.path === requirement.route);
    const html = await readFile(htmlFile(root,requirement.route),'utf8'); const $=load(html); const main=$('main');
    const text=key(main.text()); const headings=main.find('h1,h2,h3,h4,h5,h6').toArray().map((node)=>clean($(node).text()));
    const hrefs=main.find('a[href]').toArray().map((node)=>normalize($(node).attr('href'))); const schema=[]; let schemaValid=true;
    for(const node of $('script[type="application/ld+json"]').toArray()){try{schema.push(JSON.parse($(node).text()))}catch{schemaValid=false}}
    const schemaTypes=schema.map((item)=>item['@type']); const title=clean($('title').text()); const description=clean($('meta[name="description"]').attr('content')||'');
    const levels=main.find('h1,h2,h3,h4,h5,h6').toArray().map((node)=>Number(node.tagName.slice(1)));
    const images=main.find('img').toArray(); let imagesValid=true;
    for(const node of images){const image=$(node),src=image.attr('src')||'';if(image.attr('alt')===undefined||!image.attr('width')||!image.attr('height')||/^https?:/i.test(src)||!(await exists(localFile(root,src))))imagesValid=false;}
    let linksValid=true; for(const href of hrefs.filter((item)=>item.startsWith('/'))){if(!(await exists(htmlFile(root,href))) && !(await exists(localFile(root,href))))linksValid=false;}
    const cards=main.find('.p23-archive-entry'); const expectedArticles=taxonomies[requirement.route]?.articles || [];
    const checks={
      h1:main.find('h1').length===1&&key(main.find('h1').text())===key(requirement.h1),
      headings:requirement.headings.every((expected)=>headings.some((actual)=>key(actual).includes(key(expected)))),
      statements:requirement.statements.every((expected)=>text.includes(key(expected))),
      lists:main.find('ul,ol').length>=(requirement.minLists||0), tables:main.find('table').length>=(requirement.minTables||0), faqs:main.find('details').length>=(requirement.minFaqs||0),
      images:images.length>=(requirement.minImages||0)&&imagesValid, links:requirement.links.every((item)=>hrefs.includes(item))&&linksValid,
      cta:requirement.type!=='article'||hrefs.some((item)=>/^tel:|^https:\/\/wa\.me|\/contact-us\/$/.test(item)),
      cards:requirement.type!=='archive'||(cards.length>=requirement.minCards&&expectedArticles.every((route)=>hrefs.includes(route))),
      seo:title.length>20&&description.length>=50&&$('link[rel="canonical"]').attr('href')===info.canonical&&/noindex\s*,\s*nofollow/i.test($('meta[name="robots"]').attr('content')||'')&&$('meta[property="og:title"]').length===1&&!/firdosi\.github\.io/.test($('head').html()||''),
      schema:schemaValid&&requirement.schema.every((type)=>schemaTypes.includes(type))&&!schemaTypes.some((type)=>['Review','AggregateRating'].includes(type)),
      hierarchy:!levels.some((level,index)=>index&&level>levels[index-1]+1),
      sitemap:info.sitemapInclusion?sitemap.includes(info.canonical):!sitemap.includes(info.canonical),
      unsupported:!config.forbiddenVisiblePatterns.some((pattern)=>text.includes(key(pattern))),
    };
    titles.set(title,(titles.get(title)||0)+1); descriptions.set(description,(descriptions.get(description)||0)+1);
    const missing=Object.entries(checks).filter(([,value])=>!value).map(([name])=>name); if(missing.length)errors.push(`${requirement.route}: ${missing.join(', ')}`);
    results.push({route:requirement.route,type:requirement.type,expectedStatus:requirement.expectedStatus,status:missing.length?'MISSING_CONTENT':requirement.expectedStatus,missing,checks,evidence:{headings:headings.length,lists:main.find('ul,ol').length,tables:main.find('table').length,faqs:main.find('details').length,images:images.length,links:hrefs.filter((item)=>item.startsWith('/')).length,cards:cards.length,schemaTypes}});
  }
  for(const result of results){const html=await readFile(htmlFile(root,result.route),'utf8');const $=load(html);if(titles.get(clean($('title').text()))>1){errors.push(`${result.route}: duplicate title`);result.missing.push('uniqueTitle')}if(descriptions.get(clean($('meta[name="description"]').attr('content')||''))>1){errors.push(`${result.route}: duplicate description`);result.missing.push('uniqueDescription')}}
  return {errors,results,routes:config.routes.map((item)=>item.route),counts:{articles:results.filter((x)=>x.type==='article').length,archives:results.filter((x)=>x.type==='archive').length,restored:results.filter((x)=>x.type==='restored').length,missingContent:results.filter((x)=>x.status==='MISSING_CONTENT').length,missingOriginal:results.filter((x)=>x.status==='MISSING_ORIGINAL_ASSET').length}};
}
