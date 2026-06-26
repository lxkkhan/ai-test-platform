const neo4j = require('./scripts/neo4j-client');
(async () => {
  await neo4j.verifyConnect();

  // Area distribution
  const areas = await neo4j.runQuery(`
    MATCH (t:TestPoint) RETURN t.area as area, count(t) as cnt ORDER BY cnt DESC
  `);
  console.log('=== 按区域分布 ===');
  areas.records.forEach(r => console.log(`  ${r.get('area')}: ${r.get('cnt')}`));

  // Sample test points
  const samples = await neo4j.runQuery(`
    MATCH (t:TestPoint) RETURN t.area as area, t.type as type, t.field as field,
           t.precondition as pre, t.steps as steps, t.expected as expected, t.testData as data
    LIMIT 8
  `);
  console.log('\n=== 样本数据 ===');
  samples.records.forEach(r => {
    console.log(`  [${r.get('area')}] ${r.get('type')} | ${r.get('field')}`);
    console.log(`    前置: ${r.get('pre')}`);
    try { const s = JSON.parse(r.get('steps')); console.log(`    步骤: ${s.join(' → ')}`); } catch {}
    console.log(`    预期: ${r.get('expected')}`);
    if (r.get('data')) console.log(`    数据: ${r.get('data')}`);
    console.log('');
  });

  await neo4j.close();
})();
