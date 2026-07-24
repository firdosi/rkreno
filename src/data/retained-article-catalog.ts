import { batch2Articles, retainedArticles } from './batch2-articles';
import { batch3Articles } from './batch3';

export interface RetainedArticle {
  route: string;
  title: string;
  summary: string;
  image: string;
  imageAlt: string;
  published: string;
  category: string;
}

const articleData = { ...batch2Articles, ...batch3Articles };
const priceGuide: RetainedArticle = {
  route: '/upah-pasang-aircond-selangor-panduan-harga-pemasangan-2026/',
  title: 'Upah Pasang Aircond Selangor: Panduan Harga & Pemasangan',
  summary: 'Panduan memahami faktor harga, skop standard, bahan, akses dan pengesahan tapak untuk pemasangan aircond di Selangor.',
  image: '/assets/media/723104253-1623451735783564-5450851965206368683-n-3d2cd57b.jpg',
  imageAlt: 'Vacuum pump process during an aircond installation',
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
      published: article?.published || '2026-03-28',
      category: article?.category || fallbackCategory,
    };
  },
);

export const retainedArticleByRoute = Object.fromEntries(
  retainedArticleCatalog.map((article) => [article.route, article]),
) as Record<string, RetainedArticle>;
