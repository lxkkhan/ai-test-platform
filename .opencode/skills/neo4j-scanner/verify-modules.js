const n = require('./scripts/neo4j-client');
(async () => {
  await n.verifyConnect();
  const r = await n.runQuery('MATCH (m:Module) RETURN m.name, m.level ORDER BY m.level');
  console.log('Modules:');
  r.records.forEach(row => console.log(`  ${row.get('m.name')} (lvl ${row.get('m.level')})`));
  
  const r2 = await n.runQuery("MATCH (top:Module {name:'营销中心'})-[:CONTAINS]->(sub) RETURN sub.name");
  console.log('\n营销中心子模块:');
  r2.records.forEach(row => console.log(`  - ${row.get('sub.name')}`));
  
  const r3 = await n.runQuery('MATCH (n:Module) OPTIONAL MATCH (n)-[:CONTAINS]->(p:Page) RETURN n.name, count(p) as pages');
  console.log('\n页面统计:');
  r3.records.forEach(row => console.log(`  ${row.get('n.name')}: ${row.get('pages')} pages`));
  
  await n.close();
})();
