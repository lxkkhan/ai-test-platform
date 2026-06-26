const neo4j = require('./scripts/neo4j-client');
const fs = require('fs');
const path = require('path');

const SCAN_RESULT = 'E:/006Skills/.opencode/skills/neo4j-scanner/scan-result.json';
const CODESIGN_TP = 'E:/006Skills/.opencode/skills/codesign_data/test-points.json';

async function run() {
  await neo4j.verifyConnect();
  const scanData = JSON.parse(fs.readFileSync(SCAN_RESULT, 'utf8'));
  
  await neo4j.runInTransaction(async (tx) => {
    for (const page of scanData) {
      const pageName = page.name;
      const pathArr = page.path || [];

      // Ensure Module chain
      for (let i = 0; i < pathArr.length - 1; i++) {
        await neo4j.mergeModule(tx, { name: pathArr[i], level: i + 1, parentName: i > 0 ? pathArr[i - 1] : null });
      }
      const parentModule = pathArr[pathArr.length - 2] || pathArr[0] || '';
      await neo4j.mergePage(tx, { name: pageName, url: page.url || '', moduleName: parentModule });

      // ====== Area: 搜索 ======
      if (page.searchFields?.length > 0 || page.testPoints?.some(t => t.area === '搜索')) {
        await mergeArea(tx, pageName, '搜索');
        for (const f of page.searchFields) {
          await mergeField(tx, pageName, '搜索', f.label, f.type, f.required, f.options || []);
        }
        // 搜索的测试点
        for (const tp of page.testPoints.filter(t => t.area === '搜索')) {
          await mergeTestCase(tx, pageName, '搜索', tp);
        }
      }

      // ====== Area: 按钮 ======
      if (page.actionButtons?.length > 0) {
        await mergeArea(tx, pageName, '按钮');
        for (const btn of page.actionButtons) {
          await mergeButton(tx, pageName, '按钮', btn);
        }
        for (const tp of page.testPoints.filter(t => t.area === '按钮')) {
          await mergeTestCase(tx, pageName, '按钮', tp);
        }
      }

      // ====== Area: 表单 ======
      if (page.createForm?.length > 0 || page.testPoints?.some(t => t.area === '表单')) {
        await mergeArea(tx, pageName, '表单');
        for (const f of page.createForm || []) {
          await mergeField(tx, pageName, '表单', f.label, f.type, f.required, f.options || []);
        }
        for (const tp of page.testPoints.filter(t => t.area === '表单')) {
          await mergeTestCase(tx, pageName, '表单', tp);
        }
      }
    }
  });

  console.log('✅ scan-result.json 迁移完成');

  // ====== CoDesign 提取数据 ======
  if (fs.existsSync(CODESIGN_TP)) {
    const codesign = JSON.parse(fs.readFileSync(CODESIGN_TP, 'utf8'));
    const pageName = codesign.pageName;
    
    await neo4j.runInTransaction(async (tx) => {
      // Ensure page exists
      await tx.run(`MERGE (p:Page {name: $name}) SET p.source = 'codesign'`, { name: pageName });

      for (const tp of codesign.testPoints) {
        const area = tp.area || '表单';
        await mergeArea(tx, pageName, area);
        
        if (area === '按钮') {
          await mergeButton(tx, pageName, area, tp.field);
        } else {
          await mergeField(tx, pageName, area, tp.field, tp.type === '下拉选项' ? 'select' : 'text', tp.type === '必填校验', []);
        }
        await mergeTestCase(tx, pageName, area, tp);
      }
    });
    console.log('✅ CoDesign 数据迁移完成');
  }

  // 统计
  const stats = await neo4j.runQuery(`
    MATCH (n) RETURN labels(n)[0] as type, count(n) as cnt ORDER BY cnt DESC
  `);
  console.log('\n📊 图谱统计:');
  stats.records.forEach(r => console.log(`  ${r.get('type')}: ${r.get('cnt')}`));
  
  const tree = await neo4j.runQuery(`
    MATCH (p:Page)-[:HAS_AREA]->(a:Area)
    OPTIONAL MATCH (a)-[:HAS_FIELD]->(f)
    OPTIONAL MATCH (a)-[:HAS_BUTTON]->(b)
    OPTIONAL MATCH (f)-[:HAS_TESTCASE]->(tc)
    RETURN p.name as page, a.name as area, 
           count(DISTINCT f) as fields, count(DISTINCT b) as buttons,
           count(DISTINCT tc) as cases
    ORDER BY page, area
  `);
  console.log('\n📋 页面-区域概览:');
  tree.records.forEach(r => {
    console.log(`  ${r.get('page')} | ${r.get('area')}: ${r.get('fields')}字段 ${r.get('buttons')}按钮 ${r.get('cases')}用例`);
  });

  await neo4j.close();
}

