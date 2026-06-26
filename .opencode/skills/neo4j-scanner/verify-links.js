const neo4j = require('./scripts/neo4j-client');
(async () => {
  await neo4j.verifyConnect();
  
  const r = await neo4j.runQuery(`
    MATCH (b:Button)-[:HAS_TESTCASE]->(tc:TestCase)
    RETURN b.name, count(tc) as cases LIMIT 10
  `);
  console.log('Button-TestCase 链接:');
  r.records.forEach(row => console.log(`  ${row.get('b.name')} → ${row.get('cases')} 用例`));
  
  const r2 = await neo4j.runQuery(`
    MATCH (a:Area {name:'按钮'})
    OPTIONAL MATCH (a)-[:HAS_BUTTON]->(b)
    OPTIONAL MATCH (b)-[:HAS_TESTCASE]->(tc)
    RETURN a.pageName as page, count(DISTINCT b) as btns, count(DISTINCT tc) as cases
    ORDER BY cases DESC LIMIT 10
  `);
  console.log('\n按钮区域统计:');
  r2.records.forEach(row => console.log(`  ${row.get('page')} | 按钮:${row.get('btns')} 用例:${row.get('cases')}`));
  
  await neo4j.close();
})();
