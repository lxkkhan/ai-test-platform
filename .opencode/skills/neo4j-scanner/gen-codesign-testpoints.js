const neo4j = require('./scripts/neo4j-client');
const fs = require('fs');
const path = require('path');

const extracted = JSON.parse(fs.readFileSync('E:/006Skills/.opencode/skills/codesign_data/extracted.json', 'utf8'));
const PAGE_NAME = extracted.pageName;
const ANNOTATIONS = extracted.annotations;

// ===== 生成测试点 =====
const testPoints = [];

// 区域一：按钮测试点
ANNOTATIONS.filter(a => !a.label.includes('文本框') && !a.label.includes('表体')).forEach(a => {
  const label = a.label;
  const note = a.plainText;
  
  if (label === '新增') {
    testPoints.push({
      area: '按钮', type: '操作验证', field: '新增', mode: '新增',
      precondition: `进入【${PAGE_NAME}】页面`,
      steps: ['点击【新增】按钮'],
      expected: '进入新增状态，新增/修改/删除按钮隐藏，显示保存/取消/关联NC按钮',
      note,
    });
  }
  if (label === '修改') {
    testPoints.push({
      area: '按钮', type: '操作验证', field: '修改', mode: '修改',
      precondition: `进入【${PAGE_NAME}】页面，左侧树选中一条数据`,
      steps: ['左侧树选中一条数据', '点击【修改】按钮'],
      expected: '进入修改状态，新增/修改/删除按钮隐藏，显示保存/取消/关联NC按钮，数据回填',
      note,
    });
  }
  if (label === '删除') {
    testPoints.push({
      area: '按钮', type: '操作验证', field: '删除', mode: '修改',
      precondition: `进入【${PAGE_NAME}】页面，左侧树选中一条数据`,
      steps: ['左侧树选中一条数据', '点击【删除】按钮', '弹窗点【是】确认删除'],
      expected: '弹出确认框，点是则删除，点否则取消',
      note,
    });
  }
  if (label === '保存') {
    testPoints.push({
      area: '按钮', type: '操作验证', field: '保存', mode: '新增',
      precondition: `进入【${PAGE_NAME}】页面，点击新增进入编辑状态`,
      steps: ['填写所有必填字段', '点击【保存】按钮'],
      expected: '保存成功',
      note,
    });
  }
  if (label === '取消') {
    testPoints.push({
      area: '按钮', type: '操作验证', field: '取消', mode: '新增',
      precondition: `进入【${PAGE_NAME}】页面，处于新增或修改状态`,
      steps: ['点击【取消】按钮', '弹窗点【是】确认取消'],
      expected: '弹出确认框，是则回到查看状态，否则留在编辑状态',
      note,
    });
  }
  if (label === '关联NC') {
    testPoints.push({
      area: '按钮', type: '操作验证', field: '关联NC', mode: '新增',
      precondition: `进入【${PAGE_NAME}】页面，处于新增或修改状态`,
      steps: ['点击【关联NC】按钮'],
      expected: '弹出NC客户选择列表，选择后返回NCPK和NC编号',
      note,
    });
  }
  if (label === '查询') {
    testPoints.push({
      area: '按钮', type: '操作验证', field: '查询', mode: '查询',
      precondition: `进入【${PAGE_NAME}】页面`,
      steps: ['点击【查询】按钮'],
      expected: '仅查询分配给指定26个销售组织的客户数据',
      note,
    });
  }
  if (label === '查看修改记录') {
    testPoints.push({
      area: '按钮', type: '操作验证', field: '查看修改记录', mode: '查询',
      precondition: `进入【${PAGE_NAME}】页面，选中一条客户数据`,
      steps: ['选中一条客户数据', '点击【查看修改记录】按钮'],
      expected: '弹出修改记录弹窗，显示当前客户的修改历史',
      note,
    });
  }
  if (label === '默认值') {
    testPoints.push({
      area: '表单', type: '必填校验', field: '默认值', mode: '新增',
      precondition: `进入【${PAGE_NAME}】页面，点击新增`,
      steps: ['【默认值】留空不填写', '其他字段填正常值', '点击【保存】'],
      expected: '"默认值"为必填项（是/否）',
      note,
    });
  }
  if (label === '使用标志') {
    testPoints.push({
      area: '表单', type: '下拉选项', field: '使用标志', mode: '新增',
      precondition: `进入【${PAGE_NAME}】页面，点击新增`,
      steps: ['【使用标志】下拉选择', '查看默认值'],
      expected: '下拉选项：使用、停用，默认选中"使用"',
      note,
    });
  }
  if (label === '* 银行联行号') {
    testPoints.push({
      area: '表单', type: '必填校验', field: '银行联行号', mode: '新增',
      precondition: `进入【${PAGE_NAME}】页面，点击新增`,
      steps: ['【银行联行号】留空', '其他字段填正常值', '点击【保存】'],
      expected: '提示"银行联行号为必填项"',
      note,
    });
  }
  if (label === '所属公司') {
    testPoints.push({
      area: '表单', type: '参照选择', field: '所属公司', mode: '新增',
      precondition: `进入【${PAGE_NAME}】页面，点击新增`,
      steps: ['点击【所属公司】的参照按钮'],
      expected: '从客户管理（内部公司）弹出选择',
      note,
    });
  }
  if (label === '213582215810001') {
    testPoints.push({
      area: '表单', type: '必填校验', field: '银行账号', mode: '新增',
      precondition: `进入【${PAGE_NAME}】页面，点击新增`,
      steps: ['银行账号留空', '其他字段填正常值', '点击【保存】'],
      expected: '提示银行账号为必填项',
      note,
    });
  }
  if (label === '招商银行股份有限公司上海延西支行') {
    testPoints.push({
      area: '表单', type: '必填校验', field: '开户银行', mode: '新增',
      precondition: `进入【${PAGE_NAME}】页面，点击新增`,
      steps: ['开户银行留空', '其他字段填正常值', '点击【保存】'],
      expected: '提示开户银行为必填项，且为只读',
      note,
    });
  }
  if (label === '表体一名称') {
    testPoints.push({
      area: '表单', type: '子表数据', field: '子表（物资）', mode: '新增',
      precondition: `进入【${PAGE_NAME}】页面，点击新增`,
      steps: ['查看子表数据来源', '核对数据范围'],
      expected: '子表数据=【公司下所有配送中心】+【默认调剂货位】，仅当前物料档案',
      note,
    });
  }
});

