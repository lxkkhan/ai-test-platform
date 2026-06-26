/**
 * Debug helper: log page state after navigation
 */
const path = require('path');
const { launchBrowser, login } = require(path.resolve(__dirname, '..', 'ai-test-executor', 'scripts', 'login-manager'));
const env = require(path.resolve(__dirname, '..', 'ai-test-executor', 'scripts', 'env'));

(async () => {
  const browser = await launchBrowser(false);
  const page = browser.page;
  const sysConfig = env.getSystemConfig('营销系统SIT');
  await login(page, sysConfig.login_url, sysConfig.username, sysConfig.password);

  // Click portal
  for (let retry = 0; retry < 3; retry++) {
    const found = await page.evaluate(() => {
      for (const el of [...document.querySelectorAll('*')]) {
        if (el.offsetParent === null) continue;
        const t = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).filter(Boolean);
        if (t.some(x => x === '营销系统saas-SIT')) { el.click(); return true; }
      }
      return false;
    });
    if (!found) break;
    await page.waitForTimeout(3000);
  }

  // Wait for page
  await page.waitForTimeout(3000);
  console.log('当前URL:', page.url());

  // Expand menus
  for (let i = 0; i < 5; i++) {
    const c = await page.evaluate(() => {
      let n = 0;
      document.querySelectorAll('.ant-menu-submenu:not(.ant-menu-submenu-open)').forEach(sm => {
        const t = sm.querySelector('.ant-menu-submenu-title');
        if (t && t.offsetParent !== null) { t.click(); n++; }
      });
      return n;
    });
    if (c === 0) break;
    console.log(`展开 ${c} 个, 等待...`);
    await page.waitForTimeout(1500);
  }

  // Debug: examine first page's ant-menu-item
  const info = await page.evaluate(() => {
    const items = document.querySelectorAll('.ant-menu-item');
    const results = [];
    items.forEach((item, i) => {
      if (i > 5) return;
      results.push({
        index: i,
        text: item.textContent.trim().substring(0, 40),
        data: item.getAttribute('data-menu-id') || item.id || 'no-id',
        // Check for onclick or event handlers
        hasOnClick: !!item.onclick,
        role: item.getAttribute('role') || '',
        href: item.querySelector('a')?.href || '',
        // Check children structure
        childTags: [...item.children].map(c => c.tagName).join(','),
        classes: item.className,
      });
    });
    return results;
  });

  console.log('\n前5个菜单项详情:');
  info.forEach(i => console.log(JSON.stringify(i, null, 2)));

  // Try clicking first page and check navigation
  console.log('\n尝试点击第一个页面...');
  const firstItem = await page.evaluate(() => {
    const item = document.querySelector('.ant-menu-item');
    if (item) {
      item.click();
      return { text: item.textContent.trim().substring(0, 40), url: window.location.href };
    }
    return null;
  });
  console.log('点击后:', JSON.stringify(firstItem));
  await page.waitForTimeout(2000);
  console.log('最终URL:', page.url());

  // Check if content changed
  const content = await page.evaluate(() => {
    const main = document.querySelector('.ant-layout-content') || document.querySelector('main') || document.body;
    return { mainTag: main.tagName, mainText: main.textContent.trim().substring(0, 200) };
  });
  console.log('页面内容:', content.mainText);

  await browser.context.close();
  console.log('\n浏览器已关闭');
})();
