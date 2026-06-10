/**
 * batch-case-generator.ts
 *
 * 批量用例生成器：从 menu-structure.json 读取菜单结构，
 * 为指定页面生成 4 类标签化测试用例（查询/新增/编辑/删除），
 * 组装 .spec.ts 脚本并写入 TAPD。
 *
 * 用法：
 *   npx tsx scripts/batch-case-generator.ts --story-id S-xxx --menu "事务管理-全局,作业环节-公司" [--skip-tapd]
 */

import * as fs from 'fs';
import * as path from 'path';

interface MenuItem {
  category: string;
  name: string;
  level: number;
}

interface TestCaseDef {
  caseId: string;
  caseName: string;
  targetPage: string;
  operationType: '查询验证' | '新增提交' | '编辑修改' | '删除确认';
  storyId: string;
  steps: StepDef[];
  testData: Record<string, string>;
  assertions: AssertionDef[];
  dataTag: string;
}

interface StepDef {
  action: string;
  target: string;
  value?: string;
  options?: Record<string, string>;
}

interface AssertionDef {
  type: string;
  target?: string;
  expected?: string;
  description: string;
}

const OPERATION_TYPES: Array<'查询验证' | '新增提交' | '编辑修改' | '删除确认'> = [
  '查询验证', '新增提交', '编辑修改', '删除确认'
];

const DATA_TAG = 'AUTO_TEST_';

// ── 核心生成逻辑 ─────────────────────────────────────────────────────

function generateCase(
  menuName: string,
  menuCategory: string,
  operationType: '查询验证' | '新增提交' | '编辑修改' | '删除确认',
  storyId: string,
  seq: number
): TestCaseDef {
  const caseId = `TC_S${storyId.replace(/^S-/, '')}_${String(seq).padStart(3, '0')}`;
  const caseName = `${operationType}-${menuName}`;
  const steps = generateSteps(menuName, menuCategory, operationType);
  const testData = generateTestData(menuName, operationType);
  const assertions = generateAssertions(operationType, menuName);

  return {
    caseId,
    caseName,
    targetPage: menuName,
    operationType,
    storyId,
    steps,
    testData,
    assertions,
    dataTag: DATA_TAG,
  };
}

function generateSteps(
  menuName: string,
  menuCategory: string,
  operationType: string
): StepDef[] {
  const navStep: StepDef = {
    action: '导航',
    target: `进入${menuCategory} → ${menuName}`,
  };

  switch (operationType) {
    case '查询验证':
      return [
        navStep,
        { action: '点击', target: '查询按钮' },
        { action: '等待', target: '列表数据加载完成' },
        { action: '断言', target: '查询结果列表可见' },
      ];

    case '新增提交':
      return [
        navStep,
        { action: '点击', target: '新增按钮' },
        { action: '等待', target: '表单/弹窗出现' },
        { action: '输入', target: '名称/编码输入框', value: `${DATA_TAG}测试数据` },
        { action: '点击', target: '保存/提交按钮' },
        { action: '断言', target: '新增成功提示可见' },
      ];

    case '编辑修改':
      return [
        navStep,
        { action: '输入', target: '查询条件输入框', value: `${DATA_TAG}` },
        { action: '点击', target: '查询按钮' },
        { action: '等待', target: '列表数据加载完成' },
        { action: '双击', target: `${DATA_TAG}前缀的记录行` },
        { action: '输入', target: '修改字段输入框', value: `${DATA_TAG}修改后数据` },
        { action: '点击', target: '保存按钮' },
        { action: '断言', target: '修改成功提示可见' },
      ];

    case '删除确认':
      return [
        navStep,
        { action: '输入', target: '查询条件输入框', value: `${DATA_TAG}` },
        { action: '点击', target: '查询按钮' },
        { action: '等待', target: '列表数据加载完成' },
        { action: '点击', target: `${DATA_TAG}前缀的记录行（选中）` },
        { action: '点击', target: '删除按钮' },
        { action: '点击', target: '确定/确认按钮' },
        { action: '断言', target: '删除成功提示可见' },
      ];

    default:
      return [navStep];
  }
}

function generateTestData(menuName: string, operationType: string): Record<string, string> {
  if (operationType === '查询验证') return {};

  const timestamp = Date.now();
  return {
    data_tag: DATA_TAG,
    test_id: `${DATA_TAG}${timestamp}`,
    test_name: `${DATA_TAG}${menuName}测试数据_${timestamp}`,
  };
}

