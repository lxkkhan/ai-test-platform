/**
 * neo4j-writer.js
 * 测试执行时实时写入状态到 Neo4j，不改变测试点定义
 */
const neo4j = require('./neo4j-client');

async function setTestCaseRunning(tcId) {
  try {
    await neo4j.runQuery(`
      MATCH (tc:TestCase {id: $tcId})
      SET tc.lastRunStatus = 'running', tc.lastRunAt = datetime()
    `, { tcId });
  } catch (e) {
    // silently fail - Neo4j availability shouldn't block execution
  }
}

async function setTestCaseResult(tcId, status, error, screenshot) {
  try {
    await neo4j.runQuery(`
      MATCH (tc:TestCase {id: $tcId})
      SET tc.lastRunStatus = $status, 
          tc.lastRunAt = datetime(),
          tc.lastRunError = $error,
          tc.lastRunScreenshot = $screenshot
    `, { tcId, status, error: error || '', screenshot: screenshot || '' });
  } catch (e) {
    // silently fail
  }
}

async function setAllTestCasesWaiting(pageName, area) {
  try {
    const areaFilter = area ? `AND a.name = $area` : '';
    await neo4j.runQuery(`
      MATCH (p:Page {name: $pageName})-[:HAS_AREA]->(a:Area)
      MATCH (a)-[:HAS_FIELD|:HAS_BUTTON]->(parent)-[:HAS_TESTCASE]->(tc:TestCase)
      ${areaFilter ? `WHERE ${areaFilter.substring(4)}` : ''}
      SET tc.lastRunStatus = 'waiting', tc.lastRunAt = datetime()
    `, { pageName, area });
  } catch {}
}

module.exports = { setTestCaseRunning, setTestCaseResult, setAllTestCasesWaiting };
