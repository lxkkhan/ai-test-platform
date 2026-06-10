/**
 * template-extractor.ts
 *
 * 从录制产出的 manifest.yaml + 用例 .spec.ts 中提取结构化操作模板。
 * 支持增量导入：新录制结果合并到已有模板库。
 *
 * 用法：
 *   npx tsx .opencode/skills/dom-recorder/scripts/template-extractor.ts <sessionDir>
 *
 *   示例：
 *   npx tsx .opencode/skills/dom-recorder/scripts/template-extractor.ts test_record/20260522143015
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml'; // 需要安装 npm i js-yaml

// ─── 数据类型 ─────────────────────────────────────────────────────────────────

interface ManifestEntry {
  caseId: number;
  name: string;
  specFile: string;
  targetPage: string;
  pageURL: string;
  operationType: string;
  boundaryMethod: string;
  stepRange: [number, number];
  testData?: Record<string, string>;
  assertions?: string[];
}

interface TemplateIndexEntry {
  page: string;
  operationType: string;
  pageTemplate: string;
  operationTemplate: string;
  sourceCases: string[];
  recordCount: number;
  lastUpdated: string;
}

interface SelectorConfig {
  primary: string;
  fallbacks: string[];
  description?: string;
}

interface PageTemplate {
  page: string;
  recordCount: number;
  elements: Record<string, Record<string, SelectorConfig>>;
  sourceCases: string[];
  lastUpdated: string;
}

interface OperationTemplate {
  operationType: string;
  recordCount: number;
  steps: string[];       // 操作步骤的 selector 序列
  sourceCases: string[];
  lastUpdated: string;
}

// ─── 主流程 ───────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.log('用法: npx tsx template-extractor.ts <sessionDir>');
    console.log('示例: npx tsx template-extractor.ts test_record/20260522143015');
    process.exit(1);
  }

  const sessionDir = path.resolve(args[0]);
  const manifestPath = path.join(sessionDir, 'manifest.yaml');

  if (!fs.existsSync(manifestPath)) {
    console.error(`manifest.yaml 不存在: ${manifestPath}`);
    process.exit(1);
  }

  // 解析 manifest
  const manifestContent = fs.readFileSync(manifestPath, 'utf8');
  const manifest = parseManifest(manifestContent);
  console.log(`\n[extractor] 读取 manifest：${manifest.length} 个用例`);

  // 模板库目录
  const templatesBaseDir = path.resolve(__dirname, '../../template-engine/template-library');
  if (!fs.existsSync(templatesBaseDir)) {
    fs.mkdirSync(templatesBaseDir, { recursive: true });
  }
  const pagesDir = path.join(templatesBaseDir, 'pages');
  const opsDir = path.join(templatesBaseDir, 'operations');
  fs.mkdirSync(pagesDir, { recursive: true });
  fs.mkdirSync(opsDir, { recursive: true });
  const indexPath = path.join(templatesBaseDir, 'index.yaml');

  // 读取已有索引
  let existingIndex: TemplateIndexEntry[] = [];
  if (fs.existsSync(indexPath)) {
    existingIndex = parseIndex(fs.readFileSync(indexPath, 'utf8'));
  }

  let createdCount = 0;
  let enhancedCount = 0;
  let skippedCount = 0;

  // 逐用例处理
  for (const entry of manifest) {
    const specPath = path.join(sessionDir, entry.specFile);
    if (!fs.existsSync(specPath)) {
      console.log(`  ⚠ 未找到 spec 文件: ${entry.specFile}`);
      continue;
    }

    const specContent = fs.readFileSync(specPath, 'utf8');
    const steps = extractSteps(specContent);

    // 查找已有模板
    const existing = existingIndex.find(e =>
      e.page === entry.targetPage && e.operationType === entry.operationType
    );

    if (existing) {
      // 增强已有模板
      await enhanceTemplate(pagesDir, opsDir, existing, entry, steps);
      existing.recordCount += 1;
      existing.lastUpdated = new Date().toISOString();
      if (!existing.sourceCases.includes(entry.name)) {
        existing.sourceCases.push(entry.name);
      }
      enhancedCount++;
    } else {
      // 创建新模板
      await createTemplate(pagesDir, opsDir, entry, steps);
      existingIndex.push({
        page: entry.targetPage,
        operationType: entry.operationType,
        pageTemplate: `pages/${sanitizeFileName(entry.targetPage)}.yaml`,
        operationTemplate: `operations/${sanitizeFileName(entry.operationType)}.yaml`,
        sourceCases: [entry.name],
        recordCount: 1,
        lastUpdated: new Date().toISOString(),
      });
      createdCount++;
    }
  }

  // 保存索引
  const indexYaml = buildIndexYaml(existingIndex);
  fs.writeFileSync(indexPath, indexYaml, 'utf8');

  console.log('');
  console.log(`[extractor] 完成：创建 ${createdCount} 个模板，增强 ${enhancedCount} 个模板，跳过 ${skippedCount} 个`);
  console.log(`[extractor] 模板库路径：${templatesBaseDir}`);
}

// ─── 解析 manifest ────────────────────────────────────────────────────────────

function parseManifest(content: string): ManifestEntry[] {
  const entries: ManifestEntry[] = [];
  const lines = content.split('\n');
  let current: Partial<ManifestEntry> = {};
  let inTestData = false;

  for (const line of lines) {
    if (line.match(/^\s*-\s*caseId:/)) {
      if (current.caseId) entries.push(current as ManifestEntry);
      current = {};
      inTestData = false;
      current.caseId = parseInt(line.replace(/.*caseId:\s*/, ''));
    } else if (line.match(/^\s*name:/) && current.caseId) {
      current.name = line.replace(/.*name:\s*"?(.*?)"?$/, '$1');
    } else if (line.match(/^\s*specFile:/)) {
      current.specFile = line.replace(/.*specFile:\s*"?(.*?)"?$/, '$1');
    } else if (line.match(/^\s*targetPage:/)) {
      current.targetPage = line.replace(/.*targetPage:\s*"?(.*?)"?$/, '$1');
    } else if (line.match(/^\s*pageURL:/)) {
      current.pageURL = line.replace(/.*pageURL:\s*"?(.*?)"?$/, '$1');
    } else if (line.match(/^\s*operationType:/)) {
      current.operationType = line.replace(/.*operationType:\s*"?(.*?)"?$/, '$1');
    } else if (line.match(/^\s*boundaryMethod:/)) {
      current.boundaryMethod = line.replace(/.*boundaryMethod:\s*"?(.*?)"?$/, '$1');
    } else if (line.match(/^\s*testData:/)) {
      current.testData = {};
      inTestData = true;
    } else if (inTestData && line.match(/^\s+\w+:/)) {
      const [key, val] = line.trim().split(/:\s*"?(.*?)"?$/);
      if (current.testData && key) current.testData[key] = val || '';
    } else if (line.match(/^\s*stepRange:/)) {
      inTestData = false;
    }
  }

  if (current.caseId) entries.push(current as ManifestEntry);
  return entries;
}