function generateAssertions(operationType: string, menuName: string): AssertionDef[] {
  switch (operationType) {
    case '查询验证':
      return [
        { type: 'visible', target: '.surely-table, .ant-table', description: `${menuName}列表可见` },
      ];
    case '新增提交':
      return [
        { type: 'visible', target: '.ant-message-success, .ant-notification-success', description: '新增成功提示' },
      ];
    case '编辑修改':
      return [
        { type: 'visible', target: '.ant-message-success, .ant-notification-success', description: '修改成功提示' },
      ];
    case '删除确认':
      return [
        { type: 'visible', target: '.ant-message-success, .ant-notification-success', description: '删除成功提示' },
      ];
    default:
      return [];
  }
}

// ── .spec.ts 生成 ─────────────────────────────────────────────────────

function generateSpecFile(caseDef: TestCaseDef): string {
  const lines: string[] = [];

  lines.push(`/**`);
  lines.push(` * ${caseDef.caseName}.spec.ts`);
  lines.push(` *`);
  lines.push(` * story_id: ${caseDef.storyId}`);
  lines.push(` * targetPage: ${caseDef.targetPage}`);
  lines.push(` * operationType: ${caseDef.operationType}`);
  lines.push(` * dataTag: ${caseDef.dataTag}`);
  lines.push(` * generated: ${new Date().toISOString()}`);
  lines.push(` * generatedBy: batch-case-generator`);
  lines.push(` */`);
  lines.push('');
  lines.push(`import { test, expect } from '@fixture/auth-fixture';`);
  lines.push('');

  // 数据标记常量
  lines.push(`const DATA_TAG = '${DATA_TAG}';`);
  lines.push(`const TEST_ID = \`\${DATA_TAG}\${Date.now()}\`;`);
  lines.push('');

  lines.push(`test('${caseDef.caseName}', async ({ page }) => {`);
  lines.push(`  console.log(\`[test] 当前页面 URL：\${page.url()}\`);`);
  lines.push('');

  for (const step of caseDef.steps) {
    lines.push(`  // [${step.action}] ${step.target}`);
    if (step.value) {
      lines.push(`  // 数据标记: 使用 ${DATA_TAG} 前缀`);
    }

    switch (step.action) {
      case '导航':
        lines.push(`  // ${step.target}`);
        lines.push(`  // TODO: 用录制器录制精确导航路径后替换`);
        lines.push('');
        break;

      case '点击':
        lines.push(`  // TODO: 替换为精确选择器 - ${step.target}`);
        lines.push('');
        break;

      case '输入':
        if (step.value?.includes(DATA_TAG)) {
          lines.push(`  // TODO: 替换为精确选择器 - ${step.target}`);
          lines.push(`  // await page.fill('SELECTOR', TEST_ID);`);
        } else {
          lines.push(`  // TODO: 替换为精确选择器 - ${step.target}`);
          lines.push(`  // await page.fill('SELECTOR', '${step.value}');`);
        }
        lines.push('');
        break;

      case '双击':
        lines.push(`  // TODO: 替换为精确选择器 - ${step.target}`);
        lines.push('');
        break;

      case '等待':
        lines.push(`  await page.waitForTimeout(2000);`);
        lines.push('');
        break;

      case '断言':
        lines.push(`  // ${step.description}`);
        lines.push(`  // TODO: 添加精确断言`);
        lines.push('');
        break;
    }
  }

  // 数据清理（新增/编辑/删除以外的操作不清理）
  if (caseDef.operationType === '新增提交' || caseDef.operationType === '编辑修改') {
    lines.push(`  // ── 数据清理 ──`);
    lines.push(`  // TODO: 清理 ${DATA_TAG} 前缀的测试数据`);
    lines.push('');
  }

  lines.push(`  console.log('[pass] 测试通过');`);
  lines.push(`});`);
  lines.push('');

  return lines.join('\n');
}

// ── 主入口 ─────────────────────────────────────────────────────────────

