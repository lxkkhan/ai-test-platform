const n = require('./scripts/neo4j-client');
(async () => {
  await n.verifyConnect();

  // 1. Get all promotional material pages with stats
  const pages = await n.runQuery(`
    MATCH (p:Page)-[:HAS_AREA]->(a:Area)
    WHERE p.name CONTAINS '宣传物料' OR p.name CONTAINS '宣传资料'
    OPTIONAL MATCH (a)-[:HAS_FIELD]->(f)
    OPTIONAL MATCH (a)-[:HAS_BUTTON]->(b)
    OPTIONAL MATCH (f)-[:HAS_TESTCASE]->(tc)
    OPTIONAL MATCH (b)-[:HAS_TESTCASE]->(tc2)
    RETURN p.name as page, a.name as area,
           count(DISTINCT f) as fields, count(DISTINCT b) as buttons,
           count(DISTINCT tc) + count(DISTINCT tc2) as cases
    ORDER BY p.name, a.name
  `);

  // 2. Group by page
  const byPage = {};
  pages.records.forEach(row => {
    const pg = row.get('page');
    if (!byPage[pg]) byPage[pg] = [];
    byPage[pg].push({
      area: row.get('area'),
      fields: row.get('fields').toNumber(),
      buttons: row.get('buttons').toNumber(),
      cases: row.get('cases').toNumber(),
    });
  });

  function areaIcon(a) { return a === '搜索' ? '🔍' : a === '按钮' ? '🔘' : a === '表单' ? '📝' : '📋'; }
  let totalCases = 0;
  console.log('📋 宣传物料测试用例清单\n');
  console.log('='.repeat(60));
  console.log('');

  for (const [page, areas] of Object.entries(byPage)) {
    console.log(`📄 ${page}`);
    console.log('-'.repeat(50));
    let pageTotal = 0;
    for (const a of areas) {
      console.log(`   ${areaIcon(a.area)} ${a.area}: ${a.fields}字段 + ${a.buttons}按钮 = ${a.cases}条用例`);
      pageTotal += a.cases;
    }
    console.log(`   小计: ${pageTotal} 条`);
    totalCases += pageTotal;
    console.log('');
  }

  console.log('='.repeat(60));
  console.log(`总计: ${totalCases} 条测试用例`);
  console.log(`页面: ${Object.keys(byPage).length} 个`);

  await n.close();
})();
