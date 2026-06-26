const neo4j = require('./scripts/neo4j-client');
(async () => {
  await neo4j.verifyConnect();

  const pages = await neo4j.runQuery(`
    MATCH (p:Page)
    OPTIONAL MATCH (p)-[:HAS_FIELD]->(f:Field)
    OPTIONAL MATCH (p)-[:HAS_OPERATION]->(o:Operation)
    OPTIONAL MATCH (p)-[:HAS_TESTPOINT]->(t:TestPoint)
    RETURN p.name as page, count(DISTINCT f) as fields, count(DISTINCT o) as ops, count(DISTINCT t) as tps
    ORDER BY fields DESC LIMIT 15
  `);
  console.log('TOP 15 页面:');
  pages.records.forEach(r => console.log(`  ${r.get('page')} | 字段:${r.get('fields')} 按钮:${r.get('ops')} 测试点:${r.get('tps')}`));

  const tps = await neo4j.runQuery(`MATCH (t:TestPoint) RETURN t.type as type, count(t) as cnt ORDER BY cnt DESC`);
  console.log('\n测试要点分类:');
  tps.records.forEach(r => console.log(`  ${r.get('type')}: ${r.get('cnt')}`));

  const ops = await neo4j.runQuery(`MATCH (o:Operation) RETURN o.type as type, count(o) as cnt ORDER BY cnt DESC`);
  console.log('\n操作按钮分类:');
  ops.records.forEach(r => console.log(`  ${r.get('type')}: ${r.get('cnt')}`));

  await neo4j.close();
})();