// 文本框测试点 - 按注释特征分类
const textboxAnnotations = ANNOTATIONS.filter(a => a.label === '(文本框)');
const requiredTexts = textboxAnnotations.filter(a => a.plainText.includes('必填'));
const refTexts = textboxAnnotations.filter(a => a.plainText.includes('从') && a.plainText.includes('选择'));
const readonlyTexts = textboxAnnotations.filter(a => a.plainText.includes('只读'));
const dropdownTexts = textboxAnnotations.filter(a => a.plainText.includes('下拉'));
const defaultTexts = textboxAnnotations.filter(a => a.plainText.includes('默认'));

// 必填文本框 - 必填校验
requiredTexts.forEach((a, i) => {
  const desc = a.plainText;
  testPoints.push({
    area: '表单', type: '必填校验', field: `文本框#${i+1}(必填)`, mode: '新增',
    precondition: `进入【${PAGE_NAME}】页面，点击新增`,
    steps: [`【文本框#${i+1}】留空不填写`, '其他字段填正常值', '点击【保存】'],
    expected: '提示该字段为必填项',
    note: desc,
  });
});

// 参照文本框 - 弹窗选择
refTexts.forEach((a, i) => {
  testPoints.push({
    area: '表单', type: '参照选择', field: `文本框#${i+1}(参照)`, mode: '新增',
    precondition: `进入【${PAGE_NAME}】页面，点击新增`,
    steps: [`点击【文本框#${i+1}】的参照/选择按钮`],
    expected: a.plainText,
    note: a.plainText,
  });
});

// 下拉文本框 - 遍历选项
dropdownTexts.forEach((a, i) => {
  const val = a.plainText.includes('：') ? a.plainText.split('：')[1] : a.plainText;
  testPoints.push({
    area: '表单', type: '下拉选项', field: `文本框#${i+1}(下拉)`, mode: '新增',
    precondition: `进入【${PAGE_NAME}】页面，点击新增`,
    steps: [`展开【文本框#${i+1}】下拉选项`],
    expected: `选项内容：${val}`,
    note: a.plainText,
  });
});

