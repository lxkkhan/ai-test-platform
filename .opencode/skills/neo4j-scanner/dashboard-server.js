/**
 * dashboard-server.js
 * 测试执行实时监控仪表盘 HTTP 服务
 *
 * 启动: node dashboard-server.js
 * 访问: http://localhost:3344
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const httpProxy = require('http').request;

const PORT = 3344;
const NEO4J_URI = 'http://localhost:7474/db/neo4j/tx/commit';
const NEO4J_AUTH = Buffer.from('neo4j:neo4j123').toString('base64');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

// Serve static files
function serveFile(res, filePath) {
  const ext = path.extname(filePath);
  try {
    const content = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(content);
  } catch {
    res.writeHead(404);
    res.end('Not Found');
  }
}

// Proxy Neo4j API (avoid CORS)
function proxyNeo4j(reqBody, callback) {
  const body = JSON.stringify(reqBody);
  const options = {
    hostname: 'localhost',
    port: 7474,
    path: '/db/neo4j/tx/commit',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + NEO4J_AUTH,
      'Content-Length': Buffer.byteLength(body),
      'Accept': 'application/json',
    },
  };

  const neoReq = httpProxy(options, (neoRes) => {
    let data = '';
    neoRes.on('data', chunk => data += chunk);
    neoRes.on('end', () => {
      try {
        callback(null, JSON.parse(data));
      } catch (e) {
        callback(e, null);
      }
    });
  });
  neoReq.on('error', (e) => callback(e, null));
  neoReq.setTimeout(10000, () => { neoReq.destroy(); callback(new Error('timeout'), null); });
  neoReq.write(body);
  neoReq.end();
}

const server = http.createServer((req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API: Query Neo4j stats
  if (req.url === '/api/stats') {
    proxyNeo4j({
      statements: [{
        statement: `
          MATCH (tc:TestCase)
          WITH tc.lastRunStatus as status, count(tc) as cnt
          RETURN coalesce(status, 'waiting') as status, cnt
          UNION ALL
          MATCH (tc:TestCase) WHERE tc.lastRunAt IS NOT NULL
          RETURN 'lastRun' as status, count(tc) as cnt
        `,
        resultDataContents: ['row'],
      }]
    }, (err, neoData) => {
      if (err) { res.writeHead(500).end(JSON.stringify({ error: err.message })); return; }
      const results = {};
      (neoData.results?.[0]?.data || []).forEach(row => {
        results[row.row[0]] = row.row[1];
      });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(results));
    });
    return;
  }

  // API: Query running test case detail
  if (req.url === '/api/running') {
    proxyNeo4j({
      statements: [{
        statement: `
          MATCH (tc:TestCase {lastRunStatus:'running'})
          RETURN tc.field as field, tc.type as type,
                 tc.steps as steps, tc.lastRunAt as startedAt
          LIMIT 1
        `,
        resultDataContents: ['row'],
      }]
    }, (err, neoData) => {
      if (err) { res.writeHead(500).end(JSON.stringify({ error: err.message })); return; }
      const rows = (neoData.results?.[0]?.data || []).map(d => {
        const r = {};
        neoData.results[0].columns.forEach((col, i) => { r[col] = d.row[i]; });
        return r;
      });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(rows[0] || null));
    });
    return;
  }

  // API: Recent results
  if (req.url === '/api/recent') {
    proxyNeo4j({
      statements: [{
        statement: `
          MATCH (tc:TestCase)
          WHERE tc.lastRunStatus IS NOT NULL AND tc.lastRunStatus <> 'waiting'
          RETURN tc.field as field, tc.type as type,
                 tc.lastRunStatus as status, tc.lastRunAt as time,
                 tc.lastRunError as error
          ORDER BY tc.lastRunAt DESC LIMIT 15
        `,
        resultDataContents: ['row'],
      }]
    }, (err, neoData) => {
      if (err) { res.writeHead(500).end(JSON.stringify({ error: err.message })); return; }
      const rows = (neoData.results?.[0]?.data || []).map(d => {
        const r = {};
        neoData.results[0].columns.forEach((col, i) => { r[col] = d.row[i]; });
        return r;
      });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(rows));
    });
    return;
  }

  // API: Test case flow (for node visualization)
  if (req.url === '/api/flow') {
    proxyNeo4j({
      statements: [{
        statement: `
          MATCH (p:Page)-[:HAS_AREA]->(a:Area)
          MATCH (a)-[:HAS_FIELD|:HAS_BUTTON]->(parent)-[:HAS_TESTCASE]->(tc:TestCase)
          WHERE tc.lastRunStatus IS NOT NULL
          RETURN p.name as page, a.name as area,
                 tc.id as tcId, tc.field as field, tc.type as type,
                 coalesce(tc.lastRunStatus, 'waiting') as status
          ORDER BY a.name, tc.field
        `,
        resultDataContents: ['row'],
      }]
    }, (err, neoData) => {
      if (err) { try { res.writeHead(500).end('[]'); } catch {} return; }
      try {
        const result = neoData.results?.[0];
        const cols = result?.columns || [];
        const rows = (result?.data || []).map(d => {
          const r = {};
          cols.forEach((c, i) => r[c] = d.row[i]);
          return r;
        });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(rows));
      } catch (e) {
        try { res.writeHead(500).end('[]'); } catch {}
      }
    });
    return;
  }

  // Serve dashboard HTML
  const reqPath = req.url === '/' ? '/dashboard.html' : req.url;
  const filePath = path.join(__dirname, reqPath);
  if (fs.existsSync(filePath)) {
    serveFile(res, filePath);
  } else {
    res.writeHead(404).end('Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`🚀 仪表盘: http://localhost:${PORT}`);
  console.log(`   执行测试后，打开此地址查看实时效果`);
});
