const path = require('path');
const { launchBrowser, login } = require(path.resolve(__dirname, '..', 'ai-test-executor', 'scripts', 'login-manager'));
const env = require(path.resolve(__dirname, '..', 'ai-test-executor', 'scripts', 'env'));

(async () => {
  const browser = await launchBrowser(false);
  const page = browser.page;
  const sysConfig = env.getSystemConfig('营销系统SIT');
  await login(page, sysConfig.login_url, sysConfig.username, sysConfig.password);

  // Enter app
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
  const pages = page.context().pages();
  if (pages.length > 1) page = pages[pages.length - 1];

  // Test routes
  const testRoutes = [
    '/YxxtPmWarehouseOrg',
    '/YxxtCustomerManageBillOrg',
    '/YxxtCustomerManageBillOrgLess',
    '/YxxtCustomerSearchBillOrg',
    '/YxxtMaterialManageOrg',
  ];

  const baseUrl = page.url().split('#')[0];
  for (const route of testRoutes) {
    await page.goto(baseUrl + '#' + route, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);
    
    // Check content
    const info = await page.evaluate(() => {
      const url = window.location.href;
      const main = document.querySelector('.ant-layout-content') || document.querySelector('main') || document.body;
      const text = main.textContent.trim().substring(0, 300);
      const forms = document.querySelectorAll('form').length;
      const inputs = document.querySelectorAll('input:not([type="hidden"])').length;
      const selects = document.querySelectorAll('select').length;
      const buttons = [...document.querySelectorAll('button')].map(b => b.textContent.trim()).filter(Boolean).slice(0, 10);
      return { url: url.substring(url.indexOf('#/') + 2), forms, inputs, selects, buttons, preview: text.replace(/\s+/g, ' ').substring(0, 200) };
    });
    console.log(`\n${route}:`);
    console.log(`  URL: ${info.url}`);
    console.log(`  forms=${info.forms}, inputs=${info.inputs}, selects=${info.selects}`);
    console.log(`  buttons: ${info.buttons.join(', ')}`);
    console.log(`  preview: ${info.preview}`);
  }

  await browser.context.close();
})();
