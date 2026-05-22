/**
 * selector-builder.ts
 *
 * 选择器构建引擎。
 * 将录制时采集的 DOM 属性（ElementAttrs）转换为鲁棒的 Playwright 选择器字符串。
 *
 * 优先级策略：
 *   data-testid > id > aria-label > name + placeholder > button + text > role + text > tag + text
 *   同时对动态 ID（如 form_item_name_xxx）做降级处理。
 */

import * as fs from 'fs';
import * as path from 'path';

// ─── 元素属性（与 record-actions.ts 保持一致） ───────────────────────────────

export interface ElementAttrs {
  tag: string;          // 'button', 'input', 'span', 'a'
  id: string;           // 'form_item_name_xxx'
  name: string;         // 'username'
  type: string;         // 'text', 'password'
  placeholder: string;  // '请输入用户名'
  ariaLabel: string;    // '查询'
  title: string;        // '点击查询'
  role: string;         // 'button'
  className: string;    // '.ant-btn.ant-btn-primary'
  text: string;         // '查询' (innerText)
  desc: string;         // 'button#search-btn.ant-btn["查询"]'
}

// ─── 动态 ID 模式（这些 ID 不稳定，跨版本会变化） ──────────────────────────

const DYNAMIC_ID_PATTERNS = [
  /^form_item_name_\d+$/,          // Ant Design 表单动态 ID
  /^rc-tree-select-list_\d+$/,     // TreeSelect 动态 ID
  /^rc_select_\d+_list/,           // Select 下拉动态 ID
  /^rc_dialog_\d+$/,               // Dialog 动态 ID
  /^rc_picker_\d+$/,               // DatePicker 动态 ID
  /_\d{16,}$/,                     // 长数字后缀（雪花 ID）
];

function isDynamicId(id: string): boolean {
  if (!id) return false;
  return DYNAMIC_ID_PATTERNS.some(p => p.test(id));
}

// ─── 选择器精确度评分 ──────────────────────────────────────────────────────

