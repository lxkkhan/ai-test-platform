const n = require('./scripts/neo4j-client');
(async () => {
  await n.verifyConnect();
  
  // Check 营销中心 node
  const r = await n.runQuery("MATCH (top:Module {name:'营销中心'}) RETURN top");
  console.log('营销中心 node:', r.records.length > 0 ? '✅ EXIST' : '❌ NOT FOUND');
  
  if (r.records.length > 0) {
    console.log('Properties:', JSON.stringify(r.records[0].get('top').properties));
  }

  // Check relationships
  const r2 = await n.runQuery("MATCH (top:Module {name:'营销中心'})-[r]->(m) RETURN type(r) as rel, m.name as target");
  console.log('\n营销中心关系:');
  r2.records.forEach(row => console.log(`  -[:${row.get('rel')}]-> ${row.get('target')}`));

  // Check all Module nodes and their CONTAINS relationships
  const r3 = await n.runQuery(`
    MATCH (m:Module)
    OPTIONAL MATCH (m)-[c:CONTAINS]->(p:Page)
    OPTIONAL MATCH (parent:Module)-[:CONTAINS]->(m)
    RETURN m.name as module, count(DISTINCT p) as pages, collect(DISTINCT parent.name) as parents
    ORDER BY module
  `);
  console.log('\n所有Module节点:');
  r3.records.forEach(row => {
    const mod = row.get('module');
    const pages = row.get('pages');
    const parents = row.get('parents').filter(Boolean).join(', ') || '(root)';
    console.log(`  ${mod} | ${pages} pages | parent: ${parents}`);
  });

  await n.close();
})();
