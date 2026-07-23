export const deployTarget = import.meta.env.DEPLOY_TARGET || 'local';
export const isProduction = deployTarget === 'vps';
export const isGitHubStaging = deployTarget === 'github';
export const isPreview = deployTarget === 'vps-preview';
export const isIndexable = isProduction;

export const publicConfig = {
  analyticsEnabled: isProduction && import.meta.env.PUBLIC_ANALYTICS_ENABLED === 'true',
  formEndpoint: import.meta.env.PUBLIC_FORM_ENDPOINT || '',
  googleSiteVerification: import.meta.env.PUBLIC_GOOGLE_SITE_VERIFICATION || '',
  googleTagId: import.meta.env.PUBLIC_GOOGLE_TAG_ID || 'GT-T944JBVZ',
  gtmId: import.meta.env.PUBLIC_GTM_ID || '',
  metaPixelId: import.meta.env.PUBLIC_META_PIXEL_ID || '',
  turnstileSiteKey: import.meta.env.PUBLIC_TURNSTILE_SITE_KEY || '',
};