async function mergeArea(tx, pageName, areaName) {
  await tx.run(`
    MATCH (p:Page {name: $pageName})
    MERGE (a:Area {id: $pageName + '::' + $areaName})
    SET a.name = $areaName, a.pageName = $pageName
    MERGE (p)-[:HAS_AREA]->(a)
  `, { pageName, areaName });
}

async function mergeField(tx, pageName, areaName, label, type, required, options) {
  if (!label) return;
  const fieldId = `${pageName}::${areaName}::${label}`;
  await tx.run(`
    MERGE (f:Field {id: $fieldId})
    SET f.label = $label, f.type = $type, f.required = $required, f.options = $options
  `, { fieldId, label, type, required: !!required, options: JSON.stringify(options) });
  await tx.run(`
    MATCH (a:Area {id: $pageName + '::' + $areaName})
    MATCH (f:Field {id: $fieldId})
    MERGE (a)-[:HAS_FIELD]->(f)
  `, { pageName, areaName, fieldId });
}

async function mergeButton(tx, pageName, areaName, btnName) {
  if (!btnName) return;
  const btnId = `${pageName}::${areaName}::${btnName}`;
  await tx.run(`
    MERGE (b:Button {id: $btnId})
    SET b.name = $btnName
  `, { btnId, btnName });
  await tx.run(`
    MATCH (a:Area {id: $pageName + '::' + $areaName})
    MATCH (b:Button {id: $btnId})
    MERGE (a)-[:HAS_BUTTON]->(b)
  `, { pageName, areaName, btnId });
}

async function mergeTestCase(tx, pageName, areaName, tp) {
  const parentId = tp.area === '按钮' 
    ? `${pageName}::${areaName}::${tp.field}`
    : `${pageName}::${areaName}::${tp.field}`;
  const tcId = `${parentId}::${tp.type || 'default'}`;
  const stepsJson = JSON.stringify(tp.steps || []);
  
  await tx.run(`
    MERGE (tc:TestCase {id: $tcId})
    SET tc.type = $type, tc.field = $field, tc.mode = $mode,
        tc.precondition = $pre, tc.steps = $steps, tc.expected = $expected,
        tc.testData = $data, tc.note = $note
  `, {
    tcId, type: tp.type || '', field: tp.field || '', mode: tp.mode || '',
    pre: tp.precondition || '', steps: stepsJson, expected: tp.expected || '',
    data: tp.testData || '', note: tp.note || '',
  });

  // Link to parent (Field or Button)
  if (tp.area === '按钮') {
    const btnId = `${pageName}::${areaName}::${tp.field}`;
    await tx.run(`
      MATCH (b:Button {id: $btnId})
      MATCH (tc:TestCase {id: $tcId})
      MERGE (b)-[:HAS_TESTCASE]->(tc)
    `, { btnId, tcId });
  } else {
    const fieldId = `${pageName}::${areaName}::${tp.field}`;
    await tx.run(`
      MATCH (f:Field {id: $fieldId})
      MATCH (tc:TestCase {id: $tcId})
      MERGE (f)-[:HAS_TESTCASE]->(tc)
    `, { fieldId, tcId });
  }
}

run().catch(console.error);
