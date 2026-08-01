import { prepareLockedPage } from '../../components/locked/locked-page-data';
import { articleRouteDesigns, type ArticleFamily } from './article-routes';

export type ArticleSectionKind = 'standard' | 'pricing' | 'process' | 'faq' | 'media' | 'related';

export interface ArticleRecoverySection {
  id: string;
  kind: ArticleSectionKind;
  blocks: any[];
  title: string;
}

export interface ArticleRecoveryModel {
  route: string;
  family: ArticleFamily;
  category: string;
  title: string;
  lead: string;
  published: string;
  dateLabel: string;
  heroImage: string;
  heroAlt: string;
  resolveMedia: (source?: string) => string;
  sections: ArticleRecoverySection[];
  toc: { id: string; text: string }[];
  takeaways: string[];
  serviceHref: string;
  serviceLabel: string;
  related: { href: string; title: string; category: string }[];
}

function sectionKind(title: string, blocks: any[]): ArticleSectionKind {
  const label = title.toLowerCase();
  if (blocks.some((block) => block.type === 'details') || /faq|soalan lazim|frequently asked/.test(label)) return 'faq';
  if (blocks.some((block) => block.type === 'table') || /price|pricing|cost|harga|quotation|budget/.test(label)) return 'pricing';
  if (/process|workflow|sequence|proses|cara dapatkan|step-by-step/.test(label)) return 'process';
  if (/related renovation|related guide/.test(label)) return 'related';
  if (blocks.some((block) => block.type === 'image')) return 'media';
  return 'standard';
}

function sectionTitle(blocks: any[]) {
  return blocks.find((block) => block.type === 'heading')?.text || 'Article introduction';
}

function isWordpressArticleArtifact(block: any) {
  if (block.type === 'link' && (/no comments/i.test(block.text || '') || /#respond$/.test(block.href || ''))) return true;
  return block.type === 'image' && (/gravatar|logo-iocn/i.test(block.src || '') || /author avatar/i.test(block.alt || ''));
}

export function createArticleRecoveryModel(record: any, page: any, allRecords: any[], featuredImage = '', featuredAlt = ''): ArticleRecoveryModel {
  const prepared = prepareLockedPage(record, page, featuredImage, featuredAlt);
  const design = articleRouteDesigns[record.route];
  if (!design) throw new Error(`Missing article recovery design for ${record.route}`);

  const grouped: { blocks: any[] }[] = [];
  let current = { blocks: [] as any[] };
  for (const block of prepared.contentBody.filter((block: any) => !isWordpressArticleArtifact(block))) {
    if (block.type === 'heading' && block.level <= 2 && current.blocks.length) {
      grouped.push(current);
      current = { blocks: [] };
    }
    current.blocks.push(block);
  }
  if (current.blocks.length) grouped.push(current);

  const sections = grouped.map((section: any, index: number) => {
    const title = sectionTitle(section.blocks);
    return {
      id: `article-section-${index + 1}`,
      title,
      kind: sectionKind(title, section.blocks),
      blocks: section.blocks,
    };
  });
  const toc = sections
    .filter((section) => section.blocks.some((block) => block.type === 'heading' && block.level <= 2))
    .map((section) => ({ id: section.id, text: section.title }));
  const recordByRoute = new Map(allRecords.map((item: any) => [item.route, item]));
  const related = design.related.map((href) => {
    const item: any = recordByRoute.get(href);
    return {
      href,
      title: item?.content?.h1 || item?.seo?.title || href,
      category: item?.content?.categories?.[0] || 'RK Reno guide',
    };
  });

  return {
    route: record.route,
    family: design.family,
    category: record.content.categories?.[0] || `${design.family} guide`,
    title: prepared.heroTitle,
    lead: prepared.lead,
    published: prepared.published,
    dateLabel: prepared.dateLabel,
    heroImage: prepared.heroImage,
    heroAlt: prepared.heroAlt,
    resolveMedia: prepared.resolveMedia,
    sections,
    toc,
    takeaways: toc.slice(0, 3).map((item) => item.text),
    serviceHref: design.serviceHref,
    serviceLabel: design.serviceLabel,
    related,
  };
}
