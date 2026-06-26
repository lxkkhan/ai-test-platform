/**
 * neo4j-reader.js
 * 从 Neo4j 读取测试用例，按 page/area 分组
 */
const neo4j = require('./neo4j-client');

async function getTestCases(pageName, areas) {
  const hasAreaFilter = Array.isArray(areas) && areas.length > 0;
  const areaFilter = hasAreaFilter ? `AND a.name IN [${areas.map(a => `'${a}'`).join(',')}]` : '';

  const result = await neo4j.runQuery(`
    MATCH (p:Page {name: $pageName})-[:HAS_AREA]->(a:Area)
    WHERE true ${areaFilter}
    OPTIONAL MATCH (a)-[:HAS_FIELD]->(f:Field)
    OPTIONAL MATCH (a)-[:HAS_BUTTON]->(b:Button)
    OPTIONAL MATCH (f)-[:HAS_TESTCASE]->(tc1:TestCase)
    OPTIONAL MATCH (b)-[:HAS_TESTCASE]->(tc2:TestCase)
    RETURN a.name as area,
           collect(DISTINCT {id: f.id, label: f.label, type: f.type, required: f.required, options: f.options}) as fields,
           collect(DISTINCT {id: b.id, name: b.name}) as buttons,
           collect(DISTINCT {id: tc1.id, type: tc1.type, field: tc1.field, mode: tc1.mode,
             precondition: tc1.precondition, steps: tc1.steps, expected: tc1.expected, testData: tc1.testData}) as fieldCases,
           collect(DISTINCT {id: tc2.id, type: tc2.type, field: tc2.field, mode: tc2.mode,
             precondition: tc2.precondition, steps: tc2.steps, expected: tc2.expected, testData: tc2.testData}) as buttonCases
    ORDER BY a.name
  `, { pageName });

  const areas_result = [];
  for (const row of result.records) {
    const area = row.get('area');
    const fields = row.get('fields').filter(Boolean);
    const buttons = row.get('buttons').filter(Boolean);
    const fieldCases = [...new Map((row.get('fieldCases') || []).filter(Boolean).map(tc => [tc.id, tc])).values()];
    const buttonCases = [...new Map((row.get('buttonCases') || []).filter(Boolean).map(tc => [tc.id, tc])).values()];

    areas_result.push({
      area,
      fields,
      buttons,
      testCases: [...fieldCases, ...buttonCases],
    });
  }

  return areas_result;
}

async function listPages(moduleName) {
  if (moduleName) {
    return await neo4j.runQuery(`
      MATCH (m:Module {name: $moduleName})-[:CONTAINS*]->(p:Page)
      RETURN p.name as name ORDER BY p.name
    `, { moduleName });
  }
  return await neo4j.runQuery(`
    MATCH (p:Page) RETURN p.name as name ORDER BY p.name
  `);
}

async function listModules() {
  const r = await neo4j.runQuery(`MATCH (m:Module) RETURN m.name as name ORDER BY m.name`);
  return r.records.map(row => row.get('name'));
}

async function getStats() {
  return await neo4j.runQuery(`
    MATCH (n) RETURN labels(n)[0] as type, count(n) as cnt ORDER BY cnt DESC
  `);
}

module.exports = { getTestCases, listPages, listModules, getStats };
