const neo4j = require('./scripts/neo4j-client');
(async () => {
  await neo4j.verifyConnect();
  const r = await neo4j.runQuery(`
    MATCH (m:Module)-[:CONTAINS]->(p:Page)
    RETURN m.name as module, collect(p.name) as pages
  `);
  r.records.forEach(row => {
    console.log('\n' + row.get('module') + ':');
    row.get('pages').forEach(p => console.log('  📄 ' + p));
  });
  await neo4j.close();
})();
