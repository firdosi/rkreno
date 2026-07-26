export const JSON_TYPE = 'application/json; charset=utf-8';
export const allowedFields = new Set([
  'name', 'phone', 'email', 'service', 'projectDetails', 'consent',
  'pageUrl', 'startedAt', 'website', 'turnstileToken',
]);
export const responseMessages = {
  validation: 'Please check the highlighted fields.',
  retry: 'Please try again in a few moments.',
  unavailable: 'Online enquiries are not available right now. Please use WhatsApp or call us.',
};

export function jsonResponse(response, status, payload, headers = {}) {
  const body = JSON.stringify(payload);
  response.writeHead(status, {
    'Cache-Control': 'no-store',
    'Content-Type': JSON_TYPE,
    'Content-Length': Buffer.byteLength(body),
    'X-Content-Type-Options': 'nosniff',
    ...headers,
  });
  response.end(body);
}
