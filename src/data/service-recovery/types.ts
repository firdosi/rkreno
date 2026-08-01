import type { PriceCard, PriceTable } from '../service-exact-pricing';
import type { ServiceFaq } from '../service-exact-faqs';

export type ServiceFamily = 'aircond' | 'renovation' | 'specialist' | 'demolition';

export interface ServiceItem {
  title: string;
  text: string;
}

export interface RelatedService extends ServiceItem {
  href: string;
  image: string;
}

export interface ServiceRecoveryModel {
  route: string;
  family: ServiceFamily;
  eyebrow: string;
  title: string;
  lead: string;
  heroImage: string;
  heroAlt: string;
  bodyImages: { src: string; alt: string }[];
  overview: ServiceItem[];
  typesTitle: string;
  types: ServiceItem[];
  scopeTitle: string;
  scope: ServiceItem[];
  quotationTitle: string;
  quotationFactors: ServiceItem[];
  process: ServiceItem[];
  areas: string[];
  related: RelatedService[];
  sourceLinks?: { href: string; label: string }[];
  pricingCards?: PriceCard[];
  pricingTable?: PriceTable;
  pricingNote: string;
  faqs: ServiceFaq[];
  finalTitle: string;
  finalText: string;
}