export function scoreSelectorPrecision(selector: string): number {
  let score = 0;
  if (/\[data-testid=/.test(selector)) score += 100;
  if (/#[a-z]/i.test(selector) && !isDynamicId(selector.replace('#', ''))) score += 80;
  if (/\[aria-label=/.test(selector)) score += 75;
  if (/\[name=/.test(selector)) score += 70;
  if (/\[placeholder/.test(selector)) score += 60;
  if (/\.[a-z-]+/.test(selector)) score += 40;
  if (/:has-text\(/.test(selector)) score += 30;
  if (/\[role=/.test(selector)) score += 30;
  // 带 class + text 的组合比纯 text 可靠
  if (htmlEscape(selector).includes('.')) score += 15;
  return score;
}

// ─── HTML/CSS 转义 ─────────────────────────────────────────────────────────

function htmlEscape(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, ' ');
}

// ─── 主构建函数 ────────────────────────────────────────────────────────────

/**
 * 将 ElementAttrs 转为鲁棒的 Playwright 选择器。
 * 返回 { selector, confidence, strategy }：
 *   - selector: 可直接用于 page.click()/page.fill() 的选择器字符串
 *   - confidence: 精确度评分（0-100）
 *   - strategy: 使用的策略名称
 */
export function buildSelector(attrs: ElementAttrs): {
  selector: string;
  confidence: number;
  strategy: string;
} {
  const tag = attrs.tag || 'button';
  const text = attrs.text || '';
  const shortText = text.slice(0, 30);

  // P1: data-testid
  // 注意：普通录制不采集 data-testid（前端可能需要专门注入），存在则最高优先级
  // 此处保留位置，用户可自行扩展

  // P2: 稳定 ID（非动态 ID）
  if (attrs.id && !isDynamicId(attrs.id)) {
    return {
      selector: `#${attrs.id.replace(/:/g, '\\:')}`,
      confidence: 80,
      strategy: 'stable-id'
    };
  }

  // P3: aria-label
  if (attrs.ariaLabel && attrs.tag !== 'input' && attrs.tag !== 'textarea') {
    // 按钮等元素优先用 aria-label
    if (['button', 'a', 'span', 'div'].includes(tag) || attrs.role === 'button') {
      return {
        selector: `[aria-label="${htmlEscape(attrs.ariaLabel)}"]`,
        confidence: 75,
        strategy: 'aria-label'
      };
    }
  }

  // P4: name 属性（表单元素）
  if (attrs.name && ['input', 'textarea', 'select'].includes(tag)) {
    const nameSelector = `${tag}[name="${htmlEscape(attrs.name)}"]`;
    if (attrs.placeholder) {
      return {
        selector: `${nameSelector}[placeholder*="${htmlEscape(attrs.placeholder.slice(0, 20))}"]`,
        confidence: 75,
        strategy: 'name+placeholder'
      };
    }
    return {
      selector: nameSelector,
      confidence: 70,
      strategy: 'name'
    };
  }

  // P5: placeholder（输入框专属）
  if (attrs.placeholder) {
    return {
      selector: `${tag}[placeholder*="${htmlEscape(attrs.placeholder.slice(0, 30))}"]`,
      confidence: 60,
      strategy: 'placeholder'
    };
  }

  // P6: button / a 标签 + 文本内容（最常用场景）
  if ((tag === 'button' || tag === 'a') && shortText) {
    if (attrs.className) {
      const className = attrs.className.split('.')[0]; // 取第一个 class
      return {
        selector: `${tag}${className}:has-text("${htmlEscape(shortText)}")`,
        confidence: 55,
        strategy: 'tag+class+text'
      };
    }
    return {
      selector: `${tag}:has-text("${htmlEscape(shortText)}")`,
      confidence: 40,
      strategy: 'tag+text'
    };
  }

  // P7: role + 文本
  if (attrs.role && shortText) {
    return {
      selector: `[role="${attrs.role}"]:has-text("${htmlEscape(shortText)}")`,
      confidence: 45,
      strategy: 'role+text'
    };
  }

  // P8: role 单独
  if (attrs.role && ['button', 'tab', 'menuitem', 'link'].includes(attrs.role)) {
    return {
      selector: `[role="${attrs.role}"]`,
      confidence: 35,
      strategy: 'role'
    };
  }

  // P9: title 属性
  if (attrs.title) {
    return {
      selector: `[title="${htmlEscape(attrs.title)}"]`,
      confidence: 30,
      strategy: 'title'
    };
  }

  // P10: tag + text（兜底但最宽泛）
  if (shortText) {
    return {
      selector: `${tag}:has-text("${htmlEscape(shortText)}")`,
      confidence: 20,
      strategy: 'tag+text',
    };
  }

  // P11: 纯 tag（最后手段）
  return {
    selector: tag,
    confidence: 5,
    strategy: 'tag-only',
  };
}

// ─── 构建备选选择器列表 ────────────────────────────────────────────────────

/**
 * 为同一个元素生成多个备选选择器（用于多级重试）。
 * 返回按优先级排序的选择器列表。
 */
export function buildSelectorFallbacks(attrs: ElementAttrs): Array<{
  selector: string;
  confidence: number;
  strategy: string;
}> {
  const results: Array<{ selector: string; confidence: number; strategy: string }> = [];
  const tag = attrs.tag || 'button';
  const text = attrs.text || '';
  const shortText = text.slice(0, 30);

  // 收集所有可能的选择器
  if (attrs.id && !isDynamicId(attrs.id)) {
    results.push({ selector: `#${attrs.id}`, confidence: 80, strategy: 'stable-id' });
  }
  if (attrs.ariaLabel) {
    results.push({ selector: `[aria-label="${htmlEscape(attrs.ariaLabel)}"]`, confidence: 75, strategy: 'aria-label' });
  }
  if (attrs.name) {
    results.push({ selector: `${tag}[name="${htmlEscape(attrs.name)}"]`, confidence: 70, strategy: 'name' });
  }
  if (attrs.placeholder) {
    results.push({ selector: `${tag}[placeholder*="${htmlEscape(attrs.placeholder.slice(0, 30))}"]`, confidence: 60, strategy: 'placeholder' });
  }
  if (shortText) {
    if (attrs.className) {
      results.push({ selector: `${tag}${attrs.className.split('.')[0]}:has-text("${htmlEscape(shortText)}")`, confidence: 55, strategy: 'tag+class+text' });
    }
    results.push({ selector: `${tag}:has-text("${htmlEscape(shortText)}")`, confidence: 40, strategy: 'tag+text' });
  }
  if (attrs.role) {
    results.push({ selector: `[role="${attrs.role}"]`, confidence: 35, strategy: 'role' });
  }
  if (attrs.title) {
    results.push({ selector: `[title="${htmlEscape(attrs.title)}"]`, confidence: 30, strategy: 'title' });
  }
  if (attrs.id && isDynamicId(attrs.id)) {
    // 动态 ID 作为最后手段
    results.push({ selector: `#${attrs.id}`, confidence: 10, strategy: 'dynamic-id' });
  }

  // 去重 + 按 confidence 降序
  const seen = new Set<string>();
  const deduped = results.filter(r => {
    if (seen.has(r.selector)) return false;
    seen.add(r.selector);
    return true;
  });

  deduped.sort((a, b) => b.confidence - a.confidence);
  return deduped;
}

// ─── 生成 robustClick / robustFill 辅助函数 ─────────────────────────────────

/**
 * 生成多级重试的点击代码。
 * 组装为可注入 .spec.ts 的代码字符串。
 */
export function buildRobustClickCode(attrs: ElementAttrs, stepComment: string): string {
  const fallbacks = buildSelectorFallbacks(attrs);
  if (fallbacks.length === 0) return `// [fallback] 无可用选择器`;

  const lines: string[] = [];
  lines.push(`  // ${stepComment}`);
  lines.push(`  // [selector] primary: ${fallbacks[0].selector} (${fallbacks[0].strategy})`);

  if (fallbacks.length === 1) {
    lines.push(`  await page.click('${fallbacks[0].selector}');`);
  } else {
    lines.push(`  try {`);
    lines.push(`    await page.click('${fallbacks[0].selector}', { timeout: 3000 });`);
    lines.push(`  } catch {`);
    for (let i = 1; i < fallbacks.length; i++) {
      lines.push(`    try {`);
      lines.push(`      await page.click('${fallbacks[i].selector}', { timeout: 3000 });`);
      lines.push(`    } catch {`);
    }
    for (let i = 1; i < fallbacks.length; i++) {
      lines.push(`    }`);
    }
    lines.push(`  }`);
  }

  return lines.join('\n');
}

/**
 * 生成多级重试的填充代码。
 */
export function buildRobustFillCode(attrs: ElementAttrs, value: string, stepComment: string): string {
  const fallbacks = buildSelectorFallbacks(attrs);
  if (fallbacks.length === 0) return `// [fallback] 无可用选择器`;

  const escapedValue = value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const lines: string[] = [];
  lines.push(`  // ${stepComment}`);
  lines.push(`  // [selector] primary: ${fallbacks[0].selector} (${fallbacks[0].strategy})`);

  if (fallbacks.length === 1) {
    lines.push(`  await page.fill('${fallbacks[0].selector}', '${escapedValue}');`);
  } else {
    lines.push(`  try {`);
    lines.push(`    await page.fill('${fallbacks[0].selector}', '${escapedValue}', { timeout: 3000 });`);
    lines.push(`  } catch {`);
    for (let i = 1; i < fallbacks.length; i++) {
      lines.push(`    try {`);
      lines.push(`      await page.fill('${fallbacks[i].selector}', '${escapedValue}', { timeout: 3000 });`);
      lines.push(`    } catch {`);
    }
    for (let i = 1; i < fallbacks.length; i++) {
      lines.push(`    }`);
    }
    lines.push(`  }`);
  }

  return lines.join('\n');
}
