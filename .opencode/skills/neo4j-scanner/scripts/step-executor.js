/**
 * step-executor.js
 * 解析并执行「步骤」字符串： "【字段名】操作"
 */
const path = require('path');
const fs = require('fs');

const RUNS_DIR = path.resolve(__dirname, '..', '..', '..', '.ai-test-runs');

async function executeTestCase(page, testCase) {
  const result = {
    id: testCase.id,
    type: testCase.type,
    field: testCase.field,
    status: 'unknown',
    error: '',
    screenshot: '',
    steps: [],
    startedAt: new Date().toISOString(),
  };

  try {
    console.log(`\n  ▶ ${testCase.field} | ${testCase.type}`);
    result.steps.push(`开始: ${testCase.precondition || '无前置条件'}`);

    // Parse and execute steps
    const steps = parseSteps(testCase.steps);
    for (const step of steps) {
      result.steps.push(`执行: ${step.raw}`);
      await executeStep(page, step);
    }

    // Verify
    result.status = await verifyResult(page, testCase);
    result.steps.push(`结果: ${result.status}`);

  } catch (e) {
    result.status = 'error';
    result.error = e.message;
  }

  result.finishedAt = new Date().toISOString();

  // Take screenshot (always)
  try {
    fs.mkdirSync(RUNS_DIR, { recursive: true });
    const ssName = `${testCase.id.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.png`;
    const ssPath = path.join(RUNS_DIR, 'screenshots', ssName);
    fs.mkdirSync(path.dirname(ssPath), { recursive: true });
    await page.screenshot({ path: ssPath, fullPage: true });
    result.screenshot = ssName;
  } catch {}

  return result;
}

function parseSteps(stepsJson) {
  if (!stepsJson) return [];
  try {
    const steps = JSON.parse(stepsJson);
    return steps.map(s => {
      const parsed = { raw: s };

      // "【字段名】输入测试值" → fill field
      const fillMatch = s.match(/【(.+?)】输入(.+)/);
      if (fillMatch) {
        parsed.action = 'fill';
        parsed.field = fillMatch[1].trim();
        parsed.value = fillMatch[2].trim();
        return parsed;
      }

      // "【字段名】选择【选项】" → select option
      const selectMatch = s.match(/【(.+?)】选择【(.+?)】/);
      if (selectMatch) {
        parsed.action = 'select';
        parsed.field = selectMatch[1].trim();
        parsed.value = selectMatch[2].trim();
        return parsed;
      }

      // "【字段名】留空" → skip
      const emptyMatch = s.match(/【(.+?)】留空/);
      if (emptyMatch) {
        parsed.action = 'skip';
        parsed.field = emptyMatch[1].trim();
        return parsed;
      }

      // "点击【按钮】" → click button
      const clickMatch = s.match(/点击【(.+?)】/);
      if (clickMatch) {
        parsed.action = 'click';
        parsed.field = clickMatch[1].trim();
        return parsed;
      }

      // "选中一条数据" → click first row
      if (s.includes('选中一条') || s.includes('选中数据')) {
        parsed.action = 'click';
        parsed.field = 'firstRow';
        return parsed;
      }

      // Default: just log
      parsed.action = 'log';
      return parsed;
    });
  } catch {
    return [{ action: 'log', raw: stepsJson }];
  }
}

async function executeStep(page, step) {
  switch (step.action) {
    case 'fill':
      await fillField(page, step.field, step.value);
      break;
    case 'select':
      await selectOption(page, step.field, step.value);
      break;
    case 'skip':
      // Do nothing - leave field empty
      break;
    case 'click':
      await clickElement(page, step.field);
      break;
    case 'log':
    default:
      await page.waitForTimeout(500);
      break;
  }
  await page.waitForTimeout(300);
}

