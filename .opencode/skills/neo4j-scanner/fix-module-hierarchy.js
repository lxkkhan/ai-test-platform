const n = require('./scripts/neo4j-client');
(async () => {
  await n.verifyConnect();

  // Check current modules
  const mods = await n.runQuery('MATCH (m:Module) RETURN m.name as name, m.level as level ORDER BY m.level');
  console.log('当前 Module 结构:');
  mods.records.forEach(r => console.log(`  ${'  '.repeat(r.get('level')-1||0)}📁 ${r.get('name')} (level ${r.get('level')})`));

  // Get pages under each module
  const pages = await n.runQuery(`
    MATCH (m:Module)-[:CONTAINS]->(p:Page)
    RETURN m.name as module, count(p) as pages
    ORDER BY module
  `);
  console.log('\n页面分布:');
  pages.records.forEach(r => console.log(`  ${r.get('module')}: ${r.get('pages')} 页`));

  // Create 营销中心 parent module
  console.log('\n创建 营销中心 父节点...');
  await n.runQuery(`
    MERGE (top:Module {name: '营销中心'})
    SET top.level = 0
  `);

  // Link existing modules under 营销中心
  const existingModules = await n.runQuery('MATCH (m:Module) WHERE m.level > 0 RETURN m.name as name');
  for (const row of existingModules.records) {
    const name = row.get('name');
    await n.runQuery(`
      MATCH (parent:Module {name: '营销中心'})
      MATCH (child:Module {name: $name})
      MERGE (parent)-[:CONTAINS]->(child)
    `, { name });
    console.log(`  ✅ ${name} → 营销中心`);
  }

  // Verify final structure
  const verify = await n.runQuery(`
    MATCH path = (top:Module {name: '营销中心'})-[:CONTAINS*]->(p:Page)
    RETURN p.name as page, length(path) as depth
    ORDER BY depth, p.name
  `);
  console.log('\n✅ 最终结构验证:');
  let lastDepth = 0;
  verify.records.forEach(r => {
    const d = r.get('depth');
    if (d !== lastDepth) { console.log(`  Depth ${d}:`); lastDepth = d; }
    console.log(`    📄 ${r.get('page')}`);
  });

  // Stats
  const stats = await n.runQuery("MATCH (n) RETURN labels(n)[0] as type, count(n) as cnt ORDER BY cnt DESC");
  console.log('\n📊 图谱统计:');
  stats.records.forEach(r => console.log(`  ${r.get('type')}: ${r.get('cnt')}`));

  await n.close();
})();
