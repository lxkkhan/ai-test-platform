/**
 * template-matcher.ts
 *
 * 模板匹配引擎。
 * 根据标签化测试用例（目标页面 + 操作类型）在模板库中匹配最佳模板。
 *
 * 用法：
 *   直接导入使用：
 *   import { matchTemplate } from './template-matcher';
 *   const result = matchTemplate({ targetPage: '到货单列表', operationType: '查询验证' });
 */

import * as fs from 'fs';
import * as path from 'path';

// ─── 数据类型 ─────────────────────────────────────────────────────────────────

export interface TemplateIndexEntry {
  page: string;
  operationType: string;
  pageTemplate: string;
  operationTemplate: string;
  sourceCases: string[];
  recordCount: number;
  lastUpdated: string;
}

export interface MatchInput {
  targetPage: string;
  operationType: string;
  testData?: Record<string, string>;
  assertions?: string[];
}

export interface MatchResult {
  matched: boolean;
  confidence: number;
  pageTemplate?: string;
  operationTemplate?: string;
  sourceCases?: string[];
  matchStrategy: 'exact' | 'fuzzy-page' | 'fuzzy-type' | 'partial' | 'none';
  suggestions?: string[];
}

// ─── 模板库路径 ───────────────────────────────────────────────────────────────

function getTemplateLibraryDir(): string {
  return path.resolve(__dirname, '../template-library');
}

function loadIndex(): TemplateIndexEntry[] | null {
  const indexPath = path.join(getTemplateLibraryDir(), 'index.yaml');
  if (!fs.existsSync(indexPath)) return null;

  const content = fs.readFileSync(indexPath, 'utf8');
  return parseIndex(content);
}

