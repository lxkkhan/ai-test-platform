/**
 * selector-recorder.ts (dom-recorder v1)
 *
 * 纯 Playwright Selector 模式录制引擎。
 *
 * 与现有 record-actions.ts 的区别：
 *   - 不走 VLM 视觉识别，直接基于 DOM 属性生成 page.click/page.fill
 *   - 支持用例边界标记（浮动工具栏 + URL 变化提示）
 *   - 并行保留 VLM 输出路径（可选）
 *   - 输出：独立 .spec.ts 文件 + manifest.yaml + 初始模板
 *
 * 用法：
 *   npx tsx .opencode/skills/dom-recorder/scripts/selector-recorder.ts
 *
 * 基于 record-actions.ts 的 Chrome/CDP/登录/截图基础设施，复用其 performLogin、
 * Chrome 启动、事件采集逻辑。
 */

import { chromium } from 'playwright';
import { PlaywrightAgent } from '@midscene/web/playwright';
import { spawn, spawnSync, ChildProcess } from 'child_process';
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { performLogin } from '../../auto-record-replay/../auto-test-runner/scripts/perform-login';
import { buildSelector, buildSelectorFallbacks, ElementAttrs, scoreSelectorPrecision } from './selector-builder';

// ─── 路径解析：复用 auto-record-replay 的 playwrigh/Chrome 依赖 ──────────────
// 注意：dom-recorder 依赖 playwright-mind 插件的 auto-record-replay + auto-test-runner 环境。
// 需要在项目根目录下运行（与现有 .env、scripts/、tests/ 同级）。

// __dirname = <skill>/scripts/，上一级为 skill 根目录
const SKILL_DIR = path.resolve(__dirname, '..');
const SKILL_ENV_PATH = path.resolve(SKILL_DIR, '.env');

// 优先加载 skill 自身的 .env，若不存在则回退到 auto-record-replay 的 .env
const fallbackEnvPath = path.resolve(__dirname, '../../auto-record-replay/.env');
if (fs.existsSync(fallbackEnvPath) && !fs.existsSync(SKILL_ENV_PATH)) {
  fs.copyFileSync(fallbackEnvPath, SKILL_ENV_PATH);
}
dotenv.config({ path: SKILL_ENV_PATH });

const RECORD_PORT = Number(process.env.RECORD_PORT) || 9301; // 默认用 9301，避免与原录制器 9300 冲突

// ─── 工具函数 ─────────────────────────────────────────────────────────────────

