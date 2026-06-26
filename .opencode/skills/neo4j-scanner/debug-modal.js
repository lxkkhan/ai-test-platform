/**
 * Quick test: fill profile form, submit, then see if modal stays closed
 */
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

  await page.waitForTimeout(3000);
  console.log('当前URL:', page.url());

  // Check for modal
  const modalInfo = await page.evaluate(() => {
    const modal = document.querySelector('.ant-modal');
    if (!modal) return { hasModal: false };
    const title = modal.querySelector('.ant-modal-title')?.textContent?.trim();
    const cancelBtn = [...modal.querySelectorAll('button')].find(b => b.textContent.trim() === '取消');
    const okBtn = [...modal.querySelectorAll('button')].find(b => b.textContent.trim() === '确定');
    return { hasModal: true, title, hasCancel: !!cancelBtn, hasOk: !!okBtn };
  });
  console.log('模态框信息:', JSON.stringify(modalInfo));

  if (modalInfo.hasModal) {
    // Try clicking cancel
    await page.evaluate(() => {
      const modal = document.querySelector('.ant-modal');
      if (!modal) return;
      const cancelBtn = [...modal.querySelectorAll('button')].find(b => b.textContent.trim() === '取消');
      if (cancelBtn) cancelBtn.click();
    });
    await page.waitForTimeout(2000);
    console.log('点击取消后URL:', page.url());

    // Check if modal is gone
    const stillModal = await page.evaluate(() => !!document.querySelector('.ant-modal'));
    console.log('模态框是否还在:', stillModal);

    // Navigate to a page and check
    const item = document.querySelector('.ant-menu-item');
    if (item) {
      await item.click();
      await page.waitForTimeout(2000);
      console.log('导航后URL:', page.url());
      const modalAgain = await page.evaluate(() => !!document.querySelector('.ant-modal'));
      console.log('导航后模态框:', modalAgain);
    }
  }

  await browser.context.close();
})();