function main(): void {
  const args = process.argv.slice(2);
  let storyId = '';
  let menuFilter = '';
  let skipTapd = false;
  let outputDir = 'test_pool';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--story-id' && args[i + 1]) { storyId = args[++i]; }
    if (args[i] === '--menu' && args[i + 1]) { menuFilter = args[++i]; }
    if (args[i] === '--skip-tapd') { skipTapd = true; }
    if (args[i] === '--output-dir' && args[i + 1]) { outputDir = args[++i]; }
  }

  if (!storyId) {
    console.error('用法: npx tsx batch-case-generator.ts --story-id S-xxx --menu "页面1,页面2" [--skip-tapd] [--output-dir test_pool]');
    process.exit(1);
  }

  // 读取菜单结构
  const menuPath = path.resolve(__dirname, '../../dom-recorder/test_record');
  const sessionDirs = fs.readdirSync(menuPath).filter(d => {
    const p = path.join(menuPath, d, 'menu-structure.json');
    return fs.existsSync(p);
  }).sort();

  if (sessionDirs.length === 0) {
    console.error('未找到 menu-structure.json，请先运行 dom-recorder 扫描菜单');
    process.exit(1);
  }

  const latestSession = sessionDirs[sessionDirs.length - 1];
  const menuFile = path.join(menuPath, latestSession, 'menu-structure.json');
  const menuItems: MenuItem[] = JSON.parse(fs.readFileSync(menuFile, 'utf8'));
  console.log(`[generator] 读取菜单结构：${menuItems.length} 个菜单项（来源：${latestSession}）`);

  // 过滤目标菜单（按 name 去重）
  let targetMenus: MenuItem[];
  if (menuFilter) {
    const filterList = menuFilter.split(',').map(s => s.trim());
    const uniqueNames = new Set<string>();
    targetMenus = menuItems.filter(m => {
      if (uniqueNames.has(m.name)) return false;
      const match = filterList.some(f =>
        m.name.includes(f) || m.category.includes(f)
      );
      if (match) uniqueNames.add(m.name);
      return match;
    });
  } else {
    const uniqueNames = new Set<string>();
    targetMenus = menuItems.filter(m => {
      if (uniqueNames.has(m.name)) return false;
      uniqueNames.add(m.name);
      return true;
    });
  }

  console.log(`[generator] 目标菜单：${targetMenus.length} 个`);
  targetMenus.forEach(m => console.log(`  - [${m.category}] ${m.name}`));

  // 生成用例
  const allCases: TestCaseDef[] = [];
  let seq = 1;

  for (const menu of targetMenus) {
    for (const opType of OPERATION_TYPES) {
      const caseDef = generateCase(menu.name, menu.category, opType, storyId, seq++);
      allCases.push(caseDef);
    }
  }

  console.log(`\n[generator] 生成 ${allCases.length} 条测试用例：`);
  allCases.forEach(c => {
    console.log(`  ${c.caseId}: ${c.caseName} (${c.operationType}) → ${c.targetPage}`);
  });

  // 生成 .spec.ts 文件
  const poolDir = path.resolve(outputDir);
  fs.mkdirSync(poolDir, { recursive: true });

  for (const caseDef of allCases) {
    const dirName = caseDef.targetPage.replace(/[<>:"/\\|?*]/g, '_');
    const caseDir = path.join(poolDir, dirName);
    fs.mkdirSync(caseDir, { recursive: true });

    const specContent = generateSpecFile(caseDef);
    const specFile = path.join(caseDir, `${caseDef.caseId}_${caseDef.operationType}.spec.ts`);
    fs.writeFileSync(specFile, specContent, 'utf8');
    console.log(`  ✓ ${specFile}`);
  }

  // 输出用例摘要 JSON
  const summaryFile = path.join(poolDir, `cases-${storyId.replace(/^S-/, '')}.json`);
  fs.writeFileSync(summaryFile, JSON.stringify(allCases, null, 2), 'utf8');
  console.log(`\n[generator] 用例摘要已保存: ${summaryFile}`);
  console.log(`[generator] 共 ${allCases.length} 条用例，输出到 ${poolDir}`);

  // TAPD 提示
  if (!skipTapd) {
    console.log(`\n[generator] ── 下一步：写入 TAPD ──`);
    console.log(`请使用 tapd-gen 将用例写入 TAPD：`);
    allCases.forEach(c => {
      console.log(`  ${c.caseId}: ${c.caseName}`);
    });
  }
}

main();