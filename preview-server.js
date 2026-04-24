const fs = require('fs');
const http = require('http');
const path = require('path');

const host = '127.0.0.1';
const port = Number(process.env.PORT || 4173);
const rootDir = __dirname;
const clients = new Set();

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
};

const liveReloadScript = [
  '<script>',
  '(() => {',
  `  const source = new EventSource("http://${host}:${port}/.preview/live");`,
  '  source.onmessage = () => window.location.reload();',
  '  source.onerror = () => {',
  '    source.close();',
  '    setTimeout(() => window.location.reload(), 1000);',
  '  };',
  '})();',
  '</script>',
].join('');

function sendEvent(data) {
  for (const response of clients) {
    response.write(`data: ${data}\n\n`);
  }
}

function injectLiveReload(html) {
  if (html.includes(liveReloadScript)) {
    return html;
  }

  if (html.includes('</body>')) {
    return html.replace('</body>', `${liveReloadScript}</body>`);
  }

  return `${html}${liveReloadScript}`;
}

function resolveFilePath(urlPath) {
  const safePath = decodeURIComponent(urlPath.split('?')[0]);
  const normalizedPath = safePath === '/' ? '/index.html' : safePath;
  const absolutePath = path.resolve(rootDir, `.${normalizedPath}`);

  if (!absolutePath.startsWith(rootDir)) {
    return null;
  }

  return absolutePath;
}

function serveFile(filePath, response) {
  fs.stat(filePath, (statError, stats) => {
    if (statError) {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Not found');
      return;
    }

    const targetPath = stats.isDirectory() ? path.join(filePath, 'index.html') : filePath;
    const extension = path.extname(targetPath).toLowerCase();
    const contentType = contentTypes[extension] || 'application/octet-stream';

    if (extension === '.html') {
      fs.readFile(targetPath, 'utf8', (readError, fileContent) => {
        if (readError) {
          response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
          response.end('Unable to read file');
          return;
        }

        response.writeHead(200, {
          'Cache-Control': 'no-store',
          'Content-Type': contentType,
        });
        response.end(injectLiveReload(fileContent));
      });

      return;
    }

    fs.readFile(targetPath, (readError, fileContent) => {
      if (readError) {
        response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        response.end('Unable to read file');
        return;
      }

      response.writeHead(200, {
        'Cache-Control': 'no-store',
        'Content-Type': contentType,
      });
      response.end(fileContent);
    });
  });
}

const server = http.createServer((request, response) => {
  if (!request.url) {
    response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Bad request');
    return;
  }

  if (request.url.startsWith('/.preview/live')) {
    response.writeHead(200, {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Connection: 'keep-alive',
      'Content-Type': 'text/event-stream',
    });

    response.write(': connected\n\n');
    clients.add(response);

    request.on('close', () => {
      clients.delete(response);
    });

    return;
  }

  const filePath = resolveFilePath(request.url);
  if (!filePath) {
    response.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Forbidden');
    return;
  }

  serveFile(filePath, response);
});

server.listen(port, host, () => {
  console.log(`Preview server running at http://${host}:${port}`);
  console.log('Live reload is enabled. Keep this process running while you edit.');
});

fs.watch(rootDir, { recursive: true }, (eventType, filename) => {
  if (!filename) {
    return;
  }

  if (filename.startsWith('.git')) {
    return;
  }

  sendEvent(`${eventType}:${filename.replace(/\\/g, '/')}`);
});

function shutdown() {
  for (const response of clients) {
    response.end();
  }

  server.close(() => {
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
