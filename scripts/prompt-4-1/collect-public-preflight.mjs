import tls from 'node:tls';
import { writeJson, writeText, toCsv, auditRoot } from './lib.mjs';

const generatedAt = new Date().toISOString();
const dnsEndpoint = 'https://cloudflare-dns.com/dns-query';
const queryPlan = [
  ['rkrenosolution.com', 'A', 'Current root web origin', 'YES'],
  ['rkrenosolution.com', 'AAAA', 'Current root IPv6 web origin', 'YES'],
  ['www.rkrenosolution.com', 'CNAME', 'Current www routing', 'YES'],
  ['rkrenosolution.com', 'MX', 'Domain email routing', 'YES'],
  ['rkrenosolution.com', 'TXT', 'SPF or public verification', 'YES'],
  ['rkrenosolution.com', 'CAA', 'Certificate-authority policy', 'YES'],
  ['rkrenosolution.com', 'NS', 'Authoritative nameservers', 'YES'],
  ['_dmarc.rkrenosolution.com', 'TXT', 'DMARC email policy', 'YES'],
];
const dnsRows = [];
for (const [name, type, purpose, preserve] of queryPlan) {
  const response = await fetch(`${dnsEndpoint}?name=${encodeURIComponent(name)}&type=${type}`, {
    headers: { accept: 'application/dns-json' },
  });
  if (!response.ok) throw new Error(`Public DNS query failed: ${name} ${type}`);
  const body = await response.json();
  const answers = (body.Answer || []).filter((answer) => answer.type !== 5 || type === 'CNAME');
  if (!answers.length) {
    dnsRows.push([name, type, 'NOT PUBLISHED', '', purpose, preserve, 'HIGH', 'Bounded public query returned no record.']);
    continue;
  }
  for (const answer of answers) {
    let value = answer.data;
    if (type === 'TXT' && /google-site-verification=/i.test(value)) value = 'Google verification TXT present (value redacted)';
    dnsRows.push([name, type, value, answer.TTL, purpose, preserve, 'HIGH', 'Point-in-time public DNS result.']);
  }
}
const headers = ['Name', 'Type', 'Public value', 'TTL', 'Purpose', 'Must preserve', 'Confidence', 'Notes'];
await writeText('reports/public/prompt-4-1-public-dns-records.csv', toCsv(headers, dnsRows));

function tlsSnapshot(hostname) {
  return new Promise((resolveSnapshot, reject) => {
    const socket = tls.connect({ host: hostname, port: 443, servername: hostname }, () => {
      const certificate = socket.getPeerCertificate();
      const snapshot = {
        subject: certificate.subject?.CN || '',
        issuer: [certificate.issuer?.O, certificate.issuer?.CN].filter(Boolean).join(' / '),
        subjectAlternativeNames: String(certificate.subjectaltname || '').split(', ').map((value) => value.replace(/^DNS:/, '')),
        validFrom: certificate.valid_from,
        validTo: certificate.valid_to,
        protocol: socket.getProtocol(),
        authorized: socket.authorized,
      };
      socket.end();
      resolveSnapshot(snapshot);
    });
    socket.setTimeout(10000, () => socket.destroy(new Error('TLS timeout')));
    socket.on('error', reject);
  });
}
async function inspectHttp(url) {
  const response = await fetch(url, {
    method: 'HEAD', redirect: 'manual',
    headers: { 'user-agent': 'RK-Reno-Prompt-4.1-Read-Only-Preflight/1.0', 'accept-encoding': 'gzip, br' },
  });
  return {
    url, status: response.status, location: response.headers.get('location'),
    server: response.headers.get('server'), platform: response.headers.get('platform'),
    poweredBy: response.headers.get('x-powered-by'), wordpressLink: response.headers.get('link'),
    hsts: response.headers.get('strict-transport-security'),
    contentEncoding: response.headers.get('content-encoding'),
    contentType: response.headers.get('content-type'),
  };
}
const tlsResult = await tlsSnapshot('rkrenosolution.com');
const httpResults = [];
for (const url of [
  'http://rkrenosolution.com/', 'https://rkrenosolution.com/', 'https://www.rkrenosolution.com/',
  'https://rkrenosolution.com/robots.txt', 'https://rkrenosolution.com/sitemap.xml',
  'https://rkrenosolution.com/contact-us/',
]) httpResults.push(await inspectHttp(url));
const publicSnapshot = { generatedAt, dnsRows, tls: tlsResult, http: httpResults };
await writeJson(`${auditRoot}/public-preflight.json`, publicSnapshot);