async function fillField(page, fieldName, value) {
  let actualValue = value;
  if (value === '正常测试值' || value === '正常值') actualValue = '测试';
  if (value.includes('特殊字符')) actualValue = '@#$%';

  const label = fieldName.trim();

  // Strategy 1: find label → get input by Native JS setter (handles React/Ant Design)
  const filled = await page.evaluate(({ lbl, val }) => {
    const labels = [...document.querySelectorAll('label')];
    for (const l of labels) {
      if (!l.textContent.trim().includes(lbl)) continue;
      // Method A: label[for] → input#id
      const forId = l.getAttribute('for');
      if (forId) {
        const input = document.getElementById(forId);
        if (input) {
          const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          nativeSetter.call(input, val);
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }
      }
      // Method B: same form-item → input
      const formItem = l.closest('.ant-form-item');
      if (formItem) {
        const input = formItem.querySelector('input, textarea');
        if (input) {
          const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          nativeSetter.call(input, val);
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }
      }
    }
    return false;
  }, { lbl: label, val: actualValue });

  if (filled) return;

  // Fallback: Playwright locator
  try {
    const input = page.locator(`//span[contains(@class,"default-label")][contains(text(),"${label}")]/ancestor::div[contains(@class,"ant-form-item")]//input`).first();
    if (await input.count() > 0) { await input.fill(actualValue); return; }
  } catch {}

  console.log(`  ⚠ 未找到字段: ${label}`);
}

async function selectOption(page, fieldName, option) {
  const label = fieldName.replace(/[#\d]/g, '').trim();

  // Strategy 1: Ant Design form-item
  try {
    const item = page.locator(`.ant-form-item:has(label:text("${label}"))`);
    if (await item.count() > 0) {
      const antSelect = item.locator('.ant-select-selector, select');
      if (await antSelect.count() > 0) {
        await antSelect.first().click();
        await page.waitForTimeout(500);
        const opt = page.locator(`.ant-select-item-option:has-text("${option}")`).first();
        if (await opt.isVisible().catch(() => false)) {
          await opt.click();
          return;
        }
      }
    }
  } catch {}

  // Strategy 2: native select
  try {
    const select = page.locator(`//label[contains(text(),"${label}")]/following::select[1]`);
    if (await select.count() > 0) {
      await select.first().selectOption(option);
      return;
    }
  } catch {}

  console.log(`  ⚠ 未找到下拉框: ${fieldName} 选项: ${option}`);
}

async function clickElement(page, elementName) {
  if (elementName === 'firstRow') {
    try {
      const row = page.locator('.ant-table-row').first();
      if (await row.isVisible().catch(() => false)) {
        await row.click();
        return;
      }
    } catch {}
    return;
  }

  // Try various selectors
  const selectors = [
    `button:has-text("${elementName}")`,
    `a:has-text("${elementName}")`,
    `[class*="ant-btn"]:has-text("${elementName}")`,
    `span:has-text("${elementName}")`,
  ];
  for (const sel of selectors) {
    try {
      const el = page.locator(sel).first();
      if (await el.isVisible().catch(() => false)) {
        await el.click();
        return;
      }
    } catch {}
  }

  console.log(`  ⚠ 未找到元素: ${elementName}`);
}

async function verifyResult(page, testCase) {
  const expected = testCase.expected || '';
  await page.waitForTimeout(1500);

  // Check for toast messages (Ant Design)
  try {
    const toast = page.locator('.ant-message, .ant-notification, [class*="toast"]').first();
    if (await toast.isVisible().catch(() => false)) {
      const toastText = await toast.textContent();
      if (toastText.includes('成功')) return 'pass';
      if (toastText.includes('必填') || toastText.includes('不能为空')) return 'pass';
      if (toastText.includes('失败') || toastText.includes('错误') || toastText.includes('异常')) return 'fail';
    }
  } catch {}

  // Check body text
  const body = await page.locator('body').textContent().catch(() => '');

  if (expected.includes('必填') || expected.includes('提示')) {
    if (body.includes('必填') || body.includes('不能为空') || body.includes('请完善')) return 'pass';
  }

  if (body.includes('保存成功') || body.includes('操作成功')) return 'pass';
  if (body.includes('失败') || body.includes('错误') || body.includes('异常')) return 'fail';

  // Check if fields actually changed (form reset means save succeeded)
  const url = page.url();
  if (url.includes('list') || url.includes('query') || !url.includes('user-center')) return 'pass';

  return 'unknown';
}

module.exports = { executeTestCase, RUNS_DIR };
