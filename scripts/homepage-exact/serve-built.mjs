import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

const root = join(process.cwd(), 'dist');
const port = Number(process.env.RK_REVIEW_PORT || 4322);
const types = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, `http://${request.headers.host}`).pathname)
    .replace(/^\/rkreno(?=\/|$)/, '') || '/';
  const safePath = normalize(pathname).replace(/^(\.\.[/\\])+/, '');
  let file = join(root, safePath);
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  if (!existsSync(file)) file = join(root, '404.html');
  response.writeHead(existsSync(file) ? 200 : 404, {
    'Content-Type': types[extname(file)] || 'application/octet-stream',
  });
  createReadStream(file).pipe(response);
}).listen(port, '127.0.0.1', () => {
  console.log(`Homepage review server: http://127.0.0.1:${port}/rkreno/`);
});
