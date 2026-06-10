import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { chromium } from 'playwright';
import { spawn as spawnChild, spawnSync, ChildProcess } from 'child_process';
import * as http from 'http';
import { NetworkCapture, PageCaptureResult } from './network-capture';
import { OpenApiBuilder } from './openapi-builder';
import { ApifoxPusher } from './apifox-pusher';

const SKILL_DIR = path.resolve(__dirname, '..');
const DOM_RECORDER_DIR = path.resolve(SKILL_DIR, '..', 'dom-recorder');

dotenv.config({ path: path.resolve(DOM_RECORDER_DIR, '.env') });

const config = loadConfig();
const CAPTURE_PORT = config.capture.cdp_port;
const OUTPUT_DIR = path.resolve(SKILL_DIR, config.capture.output_dir);

interface AppConfig {
  apifox: { project_id: number; access_token: string; api_base_url: string };
  capture: { cdp_port: number; output_dir: string; wait_strategy: string; min_wait_ms: number; exclude_patterns: string[]; include_only: string[] };
  defaults: { timeout: number };
}

function loadConfig(): AppConfig {
  const cfgPath = path.resolve(SKILL_DIR, 'config.json');
  return JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
}

function getFilenameTimestamp(): string {
  const d = new Date();
  const p = (n: number, len = 2) => String(n).padStart(len, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
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

async function performLogin(page: any): Promise<void> {
  const loginPath = path.resolve(DOM_RECORDER_DIR, 'scripts', 'perform-login-lite.ts');
  const mod = require(loginPath);
  await mod.performLogin(page, { tag: '[apifox-sync]' });
}

interface MenuItem {
  category: string;
  name: string;
  level: number;
}

async function scanMenu(page: any): Promise<MenuItem[]> {
  console.log('[main] 扫描左侧菜单...');
  await page.waitForTimeout(2000);

  await page.evaluate(async () => {
    const unfoldBtn = document.querySelector('[aria-label="menu-unfold"], [aria-label="menu-fold"], .anticon-menu-unfold, .anticon-menu-fold');
    if (unfoldBtn) {
      const sider = document.querySelector('.ant-layout-sider') as HTMLElement;
      if (sider && sider.offsetWidth < 80) {
        (unfoldBtn as HTMLElement).click();
        await new Promise(r => setTimeout(r, 500));
      }
    }
  });
  await page.waitForTimeout(800);

  await page.evaluate(async () => {
    const submenuTitles = document.querySelectorAll('.ant-menu-submenu-title');
    for (const title of submenuTitles) {
      const el = title as HTMLElement;
      const parent = el.closest('.ant-menu-submenu');
      const isOpen = parent?.classList.contains('ant-menu-submenu-open') || parent?.classList.contains('ant-menu-submenu-selected');
      if (!isOpen) {
        el.click();
        await new Promise(r => setTimeout(r, 200));
      }
    }
    await new Promise(r => setTimeout(r, 500));
  });

  const items = await page.evaluate(() => {
    const results: Array<{ category: string; name: string; level: number }> = [];
    const submenus = document.querySelectorAll('.ant-menu-submenu');
    submenus.forEach((submenu) => {
      const titleEl = submenu.querySelector('.ant-menu-submenu-title');
      const titleText = (titleEl?.textContent || '').trim().split('\n')[0].trim().slice(0, 50);

      const subItems = submenu.querySelectorAll(':scope > .ant-menu-sub > .ant-menu-item');
      subItems.forEach((item) => {
        const link = item.querySelector('a');
        const name = (link?.textContent || item.textContent || '').trim().slice(0, 50);
        if (name) results.push({ category: titleText || '未分类', name, level: 2 });
      });

      const deepSubmenus = submenu.querySelectorAll('.ant-menu-submenu');
      deepSubmenus.forEach((deepSub) => {
        const deepTitle = (deepSub.querySelector('.ant-menu-submenu-title')?.textContent || '').trim().slice(0, 50);
        const deepItems = deepSub.querySelectorAll(':scope > .ant-menu-sub > .ant-menu-item');
        deepItems.forEach((item) => {
          const link = item.querySelector('a');
          const name = (link?.textContent || item.textContent || '').trim().slice(0, 50);
          if (name) results.push({ category: titleText + ' > ' + deepTitle, name, level: 3 });
        });
      });
    });

    const topItems = document.querySelectorAll('.ant-menu > .ant-menu-item');
    topItems.forEach((item) => {
      const link = item.querySelector('a');
      const name = (link?.textContent || item.textContent || '').trim().slice(0, 50);
      if (name && !results.some(r => r.name === name)) {
        results.push({ category: '', name, level: 1 });
      }
    });

    return results;
  });

  const uniqueItemMap = new Map<string, MenuItem>();
  for (const item of items) {
    if (!uniqueItemMap.has(item.name) || (item.category && !uniqueItemMap.get(item.name)!.category)) {
      uniqueItemMap.set(item.name, item);
    }
  }
  const uniqueItems = Array.from(uniqueItemMap.values());
  console.log(`[main] 📋 发现 ${items.length} 个菜单项（去重后 ${uniqueItems.length} 个唯一项）:`);
  const catMap = new Map<string, string[]>();
  for (const item of uniqueItems) {
    const cat = item.category || '根目录';
    if (!catMap.has(cat)) catMap.set(cat, []);
    catMap.get(cat)!.push(item.name);
  }
  for (const [cat, names] of catMap) {
    console.log(`  [${cat}]`);
    for (const name of names) console.log(`    - ${name}`);
  }

  return uniqueItems;
}

async function navigateToMenu(page: any, menuItem: MenuItem): Promise<boolean> {
  const maxRetries = 3;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const text = menuItem.name;
      const clicked = await page.evaluate((itemText: string) => {
        const menuItems = document.querySelectorAll('.ant-menu-item');
        for (const mi of menuItems) {
          if (mi.textContent?.trim().includes(itemText)) {
            (mi as HTMLElement).click();
            return true;
          }
        }
        return false;
      }, text);
      if (!clicked) return false;

      await page.waitForTimeout(3000);
      return true;
    } catch {
      await page.waitForTimeout(1000);
    }
  }
  return false;
}

