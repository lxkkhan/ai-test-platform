const n = require('./scripts/neo4j-client');
(async () => {
  await n.verifyConnect();

  // 1. Save page→module mapping
  const mapping = await n.runQuery(`
    MATCH (m:Module)-[:CONTAINS]->(p:Page)
    WHERE m.name <> '营销中心'
    RETURN m.name as module, collect(p.name) as pages
  `);
  console.log('📦 已保存页面映射:');
  mapping.records.forEach(r => console.log(`  ${r.get('module')}: ${r.get('pages').length} 页`));

  // 2. Delete old Module nodes + CONTAINS relationships
  await n.runQuery('MATCH (m:Module) DETACH DELETE m');
  console.log('🗑️ 已删除旧 Module 节点');

  // 3. Create 营销中心 FIRST (gets smallest internal ID)
  await n.runQuery("CREATE (top:Module {name:'营销中心', level: 0})");
  console.log('✅ 营销中心 (ID: 0)');

  // 4. Create sub-modules
  const subNames = ['基础数据', '宣传物料管理'];
  for (const name of subNames) {
    await n.runQuery(`
      MATCH (top:Module {name:'营销中心'})
      CREATE (sub:Module {name: $name, level: 1})
      CREATE (top)-[:CONTAINS]->(sub)
    `, { name });
    console.log(`  ✅ ${name} → 营销中心`);
  }

  // 5. Re-link pages
  for (const row of mapping.records) {
    const modName = row.get('module');
    const pages = row.get('pages');
    for (const pg of pages) {
      await n.runQuery(`
        MATCH (m:Module {name: $modName})
        MATCH (p:Page {name: $pgName})
        MERGE (m)-[:CONTAINS]->(p)
      `, { modName, pgName: pg });
    }
    console.log(`  🔗 ${modName}: ${pages.length} 页已关联`);
  }

  // 6. Verify
  console.log('\n📊 验证:');
  const v = await n.runQuery(`
    MATCH path = (top:Module {name:'营销中心'})-[:CONTAINS*]->(p:Page)
    RETURN top.name as root, length(path) as depth, p.name as page
    ORDER BY depth, p.name
  `);
  const byDepth = {};
  v.records.forEach(r => {
    const d = r.get('depth');
    if (!byDepth[d]) byDepth[d] = [];
    byDepth[d].push(r.get('page'));
  });
  Object.keys(byDepth).sort().forEach(d => {
    console.log(`  Depth ${d}: ${byDepth[d].length} 项`);
    if (d === '1') byDepth[d].forEach(p => console.log(`    📁 ${p}`));
    else byDepth[d].slice(0, 5).forEach(p => console.log(`    📄 ${p}`));
    if (byDepth[d].length > 5) console.log(`    ... 还有 ${byDepth[d].length - 5} 页`);
  });

  const stats = await n.runQuery("MATCH (n) RETURN labels(n)[0] as type, count(n) as cnt ORDER BY cnt DESC");
  console.log('\n📊 图谱统计:');
  stats.records.forEach(r => console.log(`  ${r.get('type')}: ${r.get('cnt')}`));

  await n.close();
})();