const found = (name, type) => dnsRows.filter((row) => row[0] === name && row[1] === type && row[2] !== 'NOT PUBLISHED');
const dnsSummary = `# Prompt 4.1 Public DNS Snapshot

Captured at ${generatedAt} using bounded, read-only DNS-over-HTTPS queries. CDN origin answers may rotate; this is a rollback snapshot, not a complete account-zone export.

- Root A records: ${found('rkrenosolution.com', 'A').length}
- Root AAAA records: ${found('rkrenosolution.com', 'AAAA').length}
- www CNAME: ${found('www.rkrenosolution.com', 'CNAME').map((row) => row[2]).join(', ') || 'not published'}
- Nameservers: ${found('rkrenosolution.com', 'NS').map((row) => row[2]).join(', ') || 'not published'}
- MX: ${found('rkrenosolution.com', 'MX').length ? 'published' : 'not published'}
- Root TXT/SPF/Search Console TXT: ${found('rkrenosolution.com', 'TXT').length ? 'published; see redacted CSV' : 'not published'}
- DMARC: ${found('_dmarc.rkrenosolution.com', 'TXT').length ? 'published' : 'not published'}
- CAA: ${found('rkrenosolution.com', 'CAA').length ? 'published' : 'not published'}
- DKIM: no selector was publicly discoverable without guessing, so none was queried.
- ConvortAI/unrelated subdomains: none were enumerated or altered; the future zone export must preserve every unrelated record.

No Cloudflare, Hostinger or DNS account was accessed and no record was changed.
`;
await writeText('reports/public/prompt-4-1-public-dns-snapshot.md', dnsSummary);

const byUrl = Object.fromEntries(httpResults.map((item) => [item.url, item]));
const hostingSummary = `# Prompt 4.1 Live Hosting and TLS Snapshot

Captured at ${generatedAt} using read-only HEAD and TLS handshakes only.

- Preferred hostname: \`https://rkrenosolution.com/\`
- HTTP root: ${byUrl['http://rkrenosolution.com/'].status} → ${byUrl['http://rkrenosolution.com/'].location}
- HTTPS root: ${byUrl['https://rkrenosolution.com/'].status}
- HTTPS www: ${byUrl['https://www.rkrenosolution.com/'].status} → ${byUrl['https://www.rkrenosolution.com/'].location}
- Homepage/contact/robots/sitemap: ${byUrl['https://rkrenosolution.com/'].status} / ${byUrl['https://rkrenosolution.com/contact-us/'].status} / ${byUrl['https://rkrenosolution.com/robots.txt'].status} / ${byUrl['https://rkrenosolution.com/sitemap.xml'].status}
- TLS subject: ${tlsResult.subject}
- TLS issuer: ${tlsResult.issuer}
- TLS SANs: ${tlsResult.subjectAlternativeNames.join(', ')}
- TLS validity: ${tlsResult.validFrom} through ${tlsResult.validTo}
- TLS protocol/authorization: ${tlsResult.protocol}; ${tlsResult.authorized ? 'valid' : 'not validated'}
- Public server/platform indicators: ${byUrl['https://rkrenosolution.com/'].server || 'not disclosed'} / ${byUrl['https://rkrenosolution.com/'].platform || 'not disclosed'}
- WordPress indicators: ${byUrl['https://rkrenosolution.com/'].poweredBy || 'PHP not disclosed'}; REST API link ${byUrl['https://rkrenosolution.com/'].wordpressLink ? 'present' : 'not observed'}
- HSTS: ${byUrl['https://rkrenosolution.com/'].hsts || 'not present'}
- Compression: ${byUrl['https://rkrenosolution.com/robots.txt'].contentEncoding || 'not advertised on robots HEAD response'}
- Canonical hostname: confirmed separately from public DOM as \`https://rkrenosolution.com/\`

No load test, exploit, login or write request was performed.
`;
await writeText('reports/public/prompt-4-1-live-hosting-tls-snapshot.md', hostingSummary);
console.log(JSON.stringify({ result: 'PASS', generatedAt, dnsRows: dnsRows.length, tls: tlsResult.authorized, httpChecks: httpResults.length }, null, 2));
