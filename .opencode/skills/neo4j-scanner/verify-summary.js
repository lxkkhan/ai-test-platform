const neo4j = require('./scripts/neo4j-client');
(async () => {
  await neo4j.verifyConnect();
  const r = await neo4j.runQuery(`
    MATCH (t:TestPoint)
    RETURN t.area as area, t.type as type, count(*) as cnt
    ORDER BY area, cnt DESC
  `);
  console.log('测试点按区域+类型分布:');
  r.records.forEach(row => console.log(`  ${row.get('area')} | ${row.get('type')}: ${row.get('cnt')}`));
  await neo4j.close();
})();
