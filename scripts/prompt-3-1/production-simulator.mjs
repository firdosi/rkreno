import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { createServer, request as httpRequest } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';
import { createGzip } from 'node:zlib';
import routeMap from '../../config/production-route-map.json' with { type: 'json' };

const root = resolve('dist');
const host = process.env.PRODUCTION_SIMULATOR_HOST || '127.0.0.1';
const port = Number(process.env.PRODUCTION_SIMULATOR_PORT || 4173);
const preferredHost = 'rkrenosolution.com';
const enquiryServiceOrigin = process.env.ENQUIRY_SERVICE_ORIGIN || '';
const formCspEnabled = process.env.SIMULATOR_FORM_ENABLED === 'true';
const analyticsCspEnabled = process.env.SIMULATOR_ANALYTICS_ENABLED === 'true';
const entries = new Map(routeMap.entries.map((entry) => [entry.sourcePath, entry]));
const knownPaths = new Set(routeMap.entries.map((entry) => entry.sourcePath));
const lowerPaths = new Map([...knownPaths].map((value) => [value.toLowerCase(), value]));
const contentTypes = {
  '.avif': 'image/avif', '.css': 'text/css; charset=utf-8', '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8', '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg', '.jpg': 'image/jpeg', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.png': 'image/png',
  '.svg': 'image/svg+xml', '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp', '.woff': 'font/woff', '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8',
};
function contentSecurityPolicy() {
  const script = ["'self'", "'unsafe-inline'"];
  const connect = ["'self'"];
  const frame = [];
  if (formCspEnabled) {
    script.push('https://challenges.cloudflare.com');
    connect.push('https://challenges.cloudflare.com');
    frame.push('https://challenges.cloudflare.com');
  }
  if (analyticsCspEnabled) {
    script.push('https://www.googletagmanager.com');
    connect.push('https://www.google-analytics.com', 'https://region1.google-analytics.com');
  }
  return [
  "default-src 'self'", "base-uri 'self'", "object-src 'none'", "frame-ancestors 'none'",
  `img-src 'self' data:${analyticsCspEnabled ? ' https://www.google-analytics.com' : ''}`,
  "font-src 'self' data: https://fonts.gstatic.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  `script-src ${script.join(' ')}`, `connect-src ${connect.join(' ')}`,
  `frame-src ${frame.length ? frame.join(' ') : "'none'"}`, "form-action 'self'",
  ].join('; ');
}

function securityHeaders(simulatedHttps) {
  return {
    'Content-Security-Policy': contentSecurityPolicy(),
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    ...(simulatedHttps ? { 'Strict-Transport-Security': 'max-age=15552000' } : {}),
  };
}

function proxyEnquiry(request, response) {
  let target;
  try {
    target = new URL(enquiryServiceOrigin);
  } catch {
    return false;
  }
  if (target.protocol !== 'http:' || target.hostname !== '127.0.0.1') return false;
  const proxy = httpRequest({
    hostname: target.hostname,
    port: target.port,
    path: '/api/enquiry',
    method: request.method,
    headers: {
      accept: request.headers.accept || 'application/json',
      'content-type': request.headers['content-type'] || '',
      'content-length': request.headers['content-length'] || '',
      origin: request.headers.origin || '',
    },
  }, (upstream) => {
    response.writeHead(upstream.statusCode || 502, {
      ...securityHeaders(true),
      'Cache-Control': 'no-store',
      'Content-Type': 'application/json; charset=utf-8',
      ...(upstream.headers.allow ? { Allow: upstream.headers.allow } : {}),
    });
    upstream.pipe(response);
  });
  proxy.on('error', () => send(response, 502, '{"ok":false,"code":"SERVICE_UNAVAILABLE","message":"Please try again."}', {
    ...securityHeaders(true), 'Cache-Control': 'no-store', 'Content-Type': 'application/json; charset=utf-8',
  }));
  request.pipe(proxy);
  return true;
}

function normalizePath(pathname) {
  let value = pathname.replace(/\/{2,}/g, '/');
  if (/\/index\.html$/i.test(value)) value = value.replace(/index\.html$/i, '');
  const exactCase = lowerPaths.get(value.toLowerCase());
  if (exactCase) value = exactCase;
  if (value !== '/' && !value.endsWith('/') && knownPaths.has(`${value}/`)) value += '/';
  return value || '/';
}

function send(response, status, body, headers = {}) {
  response.writeHead(status, { ...headers, 'Content-Length': Buffer.byteLength(body) });
  response.end(response.req.method === 'HEAD' ? undefined : body);
}