async function main(): Promise<void> {
  const sessionTs = getFilenameTimestamp();
  const sessionDir = path.join(OUTPUT_DIR, `apifox-sync-${sessionTs}`);
  fs.mkdirSync(sessionDir, { recursive: true });
  const pagesDir = path.join(sessionDir, 'pages');
  fs.mkdirSync(pagesDir, { recursive: true });

  const headless = process.argv.includes('--headless');

  console.log('');
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║   apifox-sync v1 — 接口捕获 & 同步 Apifox        ║');
  console.log('╠════════════════════════════════════════════════════╣');
  console.log(`║  项目 ID: ${config.apifox.project_id}`);
  console.log(`║  输出目录: ${sessionDir}`);
  console.log('╚════════════════════════════════════════════════════╝');
  console.log('');

  const userDataDir = path.resolve('.auth/profile-apifox-sync');
  if (fs.existsSync(userDataDir)) {
    fs.rmSync(userDataDir, { recursive: true, force: true });
  }
  fs.mkdirSync(userDataDir, { recursive: true });

  const chromePath = findChrome();
  console.log(`[main] 使用 Chrome：${chromePath}`);

  let chromeProc: ChildProcess | null = null;
  if (!(await isCdpReady(CAPTURE_PORT))) {
    chromeProc = spawnChild(chromePath, [
      `--remote-debugging-port=${CAPTURE_PORT}`,
      `--user-data-dir=${userDataDir}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-extensions',
      '--disable-popup-blocking',
      '--ignore-certificate-errors',
      headless ? '--headless=new' : '--start-maximized',
      'about:blank',
    ], { detached: false, stdio: 'ignore' });

    console.log(`[main] 等待 Chrome CDP 端口 ${CAPTURE_PORT} 就绪...`);
    let ready = false;
    for (let i = 0; i < 40; i++) {
      await new Promise(r => setTimeout(r, 500));
      if (await isCdpReady(CAPTURE_PORT)) { ready = true; break; }
    }
    if (!ready) {
      chromeProc?.kill();
      throw new Error(`Chrome 启动超时`);
    }
  }

  const browser = await chromium.connectOverCDP(`http://localhost:${CAPTURE_PORT}`);
  const contexts = browser.contexts();
  const context = contexts.length > 0 ? contexts[0] : await browser.newContext();
  const pages = context.pages();
  const page = pages.length > 0 ? pages[0] : await context.newPage();

  console.log('[main] 开始自动登录...');
  await performLogin(page);
  console.log(`[main] ✓ 登录成功，当前页面：${page.url()}`);

  const menuItems = await scanMenu(page);

  if (menuItems.length === 0) {
    console.log('[main] ⚠ 未扫描到菜单项，将只捕获当前页面');
  }

  const capturer = new NetworkCapture({
    excludePatterns: config.capture.exclude_patterns,
    includeOnly: config.capture.include_only,
    minWaitMs: config.capture.min_wait_ms,
  });

  const MAX_PAGES = 50;
  const START_INDEX = parseInt(process.env.START_INDEX || '0', 10);
  const allResults: PageCaptureResult[] = [];
  const visited = new Set<string>();

  const itemsToVisit = menuItems.slice(START_INDEX, START_INDEX + MAX_PAGES);
  console.log(`\n[main] 将访问第 ${START_INDEX + 1}-${START_INDEX + itemsToVisit.length} 个页面（共 ${menuItems.length} 个）`);

  for (const item of itemsToVisit) {
    if (visited.has(item.name)) continue;
    visited.add(item.name);

    console.log(`\n[main] 📄 正在访问: ${item.name} (${item.category})`);

    capturer.start(page);

    const navPromise = navigateToMenu(page, item);
    const navResult = await Promise.race([
      navPromise,
      new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 5000)),
    ]);
    if (!navResult) {
      capturer.stop();
      console.log(`  ⚠ 无法导航到「${item.name}」，跳过`);
      continue;
    }

    console.log(`  ✓ 页面已加载: ${page.url()}`);

    await capturer.interactAndCapture(page);

    await page.waitForTimeout(config.capture.min_wait_ms);

    const apis = capturer.stop();
    console.log(`  📡 捕获到 ${apis.length} 个 API 请求`);

    if (apis.length > 0) {
      for (const api of apis.slice(0, 5)) {
        console.log(`    ${api.method} ${api.pathname} → ${api.statusCode}`);
      }
      if (apis.length > 5) {
        console.log(`    ... 还有 ${apis.length - 5} 个`);
      }
    }

    const result: PageCaptureResult = {
      menuName: item.name,
      menuCategory: item.category,
      url: page.url(),
      apis,
    };
    allResults.push(result);

    const pageJsonPath = path.join(pagesDir, `${sanitizeFileName(item.name)}.json`);
    fs.writeFileSync(pageJsonPath, JSON.stringify(result, null, 2), 'utf8');
  }

  if (allResults.length === 0) {
    console.log('[main] 捕获当前页面 API...');
    capturer.start(page);
    await page.waitForTimeout(config.capture.min_wait_ms);
    const apis = capturer.stop();
    allResults.push({
      menuName: '当前页面',
      menuCategory: '',
      url: page.url(),
      apis,
    });
  }

  console.log(`\n[main] 📊 构建 OpenAPI 规范...`);
  const builder = new OpenApiBuilder();
  const spec = builder.build(allResults);
  const yamlContent = builder.toYaml(spec);
  const jsonContent = builder.toJson(spec);

  const yamlPath = path.join(sessionDir, 'api-spec.yaml');
  const jsonPath = path.join(sessionDir, 'api-spec.json');
  fs.writeFileSync(yamlPath, yamlContent, 'utf8');
  fs.writeFileSync(jsonPath, jsonContent, 'utf8');
  console.log(`[main] ✓ OpenAPI 规范已生成:`);
  console.log(`  YAML: ${yamlPath}`);
  console.log(`  JSON: ${jsonPath}`);

  const totalApis = Object.values(spec.paths).reduce((sum, methods) => sum + Object.keys(methods).length, 0);
  console.log(`  共 ${allResults.length} 个页面, ${totalApis} 个接口`);

  console.log(`\n[main] 🔄 同步到 Apifox (项目 ${config.apifox.project_id})...`);
  const pusher = new ApifoxPusher(config.apifox);
  const syncResult = await pusher.push(spec, yamlContent);

  const reportPath = path.join(sessionDir, 'sync-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(syncResult, null, 2), 'utf8');
  console.log(`[main] ✓ 同步报告: ${reportPath}`);

  await browser.close().catch(() => {});
  if (chromeProc?.pid) {
    try {
      if (process.platform === 'win32') {
        spawnSync('taskkill', ['/PID', String(chromeProc.pid), '/F'], { timeout: 5000 });
      }
    } catch {}
  }

  console.log(`\n[main] ✨ 完成!`);
}

function sanitizeFileName(name: string): string {
  return name.replace(/[<>:"/\\|?*]/g, '').replace(/\s+/g, '-').slice(0, 50);
}

main().catch((err) => {
  console.error('[main] 错误:', err);
  process.exit(1);
});
