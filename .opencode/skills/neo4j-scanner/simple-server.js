const http = require('http');
const fs = require('fs');
const path = require('path');
const PORT = 3344;
const NEO4J = 'http://localhost:7474/db/neo4j/tx/commit';
const AUTH = 'Basic ' + Buffer.from('neo4j:neo4j123').toString('base64');

http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  // API: Proxy Neo4j query
  if (req.url === '/api/neo4j' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const neoReq = http.request(NEO4J, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': AUTH,
          'Content-Length': Buffer.byteLength(body),
        }
      }, (neoRes) => {
        let data = '';
        neoRes.on('data', c => data += c);
        neoRes.on('end', () => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(data);
        });
      });
      neoReq.on('error', () => { res.writeHead(500).end('{}'); });
      neoReq.write(body);
      neoReq.end();
    });
    return;
  }

  // Serve static files
  const filePath = req.url === '/' ? '/dashboard.html' : req.url;
  const fullPath = path.join(__dirname, filePath);
  try {
    const content = fs.readFileSync(fullPath);
    const ext = path.extname(fullPath);
    const types = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css' };
    res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
    res.end(content);
  } catch {
    try { res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not Found'); } catch {}
  }
}).listen(PORT, () => console.log(`🚀 http://localhost:${PORT}`));
