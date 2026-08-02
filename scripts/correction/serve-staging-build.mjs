import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import path from 'node:path';

const dist = path.resolve('dist');
const port = Number(process.argv[2] || 4322);
const mime = { '.html':'text/html; charset=utf-8', '.css':'text/css', '.js':'text/javascript', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.webp':'image/webp', '.svg':'image/svg+xml' };
createServer((request, response) => {
  const url = new URL(request.url, 'http://127.0.0.1');
  const pathname = decodeURIComponent(url.pathname).replace(/^\/rkreno(?=\/|$)/, '') || '/';
  let file = path.join(dist, pathname.replace(/^\//, ''));
  if (pathname.endsWith('/')) file = path.join(file, 'index.html');
  if (!existsSync(file) || statSync(file).isDirectory()) return response.writeHead(404).end('Not found');
  response.setHeader('content-type', mime[path.extname(file).toLowerCase()] || 'application/octet-stream');
  createReadStream(file).pipe(response);
}).listen(port, '127.0.0.1', () => console.log(`Serving staging build at http://127.0.0.1:${port}/rkreno/`));
