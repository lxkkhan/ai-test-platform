const path = require('path');
const fs = require('fs');
const { launchBrowser, login } = require(path.resolve(__dirname, '..', '..', 'ai-test-executor', 'scripts', 'login-manager'));
const env = require(path.resolve(__dirname, '..', '..', 'ai-test-executor', 'scripts', 'env'));
const { crawlTargetModules, flattenPages } = require('./menu-crawler');
const { analyzePage } = require('./page-analyzer');
const neo4j = require('./neo4j-client');

const TARGET_MODULES = ['基础数据', '宣传物料管理'];
const SYSTEM_NAME = '营销系统SIT';

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const skipNav = args.includes('--skip-nav'); // skip navigation to pages

  console.log('╔══════════════════════════════╗');
  console.log('║   Neo4j 页面扫描器 v2       ║');
  console.log('╚══════════════════════════════╝');
  console.log(`系统: ${SYSTEM_NAME}`);
  console.log(`模块: ${TARGET_MODULES.join(', ')}`);

  const browser = await launchBrowser(false);
  let page = browser.page;

  try {
    const sysConfig = env.getSystemConfig(SYSTEM_NAME);
    await login(page, sysConfig.login_url, sysConfig.username, sysConfig.password);

    // Click portal app
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

    // Expand sidebar
    await page.evaluate(() => {
      const svg = document.querySelector('aside svg, .ant-layout-sider svg');
      if (svg) (svg.closest('span') || svg.parentElement).click();
    });
    await page.waitForTimeout(2000);

    // Scan menu tree
    let targetModules, allPages;
    for (let retry = 0; retry < 5; retry++) {
      targetModules = await crawlTargetModules(page, TARGET_MODULES);
      allPages = flattenPages(targetModules);
      if (allPages.length > 0) break;
      await page.goto(page.url().split('#')[0] + '#/sysmp/user-center', { waitUntil: 'domcontentloaded' }).catch(() => {});
      await page.waitForTimeout(5000);
    }
    console.log(`\n共 ${allPages.length} 个页面`);
    if (allPages.length === 0) throw new Error('未找到页面');

    // Get routes map
    const menuRoutes = await page.evaluate(() => {
      const map = {};
      document.querySelectorAll('.ant-menu-item').forEach(item => {
        const name = item.textContent.trim();
        const route = item.getAttribute('data-menu-id') || '';
        if (name && route) map[name] = route;
      });
      document.querySelectorAll('.ant-menu-submenu .ant-menu-item').forEach(item => {
        const name = item.textContent.trim();
        const route = item.getAttribute('data-menu-id') || '';
        if (name && route && !map[name]) map[name] = route;
      });
      return map;
    });
    console.log(`获取到 ${Object.keys(menuRoutes).length} 个路由`);

    // Analyze each page via hash navigation
    const baseUrl = page.url().split('#')[0];
    const allResults = [];

    for (let i = 0; i < allPages.length; i++) {
      const pg = allPages[i];
      const route = menuRoutes[pg.name];

      if (!route || route === '/sysmp/user-center') {
        console.log(`\n[${i+1}/${allPages.length}] ⏭ ${pg.name} (无路由)`);
        continue;
      }

      console.log(`\n[${i+1}/${allPages.length}] ${pg.name}`);

      // Before navigating: handle any leftover confirmation dialogs
      for (let c = 0; c < 3; c++) {
        const handled = await page.evaluate(() => {
          document.querySelectorAll('.ant-modal-close').forEach(el => { if (el.offsetParent !== null) el.click(); });
          const btns = document.querySelectorAll('button');
          let done = false;
          btns.forEach(b => {
            const t = b.textContent.trim();
            if (['确认','确定','是'].includes(t) && b.offsetParent !== null && b.closest('.ant-modal-confirm,.ant-modal')) {
              b.click(); done = true;
            }
          });
          return done;
        });
        if (!handled) break;
        await page.waitForTimeout(500);
      }

      await page.goto(baseUrl + '#' + route, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(1500);

      const pageResult = await analyzePage(page, pg.name);
      pageResult.path = pg.path;
      allResults.push(pageResult);
    }

    // Save JSON
    const outPath = path.resolve(__dirname, '..', 'scan-result.json');
    fs.writeFileSync(outPath, JSON.stringify(allResults, null, 2), 'utf8');
    console.log(`\n✅ 分析完成: ${allResults.length} 个页面`);

    // Write to Neo4j
    if (!dryRun) {
      await neo4j.verifyConnect();
      await neo4j.runInTransaction(async (tx) => {
        for (const res of allResults) {
          // Module hierarchy
          for (let i = 0; i < res.path.length - 1; i++) {
            const modName = res.path[i];
            const parentName = i > 0 ? res.path[i - 1] : null;
            if (modName) await neo4j.mergeModule(tx, { name: modName, level: i + 1, parentName });
          }
          const parentModule = res.path[res.path.length - 2] || res.path[0];

          // Page node
          await neo4j.mergePage(tx, { name: res.name, url: res.url, moduleName: parentModule });

          // Search fields
          for (const f of res.searchFields) {
            await neo4j.mergeField(tx, { label: f.label, type: f.type, required: f.required, pageName: res.name });
          }

          // Create form fields
          for (const f of res.createForm) {
            await neo4j.mergeField(tx, { label: `[新增]${f.label}`, type: f.type, required: f.required, pageName: res.name });
          }

          // Action buttons
          for (const btn of res.actionButtons) {
            await neo4j.mergeOperation(tx, { name: btn, type: mapOpType(btn), pageName: res.name });
          }

          // Test points
          for (const tp of res.testPoints) {
            const tpId = `${res.name}::${tp.field || ''}::${tp.type || ''}::${tp.area || ''}`;
            const stepsJson = JSON.stringify(tp.steps || []);
            await tx.run(`
              MERGE (t:TestPoint {id: $tpId})
              SET t.area = $area, t.type = $type, t.field = $field,
                  t.mode = $mode, t.precondition = $precondition,
                  t.steps = $steps, t.expected = $expected,
                  t.testData = $testData
            `, {
              tpId, area: tp.area || '', type: tp.type || '', field: tp.field || '',
              mode: tp.mode || '', precondition: tp.precondition || '',
              steps: stepsJson, expected: tp.expected || '', testData: tp.testData || '',
            });
            await tx.run(`
              MATCH (p:Page {name: $pageName})
              MATCH (t:TestPoint {id: $tpId})
              MERGE (p)-[:HAS_TESTPOINT]->(t)
            `, { pageName: res.name, tpId });
          }
        }
      });
      console.log('✅ 已写入 Neo4j');

      // Stats
      const stats = await neo4j.runQuery(`
        MATCH (n) RETURN labels(n)[0] as type, count(n) as count ORDER BY count DESC
      `);
      console.log('\n📊 图谱统计:');
      stats.records.forEach(r => console.log(`  ${r.get('type')}: ${r.get('count')}`));
    }

  } catch (e) {
    console.error('✗', e.message);
  } finally {
    await neo4j.close();
    await browser.context.close();
  }
}

function mapOpType(name) {
  const map = { '新增':'create','修改':'update','删除':'delete','启用':'enable','停用':'disable',
    '导出':'export','导入':'import','保存':'submit','提交':'submit','查询':'query','重置':'reset' };
  return map[name] || 'other';
}

main().catch(console.error);
