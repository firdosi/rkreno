export const deployTarget = import.meta.env.DEPLOY_TARGET || 'local';
export const isProduction = deployTarget === 'vps';
export const isGitHubStaging = deployTarget === 'github';
export const isPreview = deployTarget === 'vps-preview';
export const isIndexable = isProduction;

const requestedFormMode = import.meta.env.PUBLIC_FORM_MODE || 'disabled';
const allowedFormModes = ['disabled', 'local_test', 'private_preview', 'production'];
export const formMode = isGitHubStaging || !allowedFormModes.includes(requestedFormMode)
  ? 'disabled'
  : requestedFormMode;
export const isFormEnabled = formMode !== 'disabled'
  && ((isProduction && formMode === 'production') || (isPreview && formMode === 'private_preview')
    || (deployTarget === 'local' && formMode === 'local_test'));
export const isAnalyticsTestMode = deployTarget === 'local'
  && import.meta.env.PUBLIC_ANALYTICS_TEST_MODE === 'true';
export const isConsentEligible = !isGitHubStaging
  && (isProduction || isPreview || isAnalyticsTestMode)
  && import.meta.env.PUBLIC_CONSENT_ENABLED === 'true';

export const publicConfig = {
  analyticsEnabled: isConsentEligible && import.meta.env.PUBLIC_ANALYTICS_ENABLED === 'true',
  analyticsTestMode: isAnalyticsTestMode,
  formEndpoint: isFormEnabled ? (import.meta.env.PUBLIC_FORM_ENDPOINT || '') : '',
  formMode,
  googleSiteVerification: import.meta.env.PUBLIC_GOOGLE_SITE_VERIFICATION || '',
  googleTagId: import.meta.env.PUBLIC_GOOGLE_TAG_ID || 'GT-T944JBVZ',
  ga4MeasurementId: import.meta.env.PUBLIC_GA4_MEASUREMENT_ID || 'G-NVEL66185G',
  gtmId: import.meta.env.PUBLIC_GTM_ID || '',
  metaPixelId: import.meta.env.PUBLIC_META_PIXEL_ID || '',
  turnstileSiteKey: isFormEnabled ? (import.meta.env.PUBLIC_TURNSTILE_SITE_KEY || '') : '',
};
