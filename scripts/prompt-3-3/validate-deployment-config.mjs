import { spawnSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import routeMap from '../../config/production-route-map.json' with { type: 'json' };

const failures = [];
const routeRules = (preview) => routeMap.entries.filter((entry) => entry.action !== 'RETAIN_200')
  .map((entry) => {
    if (entry.action === 'REDIRECT_301') {
      const destination = preview
        ? `https://REPLACE_WITH_APPROVED_PRIVATE_PREVIEW_HOSTNAME${entry.destination}`
        : `https://rkrenosolution.com${entry.destination}`;
      return `location = ${entry.sourcePath} { return 301 ${destination}; }`;
    }
    if (entry.action === 'GONE_410') return `location = ${entry.sourcePath} { return 410; }`;
    return `location = ${entry.sourcePath} { return 404; }`;
  }).join('\n    ');
const templates = [
  ['private_preview', 'deploy/nginx/rkreno-private-preview.conf.template', true],
  ['production', 'deploy/nginx/rkreno-production.conf.template', false],
];
const rendered = {};
for (const [name, file, preview] of templates) {
  const source = await readFile(resolve(file), 'utf8');
  rendered[name] = source.replace('{{ROUTE_RULES}}', routeRules(preview));
  const required = [
    'client_max_body_size 16k', 'proxy_pass http://127.0.0.1:', 'autoindex off',
    'Content-Security-Policy', 'X-Content-Type-Options', 'Cache-Control',
    'error_page 404 /404.html', 'try_files $uri $uri/index.html =404',
    'gzip on', 'location = /api/enquiry', 'return 410', 'return 404',
  ];
  for (const directive of required) if (!rendered[name].includes(directive)) failures.push(`${name}: missing ${directive}`);
  if (/script-src \*|connect-src \*|unsafe-eval|fastcgi_pass|try_files[^;]*\/index\.html;/.test(rendered[name])) {
    failures.push(`${name}: unsafe directive`);
  }
  if ((rendered[name].match(/return 301/g) || []).length < 23) failures.push(`${name}: redirect count`);
  if ((rendered[name].match(/return 410/g) || []).length !== 66) failures.push(`${name}: gone count`);
  if (preview && (!rendered[name].includes('X-Robots-Tag "noindex, nofollow, noarchive"')
    || !rendered[name].includes('Disallow: /') || rendered[name].includes('return 301 https://rkrenosolution.com'))) {
    failures.push('private preview separation');
  }
  if (!preview && (!rendered[name].includes('server_name rkrenosolution.com')
    || !rendered[name].includes('return 301 https://rkrenosolution.com$request_uri'))) failures.push('production host normalization');
}
const service = await readFile(resolve('deploy/systemd/rkreno-enquiry.service.template'), 'utf8');
for (const required of [
  'User=rkreno', 'Group=rkreno', 'EnvironmentFile=/var/www/rkreno/shared/env/enquiry.env',
  'WorkingDirectory=/var/www/rkreno/current', 'NoNewPrivileges=true', 'ProtectSystem=strict',
  'ProtectHome=true', 'PrivateTmp=true', 'Restart=on-failure', 'TimeoutStartSec=', 'TimeoutStopSec=',
]) if (!service.includes(required)) failures.push(`systemd: missing ${required}`);
if (/User=root|0\.0\.0\.0|ConvortAI[\\/]/i.test(service)) failures.push('systemd unsafe value');
const envExample = await readFile(resolve('deploy/systemd/rkreno-enquiry.env.example'), 'utf8');
if (!envExample.includes('ENQUIRY_SERVICE_HOST=127.0.0.1')
  || !envExample.includes('RKRENO_VPS_DEPLOY_ENABLED=false')) failures.push('systemd environment defaults');
const deployScripts = ['deploy-rkreno.sh', 'activate-rkreno.sh', 'rollback-rkreno.sh'];
for (const script of deployScripts) {
  const text = await readFile(resolve('scripts/deploy', script), 'utf8');
  if (!text.includes('rk_require_activation') || /RKRENO_VPS_DEPLOY_ENABLED\s*=\s*true/.test(text)) {
    failures.push(`${script}: activation guard`);
  }
}
const nginxAvailable = spawnSync('nginx', ['-v'], { encoding: 'utf8' }).status === 0;
let nginxTest = 'REQUIRED_IN_STAGE_4';
if (nginxAvailable) {
  nginxTest = 'LOCAL_BINARY_PRESENT_TEMPLATE_VALIDATION_ONLY';
}
await mkdir(resolve('.release-cache/rendered-config'), { recursive: true });
await writeFile(resolve('.release-cache/rendered-config/rkreno-private-preview.conf'), rendered.private_preview);
await writeFile(resolve('.release-cache/rendered-config/rkreno-production.conf'), rendered.production);
const output = {
  result: failures.length ? 'FAIL' : 'PASS',
  nginxTemplateValidation: failures.some((item) => item.includes('preview') || item.includes('production')) ? 'FAIL' : 'PASS',
  systemdTemplateValidation: failures.some((item) => item.includes('systemd')) ? 'FAIL' : 'PASS',
  nginxBinaryAvailable: nginxAvailable,
  nginxTest,
  routeTotals: routeMap.totals,
  failures,
};
await mkdir(resolve('.audit-cache/prompt-3-3'), { recursive: true });
await writeFile(resolve('.audit-cache/prompt-3-3/deployment-config.json'), `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify(output, null, 2));
if (failures.length) process.exit(1);
