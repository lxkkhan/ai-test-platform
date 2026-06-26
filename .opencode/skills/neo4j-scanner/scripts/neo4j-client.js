const neo4j = require('neo4j-driver');

const URI = process.env.NEO4J_URI || 'bolt://localhost:7687';
const USER = process.env.NEO4J_USER || 'neo4j';
const PASS = process.env.NEO4J_PASSWORD || 'neo4j123';

let driver = null;

function getDriver() {
  if (!driver) {
    driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASS), {
      maxConnectionPoolSize: 10,
      connectionTimeout: 30000,
    });
  }
  return driver;
}

async function verifyConnect() {
  const d = getDriver();
  const info = await d.getServerInfo();
  console.log(`[neo4j] 已连接: ${info.address}, version: ${info.version}`);
  return info;
}

async function runQuery(cql, params = {}) {
  const session = getDriver().session();
  try {
    const result = await session.run(cql, params);
    return result;
  } finally {
    await session.close();
  }
}

async function runInTransaction(callback) {
  const session = getDriver().session();
  const tx = session.beginTransaction();
  try {
    await callback(tx);
    await tx.commit();
  } catch (e) {
    await tx.rollback();
    throw e;
  } finally {
    await session.close();
  }
}

// 批量写入：MERGE Module
async function mergeModule(tx, { name, level, parentName }) {
  const result = await tx.run(`
    MERGE (m:Module {name: $name})
    SET m.level = $level, m.updatedAt = datetime()
    RETURN m
  `, { name, level });
  if (parentName) {
    await tx.run(`
      MATCH (parent:Module {name: $parentName})
      MATCH (m:Module {name: $name})
      MERGE (parent)-[:CONTAINS]->(m)
    `, { parentName, name });
  }
  return result;
}

// 批量写入：MERGE Page
async function mergePage(tx, { name, url, moduleName }) {
  await tx.run(`
    MERGE (p:Page {name: $name})
    SET p.url = $url, p.updatedAt = datetime()
    RETURN p
  `, { name, url });
  if (moduleName) {
    await tx.run(`
      MATCH (m:Module {name: $moduleName})
      MATCH (p:Page {name: $name})
      MERGE (m)-[:CONTAINS]->(p)
    `, { moduleName, name });
  }
}

// 批量写入：MERGE Field
async function mergeField(tx, { label, type, required, pageName }) {
  const fieldId = `${pageName}::${label}`;
  await tx.run(`
    MERGE (f:Field {id: $fieldId})
    SET f.label = $label, f.type = $type, f.required = $required, f.updatedAt = datetime()
    RETURN f
  `, { fieldId, label, type, required: !!required });
  if (pageName) {
    await tx.run(`
      MATCH (p:Page {name: $pageName})
      MATCH (f:Field {id: $fieldId})
      MERGE (p)-[:HAS_FIELD]->(f)
    `, { pageName, fieldId });
  }
}

// 批量写入：MERGE Operation
async function mergeOperation(tx, { name, type, pageName }) {
  const opId = `${pageName}::${name}`;
  await tx.run(`
    MERGE (o:Operation {id: $opId})
    SET o.name = $name, o.type = $type, o.updatedAt = datetime()
    RETURN o
  `, { opId, name, type });
  if (pageName) {
    await tx.run(`
      MATCH (p:Page {name: $pageName})
      MATCH (o:Operation {id: $opId})
      MERGE (p)-[:HAS_OPERATION]->(o)
    `, { pageName, opId });
  }
}

async function close() {
  if (driver) {
    await driver.close();
    driver = null;
  }
}

module.exports = {
  verifyConnect, runQuery, runInTransaction,
  mergeModule, mergePage, mergeField, mergeOperation, close,
};