// ─── 解析索引 ─────────────────────────────────────────────────────────────────

function parseIndex(content: string): TemplateIndexEntry[] {
  const entries: TemplateIndexEntry[] = [];
  let current: Partial<TemplateIndexEntry> = {};

  for (const line of content.split('\n')) {
    if (line.match(/^\s*-\s*页面:/)) {
      if (current.page) entries.push(current as TemplateIndexEntry);
      current = {};
      current.page = line.replace(/.*页面:\s*"?(.*?)"?$/, '$1');
    } else if (line.match(/^\s*操作类型:/)) {
      current.operationType = line.replace(/.*操作类型:\s*"?(.*?)"?$/, '$1');
    } else if (line.match(/^\s*pageTemplate:/)) {
      current.pageTemplate = line.replace(/.*pageTemplate:\s*"?(.*?)"?$/, '$1');
    } else if (line.match(/^\s*operationTemplate:/)) {
      current.operationTemplate = line.replace(/.*operationTemplate:\s*"?(.*?)"?$/, '$1');
    }
  }

  if (current.page) entries.push(current as TemplateIndexEntry);
  return entries;
}

// ─── 提取步骤选择器 ───────────────────────────────────────────────────────────

function extractSteps(specContent: string): Array<{ selector: string; type: string; code: string }> {
  const steps: Array<{ selector: string; type: string; code: string }> = [];
  const lines = specContent.split('\n');
  let inTryBlock = '';
  let tryCode = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('console.log')) continue;

    // 捕获多行 try/catch/await page.xxx() 块
    if (trimmed.startsWith('try {')) {
      inTryBlock = 'try';
      tryCode = line;
      continue;
    }
    if (inTryBlock) {
      tryCode += '\n' + line;
      if (trimmed === '}') {
        // 从 try 块中提取第一个 page action
        const innerMatch = tryCode.match(/await page\.(\w+)\(/);
        if (innerMatch) {
          const actionType = innerMatch[1];
          if (actionType === 'click') {
            const sel = tryCode.match(/await page\.click\('([^']+)'/);
            steps.push({ selector: sel?.[1] || '', type: 'click', code: tryCode });
          } else if (actionType === 'fill') {
            const match = tryCode.match(/await page\.fill\('([^']+)',\s*'([^']+)'/);
            steps.push({ selector: match?.[1] || '', type: 'input', code: tryCode });
          }
        }
        inTryBlock = '';
        tryCode = '';
      }
      continue;
    }

    // 捕获 catch/关闭花括号
    if (trimmed.startsWith('} catch {')) continue;
    if (trimmed === '}') continue;

    // 单行 page action
    if (trimmed.startsWith('await page.click(')) {
      const selector = trimmed.match(/page\.click\('([^']+)'/) || [];
      steps.push({ selector: selector[1] || '', type: 'click', code: trimmed });
    } else if (trimmed.startsWith('await page.fill(')) {
      const match = trimmed.match(/page\.fill\('([^']+)',\s*'([^']+)'/) || [];
      steps.push({ selector: match[1] || '', type: 'input', code: trimmed });
    } else if (trimmed.startsWith('await page.dblclick(')) {
      const selector = trimmed.match(/page\.dblclick\('([^']+)'/) || [];
      steps.push({ selector: selector[1] || '', type: 'dblclick', code: trimmed });
    } else if (trimmed.startsWith('await page.press(')) {
      const selector = trimmed.match(/page\.press\('([^']+)'/) || [];
      steps.push({ selector: selector[1] || '', type: 'press', code: trimmed });
    } else if (trimmed.startsWith('await page.waitForURL(')) {
      steps.push({ selector: trimmed, type: 'waitURL', code: trimmed });
    } else if (trimmed.startsWith('await page.waitForResponse(')) {
      steps.push({ selector: trimmed, type: 'waitResponse', code: trimmed });
    } else if (trimmed.startsWith('expect(')) {
      steps.push({ selector: '', type: 'assert', code: trimmed });
    }
  }

  return steps;
}

// ─── 创建模板 ─────────────────────────────────────────────────────────────────

async function createTemplate(
  pagesDir: string, opsDir: string,
  entry: ManifestEntry,
  steps: Array<{ selector: string; type: string; code: string }>,
): Promise<void> {
  const pageFileName = path.join(pagesDir, `${sanitizeFileName(entry.targetPage)}.yaml`);
  const opFileName = path.join(opsDir, `${sanitizeFileName(entry.operationType)}.yaml`);

  // 页面模板
  let pageContent = '';
  if (!fs.existsSync(pageFileName)) {
    pageContent = buildPageTemplate(entry, steps);
    fs.writeFileSync(pageFileName, pageContent, 'utf8');
  } else {
    // 增强已有页面模板
    pageContent = fs.readFileSync(pageFileName, 'utf8');
    const enriched = enrichPageTemplate(pageContent, entry, steps);
    fs.writeFileSync(pageFileName, enriched, 'utf8');
  }

  // 操作模板
  const opContent = buildOperationTemplate(entry, steps);
  fs.writeFileSync(opFileName, opContent, 'utf8');

  console.log(`  ✓ 创建: ${entry.targetPage} / ${entry.operationType}`);
}

// ─── 增强模板 ─────────────────────────────────────────────────────────────────

async function enhanceTemplate(
  pagesDir: string, opsDir: string,
  existing: TemplateIndexEntry,
  entry: ManifestEntry,
  steps: Array<{ selector: string; type: string; code: string }>,
): Promise<void> {
  const pagePath = path.join(pagesDir, path.basename(existing.pageTemplate));
  if (fs.existsSync(pagePath)) {
    const content = fs.readFileSync(pagePath, 'utf8');
    const enriched = enrichPageTemplate(content, entry, steps);
    fs.writeFileSync(pagePath, enriched, 'utf8');
  }

  // 操作模板更新 recordCount
  const opPath = path.join(opsDir, path.basename(existing.operationTemplate));
  if (fs.existsSync(opPath)) {
    let content = fs.readFileSync(opPath, 'utf8');
    content = content.replace(/recordCount:\s*\d+/, `recordCount: ${existing.recordCount + 1}`);
    fs.writeFileSync(opPath, content, 'utf8');
  }

  console.log(`  → 增强: ${entry.targetPage} / ${entry.operationType}`);
}

// ─── 构建页面模板 ─────────────────────────────────────────────────────────────

function buildPageTemplate(entry: ManifestEntry, steps: Array<{ selector: string; type: string; code: string }>): string {
  const lines: string[] = [];
  lines.push(`# 页面模板：${entry.targetPage}`);
  lines.push(`# 自动生成于：${new Date().toISOString()}`);
  lines.push('');
  lines.push(`页面: "${entry.targetPage}"`);
  lines.push(`URL: "${entry.pageURL}"`);
  lines.push(`recordCount: 1`);
  lines.push(`sourceCases:`);
  lines.push(`  - "${entry.name}"`);
  lines.push('');
  lines.push(`元素映射:`);

  const clicks = steps.filter(s => s.type === 'click');
  const inputs = steps.filter(s => s.type === 'input');
  const waits = steps.filter(s => s.type.startsWith('wait'));

  if (clicks.length > 0) {
    lines.push(`  按钮:`);
    for (const s of clicks) {
      lines.push(`    - primary: "${s.selector}"`);
      lines.push(`      fallbacks: []`);
      if (s.code) {
        const desc = s.code.replace(/"/g, '\\"').slice(0, 60);
        lines.push(`      description: "${desc}"`);
      }
    }
  }

  if (inputs.length > 0) {
    lines.push(`  输入框:`);
    for (const s of inputs) {
      lines.push(`    - primary: "${s.selector}"`);
      lines.push(`      fallbacks: []`);
      if (s.code) {
        const desc = s.code.replace(/"/g, '\\"').slice(0, 60);
        lines.push(`      description: "${desc}"`);
      }
    }
  }

  return lines.join('\n');
}

// ─── 增强页面模板 ─────────────────────────────────────────────────────────────

function enrichPageTemplate(
  content: string,
  entry: ManifestEntry,
  steps: Array<{ selector: string; type: string; code: string }>,
): string {
  let enriched = content;

  // 增加 recordCount
  enriched = enriched.replace(
    /recordCount:\s*(\d+)/,
    (_, n) => `recordCount: ${parseInt(n) + 1}`
  );

  // 追加 sourceCases
  if (!enriched.includes(`"${entry.name}"`)) {
    enriched = enriched.replace(
      /(sourceCases:[\s\S]*?)(\n\S)/,
      `$1  - "${entry.name}"\n$2`
    );
  }

  // 更新 URL（如果新录制提供了更具体的 URL）
  if (entry.pageURL && !enriched.includes(entry.pageURL)) {
    enriched = enriched.replace(
      /URL:.*/,
      `URL: "${entry.pageURL}"`
    );
  }

  return enriched;
}

// ─── 构建操作模板 ─────────────────────────────────────────────────────────────

function buildOperationTemplate(
  entry: ManifestEntry,
  steps: Array<{ selector: string; type: string; code: string }>,
): string {
  const lines: string[] = [];
  lines.push(`# 操作模板：${entry.operationType}`);
  lines.push(`# 自动生成于：${new Date().toISOString()}`);
  lines.push('');
  lines.push(`操作类型: "${entry.operationType}"`);
  lines.push(`目标页面: "${entry.targetPage}"`);
  lines.push(`recordCount: 1`);
  lines.push(`sourceCases:`);
  lines.push(`  - "${entry.name}"`);
  lines.push('');
  lines.push(`步骤序列:`);

  for (const s of steps) {
    const escapedCode = s.code
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'");
    lines.push(`  - type: "${s.type}"`);
    lines.push(`    selector: "${s.selector}"`);
    lines.push(`    code: "${escapedCode}"`);
  }

  return lines.join('\n');
}

// ─── 构建索引 YAML ────────────────────────────────────────────────────────────

function buildIndexYaml(entries: TemplateIndexEntry[]): string {
  const lines: string[] = [];
  lines.push(`# 模板库索引`);
  lines.push(`# 自动生成于：${new Date().toISOString()}`);
  lines.push(`# 用于快速匹配和去重`);
  lines.push('');
  lines.push(`模板索引:`);

  for (const e of entries) {
    lines.push(`  - 页面: "${e.page}"`);
    lines.push(`    操作类型: "${e.operationType}"`);
    lines.push(`    pageTemplate: "${e.pageTemplate}"`);
    lines.push(`    operationTemplate: "${e.operationTemplate}"`);
    lines.push(`    sourceCases: [${e.sourceCases.map(c => `"${c}"`).join(', ')}]`);
    lines.push(`    recordCount: ${e.recordCount}`);
    lines.push(`    最后更新: "${e.lastUpdated}"`);
    lines.push('');
  }

  return lines.join('\n');
}

// ─── 工具函数 ─────────────────────────────────────────────────────────────────

function sanitizeFileName(name: string): string {
  return name.replace(/[<>:"/\\|?*]/g, '').replace(/\s+/g, '-').slice(0, 50);
}

main().catch((err) => {
  console.error('[template-extractor] 错误：', err);
  process.exit(1);
});
