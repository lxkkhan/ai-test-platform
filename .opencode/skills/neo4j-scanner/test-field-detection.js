const path = require('path');
const { launchBrowser, login } = require(path.resolve(__dirname, '..', 'ai-test-executor', 'scripts', 'login-manager'));
const env = require(path.resolve(__dirname, '..', 'ai-test-executor', 'scripts', 'env'));
(async () => {
  const browser = await launchBrowser(false);
  let page = browser.page;
  const sysConfig = env.getSystemConfig('营销系统SIT');
  await login(page, sysConfig.login_url, sysConfig.username, sysConfig.password);
  for (let r = 0; r < 3; r++) {
    const onPortal = await page.evaluate(() => [...document.querySelectorAll('*')].some(el => 
      el.offsetParent && [...el.childNodes].filter(n => n.nodeType === 3).some(n => n.textContent.trim() === '营销系统saas-SIT')));
    if (!onPortal) break;
    await page.evaluate(() => { for (const el of [...document.querySelectorAll('*')]) {
      if (el.offsetParent === null) continue;
      const t = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).filter(Boolean);
      if (t.some(x => x === '营销系统saas-SIT')) { el.click(); return; }
    }});
    await page.waitForTimeout(3000);
  }
  await page.goto('https://tcm-dc-sit.zgzykg.com.cn/yxxtSaas/#/YxxtCustomerManageBillOrg', { waitUntil: 'domcontentloaded' }).catch(() => {});
  await page.waitForTimeout(3000);
  
  // Test field detection
  const testFields = ['单位名称', '业务单元', '客户类别', '启用标志', '往来地区'];
  for (const f of testFields) {
    const result = await page.evaluate((label) => {
      const labels = [...document.querySelectorAll('label')];
      for (const l of labels) {
        if (l.textContent.trim().includes(label)) {
          const forId = l.getAttribute('for');
          if (forId) {
            const input = document.getElementById(forId);
            return { found: true, method: 'forAttr', forId, inputTag: input?.tagName, inputType: input?.type };
          }
          const formItem = l.closest('.ant-form-item');
          if (formItem) {
            const input = formItem.querySelector('input:not([type="hidden"])');
            return { found: true, method: 'formItem', inputTag: input?.tagName, inputType: input?.type };
          }
        }
      }
      return { found: false };
    }, f);
    console.log(f + ':', JSON.stringify(result));
  }
  
  // Try filling a field
  const filled = await page.evaluate((lbl) => {
    const labels = [...document.querySelectorAll('label')];
    for (const l of labels) {
      if (l.textContent.trim().includes(lbl)) {
        const forId = l.getAttribute('for');
        if (forId) {
          const input = document.getElementById(forId);
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          nativeInputValueSetter.call(input, '测试单位');
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }
        const formItem = l.closest('.ant-form-item');
        if (formItem) {
          const input = formItem.querySelector('input:not([type="hidden"])');
          if (input) {
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
            nativeInputValueSetter.call(input, '测试单位');
            input.dispatchEvent(new Event('input', { bubbles: true }));
            return true;
          }
        }
      }
    }
    return false;
  }, '单位名称');
  console.log('填入单位名称:', filled ? '✅' : '❌');
  
  await page.waitForTimeout(2000);
  await browser.context.close();
})();
