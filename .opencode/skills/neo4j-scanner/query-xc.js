const n = require('./scripts/neo4j-client');
(async () => {
  await n.verifyConnect();
  const r = await n.runQuery(`
    MATCH (p:Page)-[:HAS_AREA]->(a:Area)
    WHERE p.name CONTAINS '宣传物料' OR p.name CONTAINS '宣传资料'
    RETURN p.name as page, a.name as area ORDER BY p.name
  `);
  console.log('宣传物料相关页面:');
  r.records.forEach(row => console.log(`  ${row.get('page')} | ${row.get('area')}`));
  
  // Count test cases
  const r2 = await n.runQuery(`
    MATCH (p:Page)-[:HAS_AREA]->(a:Area)-[:HAS_FIELD|:HAS_BUTTON]->()-[:HAS_TESTCASE]->(tc)
    WHERE p.name CONTAINS '宣传物料' OR p.name CONTAINS '宣传资料'
    RETURN count(tc) as total
  `);
  console.log(`\n总计 ${r2.records[0].get('total')} 条测试用例`);
  await n.close();
})();
