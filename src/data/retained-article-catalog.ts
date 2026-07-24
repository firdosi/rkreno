import { batch2Articles, retainedArticles } from './batch2-articles';
import { batch3Articles } from './batch3';

export interface RetainedArticle {
  route: string;
  title: string;
  summary: string;
  image: string;
  imageAlt: string;
  imageSrcSet?: { src: string; width: number }[];
  imageWidth?: number;
  imageHeight?: number;
  published: string;
  category: string;
}

const articleData = { ...batch2Articles, ...batch3Articles };
const priceGuide: RetainedArticle = {
  route: '/upah-pasang-aircond-selangor-panduan-harga-pemasangan-2026/',
  title: 'Upah Pasang Aircond Selangor: Panduan Harga & Pemasangan',
  summary: 'Panduan memahami faktor harga, skop standard, bahan, akses dan pengesahan tapak untuk pemasangan aircond di Selangor.',
  image: '/assets/media/owner/rk-reno-aircond-outdoor-condenser-720.webp',
  imageAlt: 'Owner-supplied image of an outdoor aircond condenser unit',
  imageSrcSet: [
    { src: '/assets/media/owner/rk-reno-aircond-outdoor-condenser-480.webp', width: 480 },
    { src: '/assets/media/owner/rk-reno-aircond-outdoor-condenser-720.webp', width: 720 },
  ],
  imageWidth: 720,
  imageHeight: 960,
  published: '2026-03-28',
  category: 'Aircond installation',
};

export const retainedArticleCatalog: RetainedArticle[] = retainedArticles.map(
  ([route, fallbackTitle, fallbackCategory]) => {
    if (route === priceGuide.route) return priceGuide;
    const article = articleData[route];
    return {
      route,
      title: article?.title || fallbackTitle,
      summary: article?.summary || 'Practical property-service planning guidance.',
      image: article?.image || '/assets/media/Renovation-planning-and-project-drawings-6cfdb2fc.jpg',
      imageAlt: article?.imageAlt || 'General property-service planning imagery',
      imageSrcSet: article?.imageSrcSet,
      imageWidth: article?.imageWidth,
      imageHeight: article?.imageHeight,
      published: article?.published || '2026-03-28',
      category: article?.category || fallbackCategory,
    };
  },
);

export const retainedArticleByRoute = Object.fromEntries(
  retainedArticleCatalog.map((article) => [article.route, article]),
) as Record<string, RetainedArticle>;