function candidateFile(pathname) {
  if (pathname === '/') return join(root, 'index.html');
  const relative = pathname.replace(/^\/+/, '');
  if (pathname.endsWith('/')) return join(root, relative, 'index.html');
  return join(root, relative);
}

async function serveFile(request, response, file, simulatedHttps) {
  const resolved = resolve(normalize(file));
  if (!resolved.startsWith(root)) return false;
  let info;
  try { info = await stat(resolved); } catch { return false; }
  if (!info.isFile()) return false;
  const type = contentTypes[extname(resolved).toLowerCase()] || 'application/octet-stream';
  const hashed = resolved.includes(`${join('', '_astro')}`) || /(?:^|[-.])[a-f0-9]{8,}(?:[.-]|$)/i.test(resolved);
  const html = type.startsWith('text/html');
  const cache = html ? 'public, max-age=0, must-revalidate'
    : hashed ? 'public, max-age=31536000, immutable' : 'public, max-age=604800';
  const headers = { ...securityHeaders(simulatedHttps), 'Cache-Control': cache, 'Content-Type': type };
  const compressible = /^(text\/|application\/(?:javascript|json|xml))/.test(type);
  if (compressible && /\bgzip\b/.test(request.headers['accept-encoding'] || '')) {
    response.writeHead(200, { ...headers, 'Content-Encoding': 'gzip', Vary: 'Accept-Encoding' });
    if (request.method === 'HEAD') return response.end();
    createReadStream(resolved).pipe(createGzip({ level: 6 })).pipe(response);
  } else {
    response.writeHead(200, { ...headers, 'Content-Length': info.size });
    if (request.method === 'HEAD') return response.end();
    createReadStream(resolved).pipe(response);
  }
  return true;
}

const server = createServer(async (request, response) => {
  const localHost = String(request.headers['x-forwarded-host'] || request.headers.host || '').split(':')[0].toLowerCase();
  const localAlias = ['127.0.0.1', 'localhost'].includes(localHost);
  const forwardedProto = String(request.headers['x-forwarded-proto'] || (localAlias ? 'https' : 'http')).toLowerCase();
  const simulatedHttps = forwardedProto === 'https';
  const url = new URL(`http://simulator.local${request.url || '/'}`);
  if (url.pathname === '/__production-simulator/health') {
    return send(response, 200, '{"status":"ok"}', {
      ...securityHeaders(simulatedHttps), 'Cache-Control': 'no-store', 'Content-Type': 'application/json; charset=utf-8',
    });
  }
  if (url.pathname === '/api/enquiry' && proxyEnquiry(request, response)) return;
  const pathname = normalizePath(url.pathname);
  const entry = entries.get(pathname);
  if (entry?.action === 'GONE_410') {
    return send(response, 410, 'Gone\n', {
      ...securityHeaders(simulatedHttps), 'Cache-Control': 'public, max-age=300', 'Content-Type': 'text/plain; charset=utf-8',
    });
  }
  const canonicalPath = entry?.action === 'REDIRECT_301' ? entry.destination : pathname;
  const needsOriginRedirect = !localAlias && (localHost !== preferredHost || !simulatedHttps);
  if (needsOriginRedirect || pathname !== url.pathname || entry?.action === 'REDIRECT_301') {
    return send(response, 301, '', {
      ...securityHeaders(simulatedHttps),
      'Cache-Control': 'public, max-age=300',
      Location: `https://${preferredHost}${canonicalPath}${url.search}`,
    });
  }
  if (entry && ['EXISTING_404', 'OWNER_DECISION_UNPUBLISHED'].includes(entry.action)) {
    const body = await readFile(join(root, '404.html'));
    return send(response, 404, body, {
      ...securityHeaders(simulatedHttps), 'Cache-Control': 'public, max-age=0, must-revalidate',
      'Content-Type': 'text/html; charset=utf-8',
    });
  }
  if (await serveFile(request, response, candidateFile(pathname), simulatedHttps)) return;
  const body = await readFile(join(root, '404.html'));
  send(response, 404, body, {
    ...securityHeaders(simulatedHttps), 'Cache-Control': 'public, max-age=0, must-revalidate',
    'Content-Type': 'text/html; charset=utf-8',
  });
});

server.listen(port, host, () => {
  console.log(JSON.stringify({ ready: true, origin: `http://${host}:${port}`, preferredHost }));
});
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
