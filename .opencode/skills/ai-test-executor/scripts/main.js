const { launchBrowser, login } = require('./login-manager');
const { navigateToPage } = require('./navigator');
const { analyzeForm } = require('./form-analyzer');
const { generateTestCases } = require('./data-generator');
const { executeTestCase } = require('./executor');
const { generateReport } = require('./reporter');
const { getToken, getTaskOwner, createTAPDTestCase, submitBug, calculateDueDate } = require('./tapd-helper');
const env = require('./env');

const readline = require('readline');
const fs = require('fs');
const path = require('path');

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, answer => { rl.close(); resolve(answer.trim()); }));
}

async function main() {
  // Parse command line args
  const args = process.argv.slice(2);
  const pathArg = args.find(a => a.startsWith('--path='))?.replace('--path=', '') || args[0] || '';
  const action = args.find(a => a === '新增' || a === '修改') || '新增';
  const storyArg = args.find(a => a.startsWith('--story='))?.replace('--story=', '') ||
                   args.find(a => a.startsWith('--sid='))?.replace('--sid=', '') ||
                   args.find(a => /^\d+$/.test(a)) || '';

  // Parse path - first part might be system name
  const pathParts = pathArg.split(/[-–—/\\]+/).filter(Boolean);
  if (pathParts.length === 0) {
    console.error('请提供路径，如 --path="营销系统SIT-基础数据-客户管理-机构（全功能）"');
    process.exit(1);
  }

  // Detect system name from first path part
  const systemNames = Object.keys(env.systemConfigs);
  let systemName = env.DEFAULT_SYSTEM;
  let menuPathParts = pathParts;
  // Check if first path part matches a system name (partial match)
  for (const sn of systemNames) {
    if (pathParts[0].includes(sn) || sn.includes(pathParts[0])) {
      systemName = sn;
      menuPathParts = pathParts.slice(1);
      break;
    }
  }
  const sysConfig = env.getSystemConfig(systemName);

  console.log('╔══════════════════════════════════════╗');
  console.log('║   AI Test Executor - 智能测试执行器   ║');
  console.log('╚══════════════════════════════════════╝');
  console.log(`系统: ${systemName}`);
  console.log(`路径: ${menuPathParts.join(' → ')}`);
  console.log(`操作: ${action}`);
  console.log(`关联需求: ${storyArg || '无'}`);
  console.log('');

  // Step 1: Launch browser
  console.log('[1/8] 启动浏览器...');
  const browser = await launchBrowser(false);
let page = browser.page;
const context = browser.context;
const tmpDir = browser.tmpDir;
  console.log('[1/8] ✓ 浏览器已启动');

  try {
    // Step 2: Login
    console.log('[2/8] 登录系统...');
    await login(page, sysConfig.login_url, sysConfig.username, sysConfig.password);
    console.log('[2/8] ✓ 登录成功');

    // Step 3: Navigate
    console.log('[3/8] 导航到目标页面...');
    const navPage = await navigateToPage(page, menuPathParts, systemName);
    if (navPage) page = navPage;
    console.log('[3/8] ✓ 导航完成');

    // Step 4: Analyze form
    console.log('[4/8] 分析表单字段...');
    const { fields, fieldCount, error } = await analyzeForm(page);
    if (error) { console.error('[4/8] ✗', error); return; }
    console.log(`[4/8] ✓ 发现 ${fieldCount} 个字段：`);
    fields.forEach((f, i) => {
      const reqMark = f.required ? ' *' : '';
      const opts = f.options.length > 0 ? ` [${f.options.map(o => o.text).join(', ')}]` : '';
      console.log(`       ${i+1}. ${f.label} (${f.type})${reqMark}${opts}`);
    });

    // Step 5: Generate test cases
    console.log('[5/8] 生成测试用例...');
    const allCases = generateTestCases(fields, action);
    console.log(`[5/8] ✓ 生成 ${allCases.length} 条用例`);

    // Step 6: User selects cases
    console.log('[6/8] 用户确认用例...');
    console.log('\n📋 待执行用例清单（共' + allCases.length + '条）：');
    allCases.forEach((tc, i) => {
      console.log(`  [${i+1}] ${tc.name} → ${tc.expected}`);
    });

    // Default: run all
    console.log('\n按回车执行全部用例，或输入序号范围（如 1-5,7,9）:');
    const selection = await ask('> ');
    let selectedIndices;
    if (!selection.trim()) {
      selectedIndices = allCases.map((_, i) => i);
    } else {
      selectedIndices = [];
      selection.split(',').forEach(part => {
        if (part.includes('-')) {
          const [s, e] = part.split('-').map(Number);
          for (let i = s - 1; i < e; i++) selectedIndices.push(i);
        } else {
          selectedIndices.push(Number(part) - 1);
        }
      });
    }
    const selectedCases = selectedIndices.map(i => allCases[i]).filter(Boolean);
    console.log(`[6/8] ✓ 选中 ${selectedCases.length} 条用例`);

    // Step 7: Execute
    console.log('[7/8] 执行测试...');
    const results = [];
    for (let i = 0; i < selectedCases.length; i++) {
      const tc = selectedCases[i];
      console.log(`\n[执行 ${i+1}/${selectedCases.length}] ${tc.name}`);
      const result = await executeTestCase(page, tc, fields);
      results.push(result);
      const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
      console.log(`  ${icon} ${result.status.toUpperCase()}${result.error ? ': ' + result.error : ''}`);

      // Refresh page for next test case
      if (i < selectedCases.length - 1) {
        console.log('  重置页面...');
        await page.goto(page.url(), { waitUntil: 'domcontentloaded' }).catch(() => {});
        await page.waitForTimeout(2000);
      }
    }

    // Step 8: Report
    console.log('\n[8/8] 生成报告...');
    const meta = {
      page: `${systemName} → ${menuPathParts.join(' → ')}`,
      action,
      storyId: storyArg,
      timestamp: new Date().toLocaleString(),
    };
    const reportPath = generateReport(results, meta);
    console.log(`[8/8] ✓ 报告: ${reportPath}`);

    // Summary
    const passed = results.filter(r => r.status === 'pass').length;
    const failed = results.filter(r => r.status === 'fail').length;
    const errors = results.filter(r => r.status === 'error').length;
    console.log(`\n📊 汇总: ✅ ${passed} 通过 | ❌ ${failed} 失败 | ⚠️ ${errors} 异常`);

    // Write to TAPD test cases if story provided
    if (storyArg) {
      console.log('\n[+] 写入TAPD测试用例...');
      const token = getToken();
      results.forEach(r => createTAPDTestCase(r, storyArg, token));
    }

    // Handle failures
    const failures = results.filter(r => r.status === 'fail');
    if (failures.length > 0) {
      console.log(`\n[!] ${failures.length} 条失败用例`);
      for (const f of failures) {
        console.log(`\n❌ ${f.name}`);
        console.log(`  期望: ${f.expected}`);
        console.log(`  截图: screenshots/${f.screenshot}`);

        const isBug = await ask('  这是缺陷吗？(y/N) ');
        if (isBug.toLowerCase() === 'y' && storyArg) {
          const token = getToken();
          const owner = getTaskOwner(storyArg, token);
          console.log(`  处理人: ${owner}`);

          const confirmBug = await ask(`  确认提交Bug到需求 #${storyArg}，处理人=${owner}？(Y/n) `);
          if (confirmBug.toLowerCase() !== 'n') {
            const dueDate = calculateDueDate(2);
            const bugId = submitBug(f, f.screenshot, storyArg, owner, dueDate, token);
            if (bugId) {
              console.log(`  ✅ Bug已提交: #${bugId}, 预期修复: ${dueDate}`);
            }
          }
        }
      }
    }

  } catch (e) {
    console.error('\n✗ 执行失败:', e.message);
    console.error(e.stack);
  } finally {
    if (context) await context.close().catch(() => {});
    console.log('\n浏览器已关闭');
  }
}

main().catch(e => { console.error(e); process.exit(1); });
