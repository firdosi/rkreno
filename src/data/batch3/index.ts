import { aircondArticles } from './aircond-articles';
import { cleaningArticles } from './cleaning-articles';
import { propertyArticles } from './property-articles';
import { renovationArticles } from './renovation-articles';

export const batch3Articles = {
  ...aircondArticles,
  ...cleaningArticles,
  ...propertyArticles,
  ...renovationArticles,
};
