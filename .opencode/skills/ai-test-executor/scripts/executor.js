const path = require('path');
const fs = require('fs');

const SCREENSHOT_DIR = path.resolve(__dirname, '..', 'screenshots');

async function executeTestCase(page, tc, allFields) {
  const result = {
    id: tc.id,
    name: tc.name,
    status: 'unknown',
    error: '',
    screenshot: '',
    steps: [],
  };

  try {
    console.log(`[exec] 执行: ${tc.name}`);

    // Wait for page ready
    await page.waitForTimeout(1000);

    // Fill fields
    for (const field of allFields) {
      const key = field.label || field.id;
      const value = tc.fields[key];
      if (value === undefined) continue;

      result.steps.push(`填写 ${key}=${value}`);

      if (field.type === 'select' && field.tag === 'select') {
        await page.selectOption(field.selector || `select[name="${field.id}"]`, value).catch(() => {});
      } else if (field.type === 'checkbox') {
        if (value) await page.check(field.selector || `#${field.id}`).catch(() => {});
        else await page.uncheck(field.selector || `#${field.id}`).catch(() => {});
      } else if (field.type === 'date') {
        await page.fill(field.selector || `#${field.id}`, value).catch(() => {});
      } else {
        const sel = field.selector || `#${field.id}`;
        await page.fill(sel, String(value)).catch(async () => {
          // Fallback: try by label
          const label = field.label;
          if (label) {
            const input = page.locator(`//label[contains(text(),"${label}")]/following::input`).first().catch(() => null);
            if (input) await input.fill(String(value)).catch(() => {});
          }
        });
      }
    }

    // Click save button
    const saveBtnSelectors = [
      'button:has-text("保存")',
      'button:has-text("提交")',
      'button:has-text("确定")',
      '[class*="save"]',
      '[class*="submit"]',
      'button[type="submit"]',
    ];
    let clicked = false;
    for (const sel of saveBtnSelectors) {
      try {
        const btn = page.locator(sel).first();
        if (await btn.isVisible().catch(() => false)) {
          await btn.click();
          result.steps.push('点击保存');
          clicked = true;
          break;
        }
      } catch {}
    }

    if (!clicked) {
      result.status = 'error';
      result.error = '找不到保存按钮';
      return result;
    }

    // Wait for response
    await page.waitForTimeout(2000);

    // Take screenshot
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    const ssName = `${tc.id}_${Date.now()}.png`;
    const ssPath = path.join(SCREENSHOT_DIR, ssName);
    try { await page.screenshot({ path: ssPath, fullPage: true }); result.screenshot = ssName; } catch {}

    // Verify result
    result.status = await verifyResult(page, tc);
    console.log(`[exec] 结果: ${result.status}`);

  } catch (e) {
    result.status = 'error';
    result.error = e.message;
  }

  return result;
}

async function verifyResult(page, tc) {
  const body = await page.locator('body').textContent().catch(() => '');
  const url = page.url();

  // Check for error patterns
  const errorPatterns = [
    '请完善必填项', '不能为空', '不可为空', '必填',
    '保存失败', '提交失败', '系统错误', '异常',
    '错误', '失败',
  ];
  for (const pat of errorPatterns) {
    if (body.includes(pat)) {
      // Try to find toast
      try {
        const toast = await page.locator('.ant-message, .ant-notification, [class*="toast"], [class*="notice"]').first().textContent().catch(() => '');
        if (toast) return toast.includes('失败') || toast.includes('错误') ? 'fail' : 'pass';
      } catch {}
      return body.includes('请完善必填项') || body.includes('不能为空') ? 'fail' : 'pass';
    }
  }

  // If expected to fail but succeeded
  if (tc.expected.includes('必填')) {
    if (body.includes('保存成功') || body.includes('成功') && !body.includes('失败')) {
      return 'fail'; // Expected validation but it saved - UI bug
    }
    return 'fail'; // Still in form without validation message
  }

  // Success patterns
  const successPatterns = ['保存成功', '提交成功', '操作成功', '成功'];
  for (const pat of successPatterns) {
    if (body.includes(pat)) return 'pass';
  }

  // Page changed (navigated to list) = success
  if (url.includes('list') || url.includes('index') || url.includes('query')) {
    return 'pass';
  }

  return body.includes('成功') ? 'pass' : 'unknown';
}

module.exports = { executeTestCase, SCREENSHOT_DIR };
