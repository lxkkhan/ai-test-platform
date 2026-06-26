/**
 * test-runner.js
 * 主编排器：读取测试点 → 登录 → 导航 → 逐条执行 → 保存结果
 *
 * 用法:
 *   node scripts/test-runner.js --page="客户管理-机构（全功能）" --area="搜索,按钮"
 *   node scripts/test-runner.js --page="客户管理-机构（全功能）" --type="必填校验"
 *   node scripts/test-runner.js --page="客户管理-机构（全功能）"             # 全部area
 *   node scripts/test-runner.js --list                                        # 列出可用页面
 */
const path = require('path');
const neo4jReader = require('./neo4j-reader');
const { executeTestCase } = require('./step-executor');
const { saveRun, listRuns } = require('./run-reporter');
const { launchBrowser, login } = require(path.resolve(__dirname, '..', '..', 'ai-test-executor', 'scripts', 'login-manager'));
const env = require(path.resolve(__dirname, '..', '..', 'ai-test-executor', 'scripts', 'env'));
const { navigateToPage } = require(path.resolve(__dirname, '..', '..', 'neo4j-scanner', 'scripts', 'menu-crawler'));
const neo4jWriter = require('./neo4j-writer');

const SYSTEM_NAME = '营销系统SIT';

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--list')) {
    console.log('\n📋 可用模块:');
    const modules = await neo4jReader.listModules();
    for (const m of modules) {
      const pages = await neo4jReader.listPages(m);
      console.log(`  📁 ${m} (${pages.records.length} 页)`);
      pages.records.forEach(r => console.log(`    📄 ${r.get('name')}`));
    }
    return;
  }

  if (args.includes('--runs')) {
    const runs = await listRuns();
    console.log('\n📋 执行历史:');
    runs.forEach(r => {
      console.log(`  ${r.id} | ${r.page} | ✅${r.passed} ❌${r.failed} ⚠️${r.errors} | ${(r.duration/1000).toFixed(0)}s`);
    });
    return;
  }

  const pageName = args.find(a => a.startsWith('--page='))?.split('=')[1];
  const areasArg = args.find(a => a.startsWith('--area='))?.split('=')[1];
  const typeArg = args.find(a => a.startsWith('--type='))?.split('=')[1];
  const areas = areasArg ? areasArg.split(',').map(a => a.trim()) : [];

  if (!pageName) {
    console.error('请指定页面: --page="客户管理-机构（全功能）"');
    process.exit(1);
  }

  console.log('╔══════════════════════════════╗');
  console.log('║   AI Test Runner             ║');
  console.log('╚══════════════════════════════╝');
  console.log(`页面: ${pageName}`);
  console.log(`区域: ${areas.length > 0 ? areas.join(', ') : '全部'}`);
  if (typeArg) console.log(`类型: ${typeArg}`);

  // 1. Read test cases from Neo4j
  console.log('\n[1/5] 读取测试用例...');
  const areaData = await neo4jReader.getTestCases(pageName, areas);
  if (areaData.length === 0) {
    console.log('未找到测试用例');
    return;
  }
  console.log(`[1/5] ✓ ${areaData.length} 个区域`);

  // Flatten and filter
  let allCases = [];
  for (const ad of areaData) {
    for (const tc of ad.testCases) {
      allCases.push({ ...tc, area: ad.area });
    }
  }
  if (typeArg) {
    allCases = allCases.filter(tc => tc.type === typeArg);
  }
  console.log(`[1/5] ✓ ${allCases.length} 条测试用例`);

  // 2. Launch browser
  console.log('\n[2/5] 启动浏览器...');
  const browser = await launchBrowser(false);
  let page = browser.page;
  console.log('[2/5] ✓');

  try {
    // 3. Login
    console.log('\n[3/5] 登录系统...');
    const sysConfig = env.getSystemConfig(SYSTEM_NAME);
    await login(page, sysConfig.login_url, sysConfig.username, sysConfig.password);

    // Enter portal
    for (let r = 0; r < 3; r++) {
      const onPortal = await page.evaluate(() =>
        [...document.querySelectorAll('*')].some(el =>
          el.offsetParent && [...el.childNodes].filter(n => n.nodeType === 3).some(n => n.textContent.trim() === '营销系统saas-SIT')));
      if (!onPortal) break;
      await page.evaluate(() => {
        for (const el of [...document.querySelectorAll('*')]) {
          if (el.offsetParent === null) continue;
          const t = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).filter(Boolean);
          if (t.some(x => x === '营销系统saas-SIT')) { el.click(); return; }
        }
      });
      await page.waitForTimeout(3000);
    }
    const pages = page.context().pages();
    if (pages.length > 1) page = pages[pages.length - 1];
    console.log('[3/5] ✓');

    // Mark all as waiting in Neo4j
    await neo4jWriter.setAllTestCasesWaiting(pageName, areas.length > 0 ? areas[0] : null);

    // 4. Execute test cases
    console.log(`\n[4/5] 执行 ${allCases.length} 条测试用例...`);
    console.log('  实时查看进度: Neo4j Browser → MATCH (tc:TestCase) RETURN tc.lastRunStatus, count(tc)');
    const startedAt = new Date().toISOString();
    const startTime = Date.now();

    // Navigate to the page via its hash route
    const baseUrl = page.url().split('#')[0];
    
    // First expand sidebar + submenus
    await page.evaluate(() => {
      const svg = document.querySelector('aside svg, .ant-layout-sider svg');
      if (svg) (svg.closest('span') || svg.parentElement).click();
    });
    await page.waitForTimeout(2000);
    // Expand all submenus
    for (let i = 0; i < 5; i++) {
      const n = await page.evaluate(() => {
        let c = 0;
        document.querySelectorAll('.ant-menu-submenu:not(.ant-menu-submenu-open)').forEach(sm => {
          const t = sm.querySelector('.ant-menu-submenu-title');
          if (t && t.offsetParent !== null) { t.click(); c++; }
        });
        return c;
      });
      if (n === 0) break;
      await page.waitForTimeout(1500);
    }

    // Now get menu routes
    const menuRoutes = await page.evaluate(() => {
      const map = {};
      document.querySelectorAll('.ant-menu-item').forEach(item => {
        const name = item.textContent.trim();
        const route = item.getAttribute('data-menu-id') || '';
        if (name && route) map[name] = route;
      });
      return map;
    });
    // Try matching by partial name (Neo4j name may differ slightly from menu)
    const matchedKey = Object.keys(menuRoutes).find(k => k.includes(pageName) || pageName.includes(k));
    const targetRoute = matchedKey ? menuRoutes[matchedKey] : menuRoutes[pageName];
    if (targetRoute && targetRoute !== '/sysmp/user-center') {
      console.log(`  → 导航到 ${targetRoute}`);
      await page.goto(baseUrl + '#' + targetRoute, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(2000);
    } else {
      console.log(`  → 无精确路由，尝试模糊匹配`);
      // Debug: print available routes
      const available = Object.keys(menuRoutes).filter(k => k.includes('客户'));
      console.log(`  → 匹配的菜单项: ${available.join(', ') || '无'}`);
      // Try clicking any matching menu item
      await page.evaluate((name) => {
        const items = document.querySelectorAll('.ant-menu-item');
        for (const item of items) {
          const t = item.textContent.trim();
          // Try exact match first, then contains
          if (t === name || t.includes(name) || name.includes(t)) {
            if (item.offsetParent !== null) { item.click(); return; }
          }
        }
      }, pageName);
      await page.waitForTimeout(2000);
    }
    console.log(`  → 当前URL: ${page.url().substring(0, 100)}`);

    const results = [];
    for (let i = 0; i < allCases.length; i++) {
      const tc = allCases[i];
      process.stdout.write(`  [${i+1}/${allCases.length}]`);
      
      // Set running status in Neo4j
      await neo4jWriter.setTestCaseRunning(tc.id);
      
      const r = await executeTestCase(page, tc);
      results.push(r);
      
      // Set result status in Neo4j
      await neo4jWriter.setTestCaseResult(tc.id, r.status, r.error, r.screenshot);
      
      console.log(` ${r.status === 'pass' ? '✅' : r.status === 'fail' ? '❌' : '⚠️'} ${r.status}`);
    }

    const duration = Date.now() - startTime;
    console.log(`[4/5] ✓ 完成 (${(duration / 1000).toFixed(1)}s)`);

    // 5. Save results
    console.log('\n[5/5] 保存执行结果...');
    const runId = `run_${Date.now()}`;
    saveRun(runId, {
      page: pageName,
      areas: areas.length > 0 ? areas : areaData.map(a => a.area),
      startedAt,
      duration,
    }, results);

    const passed = results.filter(r => r.status === 'pass').length;
    const failed = results.filter(r => r.status === 'fail').length;
    const errors = results.filter(r => r.status === 'error').length;
    console.log(`\n📊 汇总: ✅ ${passed} 通过 | ❌ ${failed} 失败 | ⚠️ ${errors} 异常`);

  } catch (e) {
    console.error('\n✗ 执行失败:', e.message);
  } finally {
    await browser.context.close().catch(() => {});
    console.log('\n浏览器已关闭');
  }
}

main().catch(console.error);
