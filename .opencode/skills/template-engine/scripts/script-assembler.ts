/**
 * script-assembler.ts
 *
 * 脚本组装引擎。
 * 根据匹配到的模板 + 标签化测试用例，组装生成完整的可执行 .spec.ts 文件。
 *
 * 核心逻辑：
 *   1. 从页面模板中提取导航代码和元素选择器
 *   2. 从操作模板中提取操作步骤序列
 *   3. 注入测试数据（替换模板中的占位符）
 *   4. 追加断言代码
 *   5. 组装为完整的 .spec.ts
 *
 * 用法：
 *   npx tsx .opencode/skills/template-engine/scripts/script-assembler.ts
 *
 *   或作为模块导入：
 *   import { assembleScript } from './script-assembler';
 */

import * as fs from 'fs';
import * as path from 'path';
import { MatchResult, matchTemplate, BatchMatchInput, batchMatch } from './template-matcher';

// ─── 数据类型 ─────────────────────────────────────────────────────────────────

export interface TestCaseInput {
  caseName: string;                 // 用例名称
  targetPage: string;               // 目标页面
  operationType: string;            // 操作类型
  steps: TestStep[];                // 标签化步骤
  testData?: Record<string, string>;
  assertions?: Assertion[];
  outputDir?: string;               // 输出目录，默认 test_pool/
}

export interface TestStep {
  action: '导航' | '输入' | '点击' | '等待' | '断言' | '双击' | '按键';
  target: string;                   // 目标描述，如"查询按钮"、"单据号输入框"
  value?: string;                   // 输入值
  options?: Record<string, string>; // 附加选项
}

export interface Assertion {
  type: 'count' | 'text' | 'visible' | 'url' | 'custom';
  target?: string;
  expected?: string;
  description?: string;
}

export interface AssemblyResult {
  success: boolean;
  specContent?: string;
  specPath?: string;
  error?: string;
  templateInfo?: {
    pageTemplate: string;
    operationTemplate: string;
    matchConfidence: number;
  };
}

// ─── 页面模板解析 ─────────────────────────────────────────────────────────────

interface PageElementMap {
  page: string;
  url?: string;
  elements: {
    navigation?: string[];
    buttons: Record<string, { primary: string; fallbacks: string[] }>;
    inputs: Record<string, { primary: string; fallbacks: string[] }>;
    waits: string[];
  };
}

function loadPageTemplate(templatePath: string): PageElementMap | null {
  if (!fs.existsSync(templatePath)) return null;

  const content = fs.readFileSync(templatePath, 'utf8');
  const elements: PageElementMap = {
    page: '',
    elements: { buttons: {}, inputs: {}, waits: [] },
  };

  const lines = content.split('\n');
  let currentSection = '';
  let currentKey = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.match(/^页面:/)) {
      elements.page = trimmed.replace(/.*页面:\s*"?(.*?)"?$/, '$1');
    } else if (trimmed.match(/^URL:/)) {
      elements.url = trimmed.replace(/.*URL:\s*"?(.*?)"?$/, '$1');
    } else if (trimmed.match(/^按钮:/)) {
      currentSection = 'buttons';
    } else if (trimmed.match(/^输入框:/)) {
      currentSection = 'inputs';
    } else if (trimmed.match(/^等待:/)) {
      currentSection = 'waits';
    } else if (trimmed.match(/^导航:/)) {
      currentSection = 'navigation';
    } else if (trimmed.match(/^\s*- primary:/)) {
      const selector = trimmed.replace(/.*primary:\s*"?(.*?)"?$/, '$1');
      if (currentSection === 'buttons' && currentKey) {
        if (!elements.elements.buttons[currentKey]) elements.elements.buttons[currentKey] = { primary: '', fallbacks: [] };
        elements.elements.buttons[currentKey].primary = selector;
      } else if (currentSection === 'inputs' && currentKey) {
        if (!elements.elements.inputs[currentKey]) elements.elements.inputs[currentKey] = { primary: '', fallbacks: [] };
        elements.elements.inputs[currentKey].primary = selector;
      }
    } else if (trimmed.match(/^\s*- fallback(s)?:/)) {
      // skip fallbacks header
    } else if (trimmed.match(/^\s*- 描述:/) || trimmed.match(/^\s*- primary:"/)) {
      // Parse the actual description and primary selector
      const descMatch = trimmed.match(/描述:\s*"?(.*?)"?\s*,?\s*primary:\s*"?(.*?)"?$/);
      if (descMatch) {
        currentKey = descMatch[1];
        const pri = descMatch[2];
        if (currentSection === 'buttons') {
          elements.elements.buttons[currentKey] = { primary: pri, fallbacks: [] };
        } else if (currentSection === 'inputs') {
          elements.elements.inputs[currentKey] = { primary: pri, fallbacks: [] };
        }
      }
    } else if (trimmed.match(/^\s*- "/)) {
      if (currentSection === 'waits') {
        elements.elements.waits.push(trimmed.replace(/^\s*-\s*"?(.*?)"?$/, '$1'));
      }
    }
  }

  return elements;
}