function getFilenameTimestamp(): string {
  const d = new Date();
  const p = (n: number, len = 2) => String(n).padStart(len, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

function getLineTimestamp(): string {
  const d = new Date();
  const p = (n: number, len = 2) => String(n).padStart(len, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

function isCdpReady(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}/json/version`, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => { req.destroy(); resolve(false); });
  });
}

const CHROME_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
];

function findChrome(): string {
  for (const p of CHROME_PATHS) {
    if (p && fs.existsSync(p)) return p;
  }
  throw new Error('未找到 Chrome，请确认已安装 Google Chrome');
}

// ─── 特殊按键 ─────────────────────────────────────────────────────────────────

const SPECIAL_KEYS = new Set([
  'Enter', 'Tab', 'Escape', 'Backspace', 'Delete',
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'Home', 'End', 'PageUp', 'PageDown',
  'F1','F2','F3','F4','F5','F6','F7','F8','F9','F10','F11','F12',
]);

// ─── 事件数据类型（与 record-actions.ts 保持一致） ──────────────────────────

interface ActionEvent {
  type: 'click' | 'dblclick' | 'contextmenu' | 'keydown' | 'input' | 'scroll';
  timestamp: number;
  x?: number;
  y?: number;
  inputFirstChar?: boolean;
  el?: ElementAttrs;
  ancestorEl?: ElementAttrs | null;
  target?: string;
  elementId?: string;
  tagName?: string;
  key?: string;
  modifiers?: string;
  value?: string;
  scrollX?: number;
  scrollY?: number;
  url?: string;
}

// ─── 用例边界数据结构 ────────────────────────────────────────────────────────

interface TestCaseBoundary {
  caseId: number;
  name: string;
  targetPage: string;
  operationType: string;     // '查询验证' | '新增提交' | '编辑修改' | '删除确认' | '导出下载' | '导航' | '其他'
  testData: Record<string, string>;
  assertions: string[];
  pageURL: string;
  boundaryMethod: '手动标记' | 'URL变化' | 'AI拆分';
  startStepIndex: number;
  endStepIndex: number;
}

// ─── 步骤记录 ────────────────────────────────────────────────────────────────

interface RecordedStep {
  index: number;
  timestamp: string;
  type: string;
  selectorCode: string;      // 生成的 Playwright 代码
  selector: string;          // 主要选择器
  fallbacks: Array<{ selector: string; confidence: number; strategy: string }>;
  comment: string;
  url: string;
  rawEvent: ActionEvent;
}

// ─── Selector 代码生成器 ─────────────────────────────────────────────────────

class SelectorCodeGenerator {
  generateStep(ev: ActionEvent): RecordedStep | null {
    const ts = getLineTimestamp();
    const desc = ev.el?.desc ?? ev.target ?? '';

    switch (ev.type) {
      case 'click': {
        // 跳过对输入框的单击（输入由 input 事件处理）
        if (ev.el?.tag === 'input' || ev.el?.tag === 'textarea') return null;

        const fallbacks = buildSelectorFallbacks(ev.el!);
        const primary = buildSelector(ev.el!);
        const code = this.buildClickWithFallback(primary.selector, fallbacks, desc);

        return {
          index: 0, timestamp: ts, type: 'click',
          selectorCode: code, selector: primary.selector,
          fallbacks, comment: `单击 → ${desc}`, url: ev.url ?? '',
          rawEvent: ev
        };
      }

      case 'dblclick': {
        const fallbacks = buildSelectorFallbacks(ev.el!);
        const primary = buildSelector(ev.el!);
        const code = this.buildDblClickWithFallback(primary.selector, fallbacks, desc);
        return {
          index: 0, timestamp: ts, type: 'dblclick',
          selectorCode: code, selector: primary.selector,
          fallbacks, comment: `双击 → ${desc}`, url: ev.url ?? '',
          rawEvent: ev
        };
      }

      case 'input': {
        const value = (ev.value ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        const fallbacks = buildSelectorFallbacks(ev.el!);
        const primary = buildSelector(ev.el!);
        const code = this.buildFillWithFallback(primary.selector, fallbacks, value, desc);
        return {
          index: 0, timestamp: ts, type: 'input',
          selectorCode: code, selector: primary.selector,
          fallbacks, comment: `输入 → ${desc}`, url: ev.url ?? '',
          rawEvent: ev
        };
      }

      case 'keydown': {
        if (!ev.key || !SPECIAL_KEYS.has(ev.key)) return null;
        const mod = ev.modifiers ? `${ev.modifiers}+` : '';
        const key = `${mod}${ev.key}`;
        const elSelector = ev.el ? buildSelector(ev.el).selector : '';
        const code = elSelector
          ? `await page.press('${elSelector}', '${key}');`
          : `await page.keyboard.press('${key}');`;
        return {
          index: 0, timestamp: ts, type: 'keydown',
          selectorCode: code, selector: elSelector,
          fallbacks: [], comment: `按键 → ${key}`, url: ev.url ?? '',
          rawEvent: ev
        };
      }

      default:
        return null;
    }
  }

  private buildClickWithFallback(
    primary: string,
    fallbacks: Array<{ selector: string; confidence: number; strategy: string }>,
    desc: string
  ): string {
    if (fallbacks.length <= 1) {
      return `await page.click('${primary}');`;
    }
    let code = `try {
      await page.click('${primary}', { timeout: 3000 });`;
    for (let i = 1; i < fallbacks.length; i++) {
      code += `
    } catch {
      try {
        await page.click('${fallbacks[i].selector}', { timeout: 3000 });`;
    }
    for (let i = 1; i < fallbacks.length; i++) {
      code += `
      }`;
    }
    code += `
    }`;
    return code;
  }

  private buildDblClickWithFallback(
    primary: string,
    fallbacks: Array<{ selector: string; confidence: number; strategy: string }>,
    desc: string
  ): string {
    if (fallbacks.length <= 1) {
      return `await page.dblclick('${primary}');`;
    }
    let code = `try {
      await page.dblclick('${primary}', { timeout: 3000 });`;
    for (let i = 1; i < fallbacks.length; i++) {
      code += `
    } catch {
      try {
        await page.dblclick('${fallbacks[i].selector}', { timeout: 3000 });`;
    }
    for (let i = 1; i < fallbacks.length; i++) {
      code += `
      }`;
    }
    code += `
    }`;
    return code;
  }

  private buildFillWithFallback(
    primary: string,
    fallbacks: Array<{ selector: string; confidence: number; strategy: string }>,
    value: string,
    desc: string
  ): string {
    if (fallbacks.length <= 1) {
      return `await page.fill('${primary}', '${value}');`;
    }
    let code = `try {
      await page.fill('${primary}', '${value}', { timeout: 3000 });`;
    for (let i = 1; i < fallbacks.length; i++) {
      code += `
    } catch {
      try {
        await page.fill('${fallbacks[i].selector}', '${value}', { timeout: 3000 });`;
    }
    for (let i = 1; i < fallbacks.length; i++) {
      code += `
      }`;
    }
    code += `
    }`;
    return code;
  }
}

// ─── 浏览器注入脚本（复用 record-actions.ts 的 INIT_SCRIPT，增加工具栏） ────

const INIT_SCRIPT = `
(function () {
  if (window.__recorderInjected) return;
  window.__recorderInjected = true;

  /** 采集元素的丰富属性 */
  function describeElementAttrs(el) {
    if (!el) return { tag:'unknown', id:'', name:'', type:'', placeholder:'', ariaLabel:'', title:'', role:'', text:'', className:'', desc:'unknown' };
    const tag         = (el.tagName || '').toLowerCase();
    const id          = el.id || '';
    const name        = el.getAttribute ? (el.getAttribute('name') || '') : '';
    const type        = el.type || '';
    const placeholder = el.placeholder || '';
    const ariaLabel   = el.getAttribute ? (el.getAttribute('aria-label') || '') : '';
    const title       = el.title || '';
    const role        = el.getAttribute ? (el.getAttribute('role') || '') : '';
    const text        = (el.innerText || el.value || '').trim().slice(0, 50).replace(/\\n/g, ' ');
    const cls         = el.className && typeof el.className === 'string'
      ? '.' + el.className.trim().split(/\\s+/).slice(0, 2).join('.') : '';
    const desc        = (tag + (id ? '#'+id : '') + cls + (text ? '["'+text+'"]' : '')).slice(0, 80);
    return { tag, id, name, type, placeholder, ariaLabel, title, role, text, className: cls, desc };
  }

  function findSemanticAncestor(el) {
    const SEMANTIC_TAGS = new Set(['button','a','li','nav','header','footer','section','article','label','input','select','textarea','option']);
    let node = el ? el.parentElement : null;
    for (let i = 0; i < 5 && node && node !== document.body; i++, node = node.parentElement) {
      const tag       = (node.tagName || '').toLowerCase();
      const ariaLabel = node.getAttribute ? (node.getAttribute('aria-label') || '') : '';
      const title     = node.title || '';
      const text      = (node.innerText || '').trim().slice(0, 50).replace(/\\n/g, ' ');
      const role      = node.getAttribute ? (node.getAttribute('role') || '') : '';
      if (ariaLabel || title || role || SEMANTIC_TAGS.has(tag) || text) {
        return describeElementAttrs(node);
      }
    }
    return null;
  }

  function getModifiers(ev) {
    const m = [];
    if (ev.ctrlKey)  m.push('Ctrl');
    if (ev.altKey)   m.push('Alt');
    if (ev.shiftKey) m.push('Shift');
    if (ev.metaKey)  m.push('Meta');
    return m.join('+');
  }

  var lastInputClick = null;
  var inputTypingStarted = new WeakSet();

  function onMouse(type) {
    return function(ev) {
      var t = ev.target;
      var tag = t ? (t.tagName || '').toLowerCase() : '';
      if (type === 'click' && (tag === 'input' || tag === 'textarea')) {
        lastInputClick = {
          el: t,
          x: Math.round(ev.clientX),
          y: Math.round(ev.clientY),
        };
      }

      window.__recordAction({
        type,
        timestamp: Date.now(),
        url: location.href,
        x: Math.round(ev.clientX),
        y: Math.round(ev.clientY),
        el: describeElementAttrs(ev.target),
        ancestorEl: findSemanticAncestor(ev.target),
        target: describeElementAttrs(ev.target).desc,
        elementId: ev.target ? (ev.target.id || '') : '',
        tagName: ev.target ? (ev.target.tagName || '').toLowerCase() : '',
      });
    };
  }

  document.addEventListener('click',       onMouse('click'),       true);
  document.addEventListener('dblclick',    onMouse('dblclick'),    true);
  document.addEventListener('contextmenu', onMouse('contextmenu'), true);

  document.addEventListener('keydown', function(ev) {
    if (['Control','Alt','Shift','Meta'].includes(ev.key)) return;
    window.__recordAction({
      type: 'keydown',
      timestamp: Date.now(),
      url: location.href,
      key: ev.key,
      modifiers: getModifiers(ev),
      el: describeElementAttrs(ev.target),
      target: describeElementAttrs(ev.target).desc,
      elementId: ev.target ? (ev.target.id || '') : '',
    });
  }, true);

  document.addEventListener('input', function(ev) {
    var t = ev.target;
    var tag = t ? (t.tagName || '').toLowerCase() : '';
    var isInputLike = tag === 'input' || tag === 'textarea';
    var value = (t && t.value !== undefined) ? String(t.value).slice(0, 500) : '';

    var inputFirstChar = false;
    var x = undefined;
    var y = undefined;

    if (isInputLike && value && !inputTypingStarted.has(t)) {
      inputTypingStarted.add(t);
      inputFirstChar = true;
      if (lastInputClick && lastInputClick.el === t) {
        x = lastInputClick.x;
        y = lastInputClick.y;
      } else if (t.getBoundingClientRect) {
        var rect = t.getBoundingClientRect();
        x = Math.round(rect.left + rect.width / 2);
        y = Math.round(rect.top + rect.height / 2);
      }
    }

    window.__recordAction({
      type: 'input',
      timestamp: Date.now(),
      url: location.href,
      value: value,
      inputFirstChar: inputFirstChar,
      x: x, y: y,
      el: describeElementAttrs(ev.target),
      target: describeElementAttrs(ev.target).desc,
      elementId: ev.target ? (ev.target.id || '') : '',
    });
  }, true);

  document.addEventListener('blur', function(ev) {
    var t = ev.target;
    if (!t) return;
    var tag = (t.tagName || '').toLowerCase();
    if (tag !== 'input' && tag !== 'textarea') return;
    inputTypingStarted.delete(t);
    if (lastInputClick && lastInputClick.el === t) { lastInputClick = null; }
  }, true);

  // URL 变化监控（用于辅助边界识别）
  var lastUrl = location.href;
  setInterval(function() {
    if (location.href !== lastUrl) {
      var oldUrl = lastUrl;
      lastUrl = location.href;
      window.__urlChanged && window.__urlChanged(oldUrl, location.href);
    }
  }, 500);
})();
`;

// ─── 主入口 ───────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const recordDir = process.env.RECORD_DIR || path.resolve(SKILL_DIR, 'test_record');
  fs.mkdirSync(recordDir, { recursive: true });

  const sessionTs = getFilenameTimestamp();
  const sessionDir = path.join(recordDir, sessionTs);
  fs.mkdirSync(sessionDir, { recursive: true });

  const startIso = new Date().toISOString();

  const codeGenerator = new SelectorCodeGenerator();

  // ── 用例边界管理 ────────────────────────────────────────────────────────

  const boundaries: TestCaseBoundary[] = [];
  const allSteps: RecordedStep[] = [];
  let currentBoundary: TestCaseBoundary | null = null;
  let caseIdCounter = 0;
  let actionCount = 0;

  function startNewCase(info: Partial<TestCaseBoundary>): void {
    if (currentBoundary) {
      currentBoundary.endStepIndex = allSteps.length - 1;
      boundaries.push({ ...currentBoundary });
    }
    caseIdCounter++;
    currentBoundary = {
      caseId: caseIdCounter,
      name: info.name || `用例${caseIdCounter}`,
      targetPage: info.targetPage || '',
      operationType: info.operationType || '其他',
      testData: info.testData || {},
      assertions: info.assertions || [],
      pageURL: info.pageURL || '',
      boundaryMethod: info.boundaryMethod || '手动标记',
      startStepIndex: allSteps.length,
      endStepIndex: -1,
    };
    console.log(`\n[recorder] ── 新用例 #${caseIdCounter}: "${currentBoundary.name}" ──`);
  }

  // 录制开始时创建默认第一个用例
  startNewCase({ name: '默认用例', operationType: '其他', boundaryMethod: '默认' });

  // ── 异步处理队列 ────────────────────────────────────────────────────────

  interface QueueItem { ev: ActionEvent; }
  const processingQueue: QueueItem[] = [];
  let isProcessingQueue = false;

  async function drainQueue(): Promise<void> {
    if (isProcessingQueue) return;
    isProcessingQueue = true;
    while (processingQueue.length > 0) {
      const item = processingQueue.shift()!;
      try {
        const step = codeGenerator.generateStep(item.ev);
        if (step) {
          step.index = allSteps.length;
          allSteps.push(step);
          actionCount++;
          if (item.ev.type === 'click' || item.ev.type === 'dblclick') {
            console.log(`  [${step.timestamp}] ${step.comment} → ${step.selector}`);
          }
        }
      } catch (e) {
        console.error(`  [recorder] ✗ 处理事件失败：${(e as Error).message}`);
      }
    }
    isProcessingQueue = false;
  }

  // ── 启动 Chrome ────────────────────────────────────────────────────────

  const userDataDir = path.resolve('.auth/profile-record-selector');
  if (fs.existsSync(userDataDir)) {
    fs.rmSync(userDataDir, { recursive: true, force: true });
  }
  fs.mkdirSync(userDataDir, { recursive: true });

  const chromePath = findChrome();
  console.log(`[recorder] 使用 Chrome：${chromePath}`);

  let chromeProc: ChildProcess | null = null;
  if (!(await isCdpReady(RECORD_PORT))) {
    chromeProc = spawn(chromePath, [
      `--remote-debugging-port=${RECORD_PORT}`,
      `--user-data-dir=${userDataDir}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-extensions',
      '--disable-popup-blocking',
      '--ignore-certificate-errors',
      '--start-maximized',
      'about:blank',
    ], { detached: false, stdio: 'ignore' });

    console.log(`[recorder] 等待 Chrome CDP 端口 ${RECORD_PORT} 就绪...`);
    let ready = false;
    for (let i = 0; i < 40; i++) {
      await new Promise(r => setTimeout(r, 500));
      if (await isCdpReady(RECORD_PORT)) { ready = true; break; }
    }
    if (!ready) {
      chromeProc.kill();
      throw new Error(`Chrome 启动超时，CDP 端口 ${RECORD_PORT} 未响应`);
    }
  }

  // ── 连接 CDP + 登录 ────────────────────────────────────────────────────

  const browser = await chromium.connectOverCDP(`http://localhost:${RECORD_PORT}`);
  const contexts = browser.contexts();
  const context = contexts.length > 0 ? contexts[0] : await browser.newContext();
  const pages = context.pages();
  const page = pages.length > 0 ? pages[0] : await context.newPage();
  const agent = new PlaywrightAgent(page);

  console.log('[recorder] 开始自动登录...');
  await performLogin(page, agent, { tag: '[dom-recorder]' });
  console.log(`[recorder] ✓ 登录成功，当前页面：${page.url()}`);

  // ── 注入录制监听器 ────────────────────────────────────────────────────

  // 注入事件监听
  await context.exposeBinding('__recordAction', async ({}, ev: ActionEvent) => {
    processingQueue.push({ ev });
    drainQueue();
  });

  // 注入 URL 变化监听
  await context.exposeBinding('__urlChanged', async ({}, oldUrl: string, newUrl: string) => {
    try {
      const oldPath = new URL(oldUrl).pathname.split('/').filter(Boolean);
      const newPath = new URL(newUrl).pathname.split('/').filter(Boolean);
      if (oldPath[0] !== newPath[0]) {
        console.log(`\n[recorder] ⚡ URL 变化：${oldPath[0]} → ${newPath[0]}`);
        const pageName = newPath[newPath.length - 1] || newPath[0] || '新页面';
        startNewCase({
          name: `查看${pageName}`,
          targetPage: newPath.join('/'),
          operationType: '查询验证',
          boundaryMethod: 'URL变化',
          pageURL: newUrl,
        });
      }
    } catch { /* URL 解析失败，忽略 */ }
  });

  await context.addInitScript(INIT_SCRIPT);
  for (const p of context.pages()) {
    await p.evaluate(INIT_SCRIPT).catch(() => {});
  }
  context.on('page', async (newPage) => {
    newPage.on('domcontentloaded', async () => {
      await newPage.evaluate(INIT_SCRIPT).catch(() => {});
    });
  });

  // ── 显示控制台帮助 ────────────────────────────────────────────────────

  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║      DOM Recorder v1（纯 Playwright Selector 模式）          ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log(`║  输出目录：${sessionDir.slice(-45).padEnd(45)}║`);
  console.log('║  模式：DOM 属性 → Selector → Playwright 代码                ║');
  console.log('║  键盘快捷键（在录制浏览器窗口中操作）：                        ║');
  console.log('║    Ctrl+Shift+N  → 新建用例                                  ║');
  console.log('║    Ctrl+Shift+E  → 结束录制                                  ║');
  console.log('║  URL 切换自动提示新用例                                      ║');
  console.log('║  关闭浏览器窗口 = 结束录制                                   ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');

  // 在浏览器页面中注入键盘快捷键监听
  await page.evaluate(() => {
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'N') {
        e.preventDefault();
        const name = prompt('新建用例\n\n用例名称：', '');
        if (name) {
          const opType = prompt('操作类型：\n1=查询验证 2=新增提交 3=编辑修改 4=删除确认 5=导出下载 6=其他', '1');
          (window as any).__newCase && (window as any).__newCase(name, opType);
        }
      }
      if (e.ctrlKey && e.shiftKey && e.key === 'E') {
        e.preventDefault();
        (window as any).__stopRecording && (window as any).__stopRecording();
      }
    });
  });

  // 暴露新建用例的 binding
  await context.exposeBinding('__newCase', async ({}, name: string, opType: string) => {
    const opTypeMap: Record<string, string> = {
      '1': '查询验证', '2': '新增提交', '3': '编辑修改',
      '4': '删除确认', '5': '导出下载', '6': '其他'
    };
    startNewCase({
      name,
      operationType: opTypeMap[opType] || '其他',
      boundaryMethod: '手动标记',
      pageURL: page.url(),
    });
  });

  // 暴露停止录制的 binding
  await context.exposeBinding('__stopRecording', async () => {
    console.log('\n[recorder] 收到停止信号...');
    await finalize();
  });

  // ── 结束时保存 ────────────────────────────────────────────────────────

  const finalize = async () => {
    while (processingQueue.length > 0 || isProcessingQueue) {
      await new Promise(r => setTimeout(r, 200));
    }

    // 结束当前用例
    if (currentBoundary) {
      currentBoundary.endStepIndex = allSteps.length - 1;
      boundaries.push({ ...currentBoundary });
    }

    // 保存 raw actions
    const rawPath = path.join(sessionDir, 'raw-actions.json');
    fs.writeFileSync(rawPath, JSON.stringify(allSteps.map(s => s.rawEvent), null, 2), 'utf8');

    // 为每个用例生成 .spec.ts
    const specsDir = sessionDir;
    console.log(`\n[recorder] 生成用例文件...`);

    for (const b of boundaries) {
      const steps = allSteps.filter((_, i) =>
        i >= b.startStepIndex && i <= b.endStepIndex
      );

      if (steps.length === 0) continue;

      const caseNumber = String(b.caseId).padStart(3, '0');
      const caseFileName = `case-${caseNumber}-${sanitizeFileName(b.name)}.spec.ts`;
      const specPath = path.join(specsDir, caseFileName);

      const specContent = buildSpecFile(b.name, b, steps, startIso);
      fs.writeFileSync(specPath, specContent, 'utf8');
      console.log(`  ✓ 用例#${b.caseId}: ${caseFileName} (${steps.length} 步)`);
    }

    // 保存 manifest
    const manifest = buildManifest(sessionTs, startIso, boundaries, allSteps);
    const manifestPath = path.join(sessionDir, 'manifest.yaml');
    fs.writeFileSync(manifestPath, manifest, 'utf8');
    console.log(`  ✓ manifest.yaml`);

    // 保存初始模板
    const templatesDir = path.join(sessionDir, 'templates');
    fs.mkdirSync(templatesDir, { recursive: true });
    saveInitialTemplates(boundaries, allSteps, templatesDir);

    console.log('');
    console.log(`[recorder] 录制结束，共 ${actionCount} 个事件，${boundaries.length} 个用例`);
    console.log(`[recorder] 输出目录：${sessionDir}`);

    if (chromeProc?.pid) {
      try {
        if (process.platform === 'win32') {
          spawnSync('taskkill', ['/PID', String(chromeProc.pid), '/F'], { timeout: 5000 });
        } else {
          process.kill(chromeProc.pid);
        }
      } catch {}
    }

    process.exit(0);
  };

  browser.on('disconnected', () => {
    console.log('\n[recorder] 浏览器已关闭');
    finalize();
  });

  process.on('SIGINT', async () => {
    console.log('\n[recorder] 收到中断信号...');
    try { await browser.close(); } catch { await finalize(); }
  });
}

// ─── 生成 .spec.ts 文件内容 ─────────────────────────────────────────────────

function sanitizeFileName(name: string): string {
  return name.replace(/[<>:"/\\|?*]/g, '').replace(/\s+/g, '-').slice(0, 50);
}

function buildSpecFile(
  caseName: string,
  boundary: TestCaseBoundary,
  steps: RecordedStep[],
  startIso: string,
): string {
  const lines: string[] = [];

  lines.push(`/**`);
  lines.push(` * ${caseName}.spec.ts`);
  lines.push(` *`);
  lines.push(` * 录制时间：${startIso}`);
  lines.push(` * 目标页面：${boundary.targetPage}`);
  lines.push(` * 操作类型：${boundary.operationType}`);
  lines.push(` * 生成工具：dom-recorder (Selector 模式)`);
  if (Object.keys(boundary.testData).length > 0) {
    lines.push(` * 测试数据：${JSON.stringify(boundary.testData)}`);
  }
  lines.push(` */`);
  lines.push('');
  lines.push(`import { test, expect } from '@fixture/auth-fixture';`);
  lines.push('');

  // 测试数据常量
  for (const [key, value] of Object.entries(boundary.testData)) {
    const constName = key.toUpperCase().replace(/\s+/g, '_');
    lines.push(`const ${constName} = '${value}';`);
  }
  if (Object.keys(boundary.testData).length > 0) lines.push('');

  // 测试函数
  lines.push(`test('${caseName}', async ({ page }) => {`);
  lines.push(`  console.log(\`[test] 当前页面 URL：\${page.url()}\`);`);
  lines.push('');

  for (const step of steps) {
    lines.push(`  // [${step.timestamp}] ${step.comment}`);
    if (step.fallbacks.length > 0) {
      const primary = step.fallbacks[0];
      if (primary.confidence < 30) {
        lines.push(`  // ⚠ 低置信度(${primary.confidence})策略: ${primary.strategy}`);
      }
    }
    lines.push(`  ${step.selectorCode}`);
    lines.push('');
  }

  // 断言区域
  if (boundary.assertions.length > 0) {
    lines.push(`  // ↓ 断言验证`);
    for (const assertion of boundary.assertions) {
      lines.push(`  // await expect(...).${assertion};`);
    }
    lines.push('');
  }

  lines.push(`  console.log('[pass] 测试通过');`);
  lines.push(`});`);
  lines.push('');

  return lines.join('\n');
}

// ─── 生成 manifest.yaml ──────────────────────────────────────────────────────

function buildManifest(
  sessionTs: string,
  startIso: string,
  boundaries: TestCaseBoundary[],
  allSteps: RecordedStep[],
): string {
  const lines: string[] = [];

  lines.push(`# 录制清单`);
  lines.push(`# 录制时间：${startIso}`);
  lines.push(`# 生成工具：dom-recorder`);
  lines.push('');
  lines.push(`录制会话:`);
  lines.push(`  录制时间: "${startIso}"`);
  lines.push(`  录制模式: "selector"`);
  lines.push(`  总步骤数: ${allSteps.length}`);
  lines.push(`  用例数: ${boundaries.length}`);
  lines.push(`  输出目录: "${sessionTs}"`);
  lines.push('');
  lines.push(`用例列表:`);

  for (const b of boundaries) {
    const steps = allSteps.filter((_, i) => i >= b.startStepIndex && i <= b.endStepIndex);
    const caseNumber = String(b.caseId).padStart(3, '0');
    const caseFileName = `case-${caseNumber}-${sanitizeFileName(b.name)}.spec.ts`;

    lines.push(`  - caseId: ${b.caseId}`);
    lines.push(`    name: "${b.name}"`);
    lines.push(`    specFile: "${caseFileName}"`);
    lines.push(`    targetPage: "${b.targetPage}"`);
    lines.push(`    pageURL: "${b.pageURL}"`);
    lines.push(`    operationType: "${b.operationType}"`);
    lines.push(`    boundaryMethod: "${b.boundaryMethod}"`);
    lines.push(`    stepRange: [${b.startStepIndex}, ${b.endStepIndex}]`);
    if (Object.keys(b.testData).length > 0) {
      lines.push(`    testData:`);
      for (const [k, v] of Object.entries(b.testData)) {
        lines.push(`      ${k}: "${v}"`);
      }
    }
    if (b.assertions.length > 0) {
      lines.push(`    assertions:`);
      for (const a of b.assertions) {
        lines.push(`      - "${a}"`);
      }
    }
    lines.push('');
  }

  return lines.join('\n');
}

// ─── 生成初始模板 ────────────────────────────────────────────────────────────

function saveInitialTemplates(
  boundaries: TestCaseBoundary[],
  allSteps: RecordedStep[],
  templatesDir: string,
): void {
  // 按目标页面分组
  const pageGroups = new Map<string, TestCaseBoundary[]>();
  for (const b of boundaries) {
    const key = b.targetPage || '未命名页面';
    if (!pageGroups.has(key)) pageGroups.set(key, []);
    pageGroups.get(key)!.push(b);
  }

  // 为每个页面生成页面元素映射模板
  for (const [pageName, cases] of pageGroups) {
    const pageSteps = new Set<RecordedStep>();
    for (const c of cases) {
      for (let i = c.startStepIndex; i <= c.endStepIndex; i++) {
        pageSteps.add(allSteps[i]);
      }
    }

    const template: string[] = [];
    template.push(`# 页面模板：${pageName}`);
    template.push('');
    template.push(`页面: "${pageName}"`);
    template.push(`recordCount: ${cases.length}`);
    template.push('');
    template.push(`元素映射:`);

    // 按类型分组
    const clicks = Array.from(pageSteps).filter(s => s.type === 'click');
    const inputs = Array.from(pageSteps).filter(s => s.type === 'input');

    template.push(`  按钮:`);
    for (const s of clicks) {
      template.push(`    ${formatStepAsYaml(s)}`);
    }

    template.push(`  输入框:`);
    for (const s of inputs) {
      template.push(`    ${formatStepAsYaml(s)}`);
    }

    const pageFileName = `${sanitizeFileName(pageName)}.yaml`;
    fs.writeFileSync(path.join(templatesDir, pageFileName), template.join('\n'), 'utf8');
  }

  // 按操作类型生成操作模板
  const opGroups = new Map<string, TestCaseBoundary[]>();
  for (const b of boundaries) {
    const key = b.operationType || '其他';
    if (!opGroups.has(key)) opGroups.set(key, []);
    opGroups.get(key)!.push(b);
  }

  for (const [opType, cases] of opGroups) {
    const opFileName = `操作-${sanitizeFileName(opType)}.yaml`;
    const content: string[] = [];
    content.push(`# 操作模板：${opType}`);
    content.push('');
    content.push(`操作类型: "${opType}"`);
    content.push(`recordCount: ${cases.length}`);
    content.push('');
    content.push(`用例列表:`);
    for (const c of cases) {
      content.push(`  - "${c.name}" (${c.boundaryMethod})`);
    }
    content.push('');
    content.push(`操作模式:`);
    // 取第一个用例的步骤作为参考
    const firstCase = cases[0];
    const firstSteps = allSteps.filter((_, i) =>
      i >= firstCase.startStepIndex && i <= firstCase.endStepIndex
    );
    for (const s of firstSteps) {
      content.push(`  - ${s.type}: ${s.selector}`);
    }

    fs.writeFileSync(path.join(templatesDir, opFileName), content.join('\n'), 'utf8');
  }

  console.log(`  ✓ 生成 ${pageGroups.size + opGroups.size} 个初始模板`);
}

function formatStepAsYaml(step: RecordedStep): string {
  return `- 描述: "${step.comment}"\n    primary: "${step.selector}"\n    fallbacks: [${step.fallbacks.slice(1).map(f => `"${f.selector}"`).join(', ')}]`;
}

// ─── 启动 ─────────────────────────────────────────────────────────────────────

main().catch((err) => {
  console.error('[dom-recorder] 启动失败：', err);
  process.exit(1);
});
