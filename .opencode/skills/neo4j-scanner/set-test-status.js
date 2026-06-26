const n = require('./scripts/neo4j-client');
(async () => {
  await n.verifyConnect();
  await n.runQuery("MATCH (tc:TestCase) WITH tc LIMIT 100 SET tc.lastRunStatus = 'waiting'");
  console.log('done');
  await n.close();
})();