// ─── 操作模板解析 ─────────────────────────────────────────────────────────────

function loadOperationTemplate(templatePath: string): string[] | null {
  if (!fs.existsSync(templatePath)) return null;

  const content = fs.readFileSync(templatePath, 'utf8');
  const lines = content.split('\n');
  const stepCodes: string[] = [];

  let inSteps = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.match(/^步骤序列:/)) {
      inSteps = true;
      continue;
    }
    if (!inSteps) continue;
    if (trimmed.match(/^\s*- code:/)) {
      const code = trimmed.replace(/.*code:\s*"?(.*?)"?$/, '$1');
      if (code) stepCodes.push(code);
    }
  }

  return stepCodes;
}

// ─── 主组装函数 ───────────────────────────────────────────────────────────────

export function assembleScript(input: TestCaseInput): AssemblyResult {
  // 1. 匹配模板
  const match = matchTemplate({
    targetPage: input.targetPage,
    operationType: input.operationType,
    testData: input.testData,
    assertions: input.assertions?.map(a => a.description || '验证通过'),
  });

  if (!match.matched) {
    return {
      success: false,
      error: `未找到匹配模板：${input.targetPage} / ${input.operationType}`,
    };
  }

  // 2. 加载页面模板
  const templateDir = path.resolve(__dirname, '../template-library');
  const pageTemplatePath = path.join(templateDir, match.pageTemplate!);
  const opTemplatePath = path.join(templateDir, match.operationTemplate!);

  const pageMap = loadPageTemplate(pageTemplatePath);
  const stepCodes = loadOperationTemplate(opTemplatePath);

  // 3. 从步骤序列生成代码
  const generatedLines: string[] = [];

  // 页面 URL 注释
  if (pageMap?.url) {
    generatedLines.push(`  // 目标页面：${pageMap.url}`);
    generatedLines.push('');
  }

  // 遍历输入步骤，逐一生成代码
  for (const step of input.steps) {
    switch (step.action) {
      case '导航':
        generatedLines.push(`  // 导航：${step.target}`);
        // 使用导航代码（如果有）
        const navCode = matchPageElement(pageMap, step.target, 'buttons');
        if (navCode) {
          generatedLines.push(`  ${buildRobustClick(navCode.primary, navCode.fallbacks)}`);
        } else {
          generatedLines.push(`  // TODO: 需要手动补充导航路径 → ${step.target}`);
        }
        generatedLines.push('');
        break;

      case '点击':
        generatedLines.push(`  // 点击：${step.target}`);
        const clickSelector = matchPageElement(pageMap, step.target, 'buttons');
        if (clickSelector) {
          generatedLines.push(`  ${buildRobustClick(clickSelector.primary, clickSelector.fallbacks)}`);
        } else {
          generatedLines.push(`  await page.click('button:has-text("${step.target}")');`);
        }
        generatedLines.push('');
        break;

      case '输入':
        generatedLines.push(`  // 输入：${step.target} ← "${step.value}"`);
        const inputSelector = matchPageElement(pageMap, step.target, 'inputs');
        if (inputSelector) {
          generatedLines.push(`  ${buildRobustFill(inputSelector.primary, inputSelector.fallbacks, step.value || '')}`);
        } else {
          generatedLines.push(`  await page.fill('input:has-text("${step.target}")', '${step.value || ''}');`);
        }
        generatedLines.push('');
        break;

      case '等待':
        generatedLines.push(`  // 等待：${step.target}`);
        if (step.target.includes('API') || step.target.includes('api') || step.target.includes('/api/')) {
          const urlPattern = step.target.match(/\/api\/[\w/-]+/)?.[0] || '**/api/**';
          generatedLines.push(`  await page.waitForResponse(r => r.url().includes('${urlPattern}'));`);
        } else if (step.target.includes('URL')) {
          const url = step.value || '**';
          generatedLines.push(`  await page.waitForURL('${url}', { timeout: ${step.options?.timeout || 10000} });`);
        } else {
          generatedLines.push(`  await page.waitForLoadState('networkidle');`);
        }
        generatedLines.push('');
        break;

      case '双击':
        generatedLines.push(`  // 双击：${step.target}`);
        const dblSelector = matchPageElement(pageMap, step.target, 'buttons');
        if (dblSelector) {
          generatedLines.push(`  ${buildRobustDblClick(dblSelector.primary, dblSelector.fallbacks)}`);
        }
        generatedLines.push('');
        break;

      case '按键':
        generatedLines.push(`  // 按键：${step.target}`);
        if (step.value) {
          const keySelector = matchPageElement(pageMap, step.target, 'inputs');
          if (keySelector) {
            generatedLines.push(`  await page.press('${keySelector.primary}', '${step.value}');`);
          } else {
            generatedLines.push(`  await page.keyboard.press('${step.value}');`);
          }
        }
        generatedLines.push('');
        break;

      case '断言':
        generatedLines.push(`  // 断言：${step.target}`);
        break;
    }
  }

  // 4. 添加断言
  if (input.assertions && input.assertions.length > 0) {
    generatedLines.push(`  // ↓ 断言验证`);
    for (const a of input.assertions) {
      switch (a.type) {
        case 'count':
          generatedLines.push(`  const rows = await page.locator('tbody tr').count();`);
          generatedLines.push(`  expect(rows, '${a.description || '验证行数'}').toBeGreaterThan(${a.expected ? parseInt(a.expected) - 1 : 0});`);
          break;
        case 'visible':
          generatedLines.push(`  await expect(page.locator('text=${a.target}')).toBeVisible();`);
          break;
        case 'url':
          generatedLines.push(`  await expect(page).toHaveURL(/${a.expected || '.*'}/);`);
          break;
        case 'text':
          generatedLines.push(`  await expect(page.locator('body')).toContainText('${a.expected || ''}');`);
          break;
        default:
          if (a.description) {
            generatedLines.push(`  // await expect... ${a.description}`);
          }
      }
      generatedLines.push('');
    }
  }

  // 5. 构建完整 .spec.ts 文件
  const specContent = buildSpecFile(input.caseName, input, generatedLines, match);

  // 6. 写入文件
  const outputDir = input.outputDir || path.resolve(process.cwd(), 'test_pool');
  const specFileName = `test${sanitizeFileName(input.caseName)}.spec.ts`;
  const specPath = path.join(outputDir, specFileName);

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(specPath, specContent, 'utf8');

  console.log(`\n[assembler] ✓ 生成脚本：${specPath}`);
  console.log(`[assembler] 模板匹配：${match.matchStrategy} (${match.confidence}%)`);

  return {
    success: true,
    specContent,
    specPath,
    templateInfo: {
      pageTemplate: match.pageTemplate!,
      operationTemplate: match.operationTemplate!,
      matchConfidence: match.confidence,
    },
  };
}