function parseIndex(content: string): TemplateIndexEntry[] {
  const entries: TemplateIndexEntry[] = [];
  let current: Partial<TemplateIndexEntry> = {};
  let currentList: string[] = [];

  for (const line of content.split('\n')) {
    const trimmed = line.trim();

    if (trimmed.match(/^-\s*页面:/)) {
      if (current.page) {
        current.sourceCases = currentList;
        entries.push(current as TemplateIndexEntry);
      }
      current = {};
      currentList = [];
      current.page = trimmed.replace(/.*页面:\s*"?(.*?)"?$/, '$1');
    } else if (trimmed.match(/^操作类型:/)) {
      current.operationType = trimmed.replace(/.*操作类型:\s*"?(.*?)"?$/, '$1');
    } else if (trimmed.match(/^pageTemplate:/)) {
      current.pageTemplate = trimmed.replace(/.*pageTemplate:\s*"?(.*?)"?$/, '$1');
    } else if (trimmed.match(/^operationTemplate:/)) {
      current.operationTemplate = trimmed.replace(/.*operationTemplate:\s*"?(.*?)"?$/, '$1');
    } else if (trimmed.match(/^sourceCases:/)) {
      // YAML list parsing
    } else if (trimmed.match(/^-\s*"/)) {
      currentList.push(trimmed.replace(/^-\s*"?(.*?)"?\s*$/, '$1'));
    } else if (trimmed.match(/^recordCount:/)) {
      current.recordCount = parseInt(trimmed.replace(/.*recordCount:\s*/, ''));
    } else if (trimmed.match(/^最后更新:/)) {
      current.lastUpdated = trimmed.replace(/.*最后更新:\s*"?(.*?)"?$/, '$1');
    }
  }

  if (current.page) {
    current.sourceCases = currentList;
    entries.push(current as TemplateIndexEntry);
  }
  return entries;
}

// ─── 主匹配函数 ───────────────────────────────────────────────────────────────

/**
 * 根据目标页面和操作类型匹配模板。
 * 四级匹配策略：
 * 1. 精确匹配：页面名 + 操作类型完全一致
 * 2. 模糊页面匹配：操作类型一致但页面名部分匹配
 * 3. 模糊类型匹配：页面一致但操作类型部分匹配
 * 4. 降级：同页面任何操作类型
 */
export function matchTemplate(input: MatchInput): MatchResult {
  const index = loadIndex();

  if (!index || index.length === 0) {
    return {
      matched: false,
      confidence: 0,
      matchStrategy: 'none',
      suggestions: ['模板库为空，请先使用 dom-recorder 录制并导入模板'],
    };
  }

  // 1. 精确匹配
  const exactMatch = index.find(e =>
    e.page === input.targetPage && e.operationType === input.operationType
  );
  if (exactMatch) {
    return {
      matched: true,
      confidence: 100,
      pageTemplate: exactMatch.pageTemplate,
      operationTemplate: exactMatch.operationTemplate,
      sourceCases: exactMatch.sourceCases,
      matchStrategy: 'exact',
    };
  }

  // 2. 模糊页面匹配（操作类型一致，页面名包含关键词或相似度>0.5）
  const fuzzyPageMatch = index.find(e =>
    e.operationType === input.operationType &&
    (e.page.includes(input.targetPage) || 
     input.targetPage.includes(e.page) ||
     hasCommonKeyword(e.page, input.targetPage) ||
     similarity(e.page, input.targetPage) > 0.4)
  );
  if (fuzzyPageMatch) {
    return {
      matched: true,
      confidence: 75,
      pageTemplate: fuzzyPageMatch.pageTemplate,
      operationTemplate: fuzzyPageMatch.operationTemplate,
      sourceCases: fuzzyPageMatch.sourceCases,
      matchStrategy: 'fuzzy-page',
      suggestions: [`页面"${fuzzyPageMatch.page}"与"${input.targetPage}"部分匹配，确认后继续`],
    };
  }

  // 3. 模糊类型匹配（页面一致，操作类型部分匹配）
  const fuzzyTypeMatch = index.find(e =>
    e.page === input.targetPage &&
    similarity(e.operationType, input.operationType) > 0.5
  );
  if (fuzzyTypeMatch) {
    return {
      matched: true,
      confidence: 60,
      pageTemplate: fuzzyTypeMatch.pageTemplate,
      operationTemplate: fuzzyTypeMatch.operationTemplate,
      sourceCases: fuzzyTypeMatch.sourceCases,
      matchStrategy: 'fuzzy-type',
      suggestions: [`操作类型"${fuzzyTypeMatch.operationType}"与"${input.operationType}"近似，确认后继续`],
    };
  }

  // 4. 降级匹配（同一页面内的任何操作类型）
  const partialMatch = index.find(e => e.page === input.targetPage);
  if (partialMatch) {
    return {
      matched: true,
      confidence: 40,
      pageTemplate: partialMatch.pageTemplate,
      operationTemplate: partialMatch.operationTemplate,
      sourceCases: partialMatch.sourceCases,
      matchStrategy: 'partial',
      suggestions: [`找到页面"${input.targetPage}"的操作模板，但操作类型"${partialMatch.operationType}"不完全匹配，建议手动调整`],
    };
  }

  // 5. 无匹配
  return {
    matched: false,
    confidence: 0,
    matchStrategy: 'none',
    suggestions: [
      `未找到"${input.targetPage}"页面的模板`,
      `建议：使用 dom-recorder 对该页面进行录制，然后导入模板库`,
    ],
  };
}

// ─── 字符串相似度 ─────────────────────────────────────────────────────────────

function similarity(a: string, b: string): number {
  const an = a.toLowerCase();
  const bn = b.toLowerCase();
  if (an === bn) return 1.0;

  // 检查包含关系
  if (an.includes(bn) || bn.includes(an)) return 0.7;

  // 简单 Jaccard 相似度（按字符级别）
  const setA = new Set(an.split(''));
  const setB = new Set(bn.split(''));
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return intersection.size / union.size;
}

// ─── 辅助匹配函数 ─────────────────────────────────────────────────────────

/** 检查两个字符串是否有共同的关键词（2字以上） */
function hasCommonKeyword(a: string, b: string): boolean {
  const extractKeywords = (s: string) => {
    // 提取 2-4 字的关键词子串
    const keywords: string[] = [];
    for (let len = 2; len <= 4; len++) {
      for (let i = 0; i <= s.length - len; i++) {
        keywords.push(s.substring(i, i + len));
      }
    }
    return keywords;
  };
  const ka = new Set(extractKeywords(a));
  const kb = extractKeywords(b);
  return kb.some(k => ka.has(k));
}

export interface BatchMatchInput {
  cases: MatchInput[];
}

export function batchMatch(input: BatchMatchInput): MatchResult[] {
  console.log(`\n[matcher] 批量匹配 ${input.cases.length} 个用例...`);

  const results: MatchResult[] = [];
  const index = loadIndex() || [];

  for (const c of input.cases) {
    const result = matchTemplate(c);
    results.push(result);

    const icon = result.matchStrategy === 'exact' ? '✓' :
                 result.matchStrategy === 'none' ? '✗' : '△';
    console.log(`  ${icon} [${result.confidence}%] ${c.targetPage} / ${c.operationType} → ${result.matchStrategy}`);
    if (result.suggestions) {
      for (const s of result.suggestions) {
        console.log(`    → ${s}`);
      }
    }
  }

  const hitRate = results.filter(r => r.matched).length / results.length * 100;
  console.log(`\n[matcher] 命中率: ${hitRate.toFixed(0)}% (${results.filter(r => r.matched).length}/${results.length})`);

  return results;
}

// ─── CLI 入口 ─────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.log('用法: npx tsx template-matcher.ts <targetPage> <operationType>');
    console.log('示例: npx tsx template-matcher.ts "到货单列表" "查询验证"');
    process.exit(1);
  }

  const result = matchTemplate({
    targetPage: args[0],
    operationType: args[1],
  });

  console.log(JSON.stringify(result, null, 2));

  if (!result.matched) {
    process.exit(1);
  }
}

if (require.main === module || process.argv[1]?.endsWith('template-matcher.ts') || process.argv[1]?.endsWith('template-matcher.js')) {
  main();
}
