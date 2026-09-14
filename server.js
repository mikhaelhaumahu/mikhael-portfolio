const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const USER_HOME = 'C:\\Users\\Mikha';
const PORTFOLIO_DIR = path.join(USER_HOME, 'mikhael-portfolio');

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  // CORS Headers for API
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Handle Contact API
  if (req.url === '/api/contact' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const newMessage = {
          id: Date.now(),
          timestamp: new Date().toISOString(),
          name: data.name || '',
          email: data.email || '',
          subject: data.subject || '',
          message: data.message || ''
        };

        const messagesFile = path.join(PORTFOLIO_DIR, 'messages.json');
        let messages = [];
        if (fs.existsSync(messagesFile)) {
          try {
            messages = JSON.parse(fs.readFileSync(messagesFile, 'utf8'));
          } catch (e) {
            messages = [];
          }
        }
        messages.push(newMessage);
        fs.writeFileSync(messagesFile, JSON.stringify(messages, null, 2));

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: 'Pesan Anda berhasil terkirim dan disimpan di backend!'
        }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Format data tidak valid.' }));
      }
    });
    return;
  }

  // Route file requests
  let reqUrl = req.url;
  let targetPath;

  if (reqUrl.startsWith('/hand-track-app')) {
    let subPath = reqUrl.replace('/hand-track-app', '');
    if (subPath === '' || subPath === '/') subPath = '/index.html';
    targetPath = path.join(USER_HOME, 'hand-track-app', subPath);
  } else if (reqUrl.startsWith('/hand-box-track')) {
    let subPath = reqUrl.replace('/hand-box-track', '');
    if (subPath === '' || subPath === '/') subPath = '/index.html';
    targetPath = path.join(USER_HOME, 'hand-box-track', subPath);
  } else if (reqUrl === '/html-sederhana.html') {
    targetPath = path.join(USER_HOME, 'html-sederhana.html');
  } else {
    let subPath = reqUrl === '/' ? '/index.html' : reqUrl;
    targetPath = path.join(PORTFOLIO_DIR, subPath);
  }

  let ext = path.extname(targetPath).toLowerCase();
  let contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(targetPath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 File Not Found</h1>');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end(`<h1>500 Server Error: ${err.code}</h1>`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`Portfolio & Backend server running at http://localhost:${PORT}/`);
});