// ─── 构建 .spec.ts 文件内容 ───────────────────────────────────────────────────

function buildSpecFile(
  caseName: string,
  input: TestCaseInput,
  generatedLines: string[],
  match: MatchResult,
): string {
  const lines: string[] = [];

  lines.push(`/**`);
  lines.push(` * ${sanitizeFileName(caseName)}.spec.ts`);
  lines.push(` *`);
  lines.push(` * 自动生成于：${new Date().toISOString()}`);
  lines.push(` * 目标页面：${input.targetPage}`);
  lines.push(` * 操作类型：${input.operationType}`);
  lines.push(` * 模板来源：${match.pageTemplate} / ${match.operationTemplate}`);
  lines.push(` * 生成工具：template-engine/script-assembler`);
  lines.push(` */`);
  lines.push('');
  lines.push(`import { test, expect } from '@fixture/auth-fixture';`);
  lines.push('');

  // 测试数据常量
  if (input.testData) {
    for (const [key, value] of Object.entries(input.testData)) {
      const constName = key.toUpperCase().replace(/\s+/g, '_');
      lines.push(`const ${constName} = '${value}';`);
    }
    lines.push('');
  }

  // 测试函数
  lines.push(`test('${caseName}', async ({ page }) => {`);
  lines.push(`  console.log(\`[test] 当前页面 URL：\${page.url()}\`);`);
  lines.push('');

  // 步骤代码
  for (const l of generatedLines) {
    lines.push(l);
  }

  lines.push(`  console.log('[pass] 测试通过');`);
  lines.push(`});`);
  lines.push('');

  return lines.join('\n');
}

// ─── 辅助函数 ─────────────────────────────────────────────────────────────────

