const neo4j = require('./scripts/neo4j-client');
(async () => {
  try {
    const info = await neo4j.verifyConnect();
    console.log('Neo4j 连接信息:', info.address, info.version);

    // Test write
    await neo4j.runQuery('CREATE (t:Test {name: $name, createdAt: datetime()}) RETURN t', { name: 'connection_ok' });
    const result = await neo4j.runQuery('MATCH (t:Test) RETURN t.name as name');
    console.log('写入验证:', result.records[0].get('name'));

    // Cleanup
    await neo4j.runQuery('MATCH (t:Test) DELETE t');
    console.log('✅ Neo4j 连接正常，读写成功');
  } catch (e) {
    console.error('❌ Neo4j 连接失败:', e.message);
  } finally {
    await neo4j.close();
  }
})();