// 只读字段校验
readonlyTexts.forEach((a, i) => {
  testPoints.push({
    area: '表单', type: '只读校验', field: `文本框#${i+1}(只读)`, mode: '新增',
    precondition: `进入【${PAGE_NAME}】页面，点击新增`,
    steps: [`尝试编辑【文本框#${i+1}】`],
    expected: '该字段为只读，不可编辑',
    note: a.plainText,
  });
});

// 编码自动生成
const codeField = textboxAnnotations.find(a => a.plainText.includes('编码') && a.plainText.includes('自动生成'));
if (codeField) {
  testPoints.push({
    area: '表单', type: '自动生成', field: '编码', mode: '新增',
    precondition: `进入【${PAGE_NAME}】页面，点击新增`,
    steps: ['查看编码字段', '填完其他字段后保存', '再次查看编码字段'],
    expected: '编码唯一、必填、只读、保存时自动生成',
    note: codeField.plainText,
  });
}

// 默认值字段
defaultTexts.forEach((a, i) => {
  testPoints.push({
    area: '表单', type: '默认值校验', field: `文本框#${i+1}(默认值)`, mode: '新增',
    precondition: `进入【${PAGE_NAME}】页面，点击新增`,
    steps: [`查看【文本框#${i+1}】的默认值`],
    expected: a.plainText,
    note: a.plainText,
  });
});

console.log(`共生成 ${testPoints.length} 个结构化测试点`);
console.log('');

// 分组输出
const groups = {};
testPoints.forEach(tp => {
  const key = `${tp.area} | ${tp.type}`;
  if (!groups[key]) groups[key] = [];
  groups[key].push(tp);
});
Object.keys(groups).sort().forEach(key => {
  console.log(`[${key}] ${groups[key].length} 条`);
});

// 保存 JSON
const savePath = 'E:/006Skills/.opencode/skills/codesign_data/test-points.json';
fs.writeFileSync(savePath, JSON.stringify({ pageName: PAGE_NAME, testPoints }, null, 2), 'utf8');

// ===== 写入 Neo4j =====
(async () => {
  try {
    await neo4j.verifyConnect();
    
    // Clear old data for this page
    await neo4j.runQuery(`
      MATCH (p:Page {name: $name})-[:HAS_TESTPOINT]->(t:TestPoint)
      DETACH DELETE t
    `, { name: PAGE_NAME });
    
    // Ensure Page node exists
    await neo4j.runQuery(`
      MERGE (p:Page {name: $name}) SET p.source = 'codesign'
    `, { name: PAGE_NAME });
    
    // Write test points
    let count = 0;
    for (const tp of testPoints) {
      const tpId = `${PAGE_NAME}::${tp.field}::${tp.type}::${tp.area}`;
      const stepsJson = JSON.stringify(tp.steps || []);
      await neo4j.runQuery(`
        MERGE (t:TestPoint {id: $tpId})
        SET t.area = $area, t.type = $type, t.field = $field,
            t.mode = $mode, t.precondition = $precondition,
            t.steps = $steps, t.expected = $expected,
            t.note = $note, t.source = 'codesign'
      `, {
        tpId, area: tp.area, type: tp.type, field: tp.field,
        mode: tp.mode || '', precondition: tp.precondition || '',
        steps: stepsJson, expected: tp.expected || '', note: tp.note || '',
      });
      await neo4j.runQuery(`
        MATCH (p:Page {name: $page})
        MATCH (t:TestPoint {id: $tpId})
        MERGE (p)-[:HAS_TESTPOINT]->(t)
      `, { page: PAGE_NAME, tpId });
      count++;
    }
    
    console.log(`\n✅ 已写入 Neo4j: ${count} 条测试点`);
    
    // 验证
    const verify = await neo4j.runQuery(`
      MATCH (p:Page {name: $name})-[:HAS_TESTPOINT]->(t:TestPoint)
      RETURN t.area as area, t.type as type, count(*) as cnt
      ORDER BY area, cnt DESC
    `, { name: PAGE_NAME });
    console.log('\n📊 Neo4j 验证:');
    verify.records.forEach(r => console.log(`  ${r.get('area')} | ${r.get('type')}: ${r.get('cnt')}`));
    
  } catch (e) {
    console.error('Neo4j 错误:', e.message);
  } finally {
    await neo4j.close();
  }
})();