function sanitizeFileName(name: string): string {
  return name.replace(/[<>:"/\\|?*]/g, '').replace(/\s+/g, '-').slice(0, 50);
}

function matchPageElement(
  pageMap: PageElementMap | null,
  target: string,
  type: 'buttons' | 'inputs',
): { primary: string; fallbacks: string[] } | null {
  if (!pageMap) return null;

  const elements = type === 'buttons' ? pageMap.elements.buttons : pageMap.elements.inputs;

  // 精确匹配
  if (elements[target]) return elements[target];

  // 包含匹配
  for (const [key, value] of Object.entries(elements)) {
    if (key.includes(target) || target.includes(key)) {
      return value;
    }
  }

  return null;
}

function buildRobustClick(primary: string, fallbacks: string[]): string {
  if (fallbacks.length === 0) return `await page.click('${primary}');`;
  let code = `try {\n      await page.click('${primary}', { timeout: 3000 });`;
  for (const fb of fallbacks) {
    code += `\n    } catch {\n      try {\n        await page.click('${fb}', { timeout: 3000 });`;
  }
  for (let i = 0; i < fallbacks.length; i++) {
    code += '\n      }';
  }
  code += '\n    }';
  return code;
}

function buildRobustFill(primary: string, fallbacks: string[], value: string): string {
  if (fallbacks.length === 0) return `await page.fill('${primary}', '${value}');`;
  let code = `try {\n      await page.fill('${primary}', '${value}', { timeout: 3000 });`;
  for (const fb of fallbacks) {
    code += `\n    } catch {\n      try {\n        await page.fill('${fb}', '${value}', { timeout: 3000 });`;
  }
  for (let i = 0; i < fallbacks.length; i++) {
    code += '\n      }';
  }
  code += '\n    }';
  return code;
}

function buildRobustDblClick(primary: string, fallbacks: string[]): string {
  if (fallbacks.length === 0) return `await page.dblclick('${primary}');`;
  let code = `try {\n      await page.dblclick('${primary}', { timeout: 3000 });`;
  for (const fb of fallbacks) {
    code += `\n    } catch {\n      try {\n        await page.dblclick('${fb}', { timeout: 3000 });`;
  }
  for (let i = 0; i < fallbacks.length; i++) {
    code += '\n      }';
  }
  code += '\n    }';
  return code;
}

// ─── CLI 入口 ─────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length < 3 && (args.length < 2 || args[0] !== '--file')) {
    console.log('用法: npx tsx script-assembler.ts <caseName> <targetPage> <operationType> [outputDir]');
    console.log('');
    console.log('或读取 JSON 输入文件：');
    console.log('  npx tsx script-assembler.ts --file <input.json>');
    console.log('');
    console.log('JSON 输入格式：');
    console.log(JSON.stringify({
      caseName: '按单据号查看到货单',
      targetPage: '到货单列表',
      operationType: '查询验证',
      steps: [
        { action: '导航', target: '进入到货单页面' },
        { action: '输入', target: '单据号输入框', value: 'DH202604150029' },
        { action: '点击', target: '查询按钮' },
        { action: '等待', target: 'API响应 /api/arrival/list' },
        { action: '断言', target: '结果条数≥1' },
      ],
      testData: { billNo: 'DH202604150029' },
      assertions: [
        { type: 'count', expected: '1', description: '查询结果只有1条' },
        { type: 'text', expected: 'DH202604150029' },
      ],
    }, null, 2));
    process.exit(1);
  }

  let input: TestCaseInput;

  if (args[0] === '--file') {
    const filePath = args[1];
    if (!fs.existsSync(filePath)) {
      console.error(`文件不存在: ${filePath}`);
      process.exit(1);
    }
    input = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } else {
    input = {
      caseName: args[0],
      targetPage: args[1],
      operationType: args[2],
      steps: [],
      outputDir: args[3] || undefined,
    };
  }

  const result = assembleScript(input);

  if (result.success) {
    console.log('\n✓ 脚本生成成功');
    console.log(`  文件：${result.specPath}`);
    console.log(`  模板：${result.templateInfo?.pageTemplate} / ${result.templateInfo?.operationTemplate}`);
  } else {
    console.error(`\n✗ 脚本生成失败: ${result.error}`);
    process.exit(1);
  }
}

if (require.main === module || process.argv[1]?.endsWith('script-assembler.ts') || process.argv[1]?.endsWith('script-assembler.js')) {
  main().catch(err => {
    console.error('[assembler] 错误：', err);
    process.exit(1);
  });
}
