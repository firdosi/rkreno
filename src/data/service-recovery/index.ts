import { aircondModels } from './aircond';
import { renovationModels } from './renovation';
import { specialistModels } from './specialist';
import { demolitionModel } from './demolition';
import type { ServiceRecoveryModel } from './types';

export const serviceRecoveryModels: Record<string, ServiceRecoveryModel> = {
  ...aircondModels,
  ...renovationModels,
  ...specialistModels,
  [demolitionModel.route]: demolitionModel,
};

export type { ServiceRecoveryModel, ServiceItem, RelatedService, ServiceFamily } from './types';
