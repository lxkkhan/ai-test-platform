async function navigateToPage(page, pathParts, systemName) {
  console.log('[nav] 导航路径:', pathParts.join(' → '));
  await page.waitForTimeout(2000);

  // Active page reference (may switch to new tab later)
  let activePage = page;

  // Step 0: Handle portal page - click app link
  for (let retry = 0; retry < 3; retry++) {
    const portalInfo = await page.evaluate(() => {
      const allEls = [...document.querySelectorAll('*')];
      // Find element whose direct text node contains 营销系统saas-SIT
      for (const el of allEls) {
        if (el.offsetParent === null) continue;
        const childTexts = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).filter(Boolean);
        const hasTarget = childTexts.some(t => t === '营销系统saas-SIT');
        if (hasTarget) {
          return { found: true, tag: el.tagName, className: el.className.substring(0, 60), text: el.textContent.trim().substring(0, 60) };
        }
      }
      return { found: false };
    });
    if (!portalInfo.found) break;
    console.log(`[nav] 门户页面，第${retry+1}次: 找到链接 <${portalInfo.tag}>`, portalInfo.text);
    await page.evaluate(() => {
      for (const el of [...document.querySelectorAll('*')]) {
        if (el.offsetParent === null) continue;
        const childTexts = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).filter(Boolean);
        if (childTexts.some(t => t === '营销系统saas-SIT')) {
          el.click();
          return;
        }
      }
    });
    await page.waitForTimeout(5000);
    const curUrl = page.url();
    console.log(`[nav] 点击后URL: ${curUrl.substring(0, 120)}`);
    if (!curUrl.includes('/login')) break;
  }

  // Handle new window/tab from portal click
  const pages = page.context().pages();
  if (pages.length > 1) {
    page = pages[pages.length - 1];
    console.log(`[nav] 切换到新标签页: ${await page.url().catch(() => 'unknown')}`);
  }

  // Close any modals/popups (like profile page)
  await page.evaluate(() => {
    document.querySelectorAll('.ant-modal-close, [class*="close"]').forEach(el => {
      if (el.offsetParent !== null) el.click();
    });
    document.querySelectorAll('button').forEach(b => {
      const t = b.textContent.trim();
      if (t === '取消') b.click();
    });
  });
  await page.waitForTimeout(1000);

  // Expand left sidebar menu if collapsed
  await activePage.evaluate(() => {
    const expandTriggers = [
      '.ant-layout-sider-trigger',
      '[class*="collaps"]',
      '[class*="menu-fold"]',
      '[class*="sider"] button',
      'i.anticon-menu-fold',
      'i.anticon-menu-unfold',
      '[class*="trigger"]',
    ];
    for (const sel of expandTriggers) {
      const el = document.querySelector(sel);
      if (el && el.offsetParent !== null) {
        console.log(`[nav] 找到展开按钮: ${sel}`);
        el.click();
        return;
      }
    }
    console.log('[nav] 未找到展开按钮');
  });
  await activePage.waitForTimeout(2000);
  const portalApps = await page.evaluate(() => {
    const texts = [];
    document.querySelectorAll('a, button, span, div').forEach(el => {
      const t = el.textContent.trim();
      if ((t.includes('营销系统') || t.includes('配送中心')) && el.offsetParent !== null) {
        texts.push(t);
      }
    });
    return texts;
  });
  if (portalApps.length > 0) {
    const hasMenu = await page.locator('.ant-menu-item, .ant-menu-submenu-title, [class*="menu"]').first().isVisible().catch(() => false);
    if (!hasMenu) {
      // We're on portal page, need to click into the app
      const appTarget = portalApps.find(t => t.includes('SIT') || t.includes('sit'));
      if (appTarget) {
        console.log(`[nav] 门户页面: 点击应用 "${appTarget}" 进入`);
        const curUrl = page.url();
        console.log(`[nav] 当前URL: ${curUrl}`);

        // Debug: find the exact element and its parent structure
        const clickResult = await page.evaluate((target) => {
          const all = [...document.querySelectorAll('*')].filter(el => el.textContent.trim() === target && el.offsetParent !== null);
          console.log('Matching elements:', all.length);
          all.forEach((el, i) => {
            console.log(`  [${i}] tag=${el.tagName} class=${el.className.substring(0,60)} href=${el.href || 'none'} parent=${el.parentElement?.tagName}.${el.parentElement?.className.substring(0,30)}`);
          });
          if (all.length > 0) {
            all[0].click();
            return true;
          }
          return false;
        }, appTarget);
        console.log(`[nav] 点击结果: ${clickResult}`);
        await page.waitForTimeout(3000);
        console.log(`[nav] 点击后的URL: ${page.url()}`);
      }
    }
  }

  // Handle new window/tab (app might open in new tab)
  const allPages = page.context().pages();
  if (allPages.length > 1) {
    activePage = allPages[allPages.length - 1];
    console.log(`[nav] 切换到新标签页: ${await activePage.url().catch(() => 'unknown')}`);
  }

  // Close profile/settings modal by clicking "取消" button
  await activePage.evaluate(() => {
    // Try clicking cancel buttons
    document.querySelectorAll('button').forEach(b => {
      if (b.textContent.trim() === '取消' || b.textContent.trim() === '关闭') {
        if (b.offsetParent !== null) b.click();
      }
    });
    // Try modal close buttons
    document.querySelectorAll('.ant-modal-close, [class*="close"]').forEach(el => {
      if (el.offsetParent !== null) el.click();
    });
  });
  await activePage.waitForTimeout(1500);

  for (let i = 0; i < pathParts.length; i++) {
    const target = pathParts[i];
    console.log(`[nav] 第${i+1}级: "${target}"`);
    let found = await clickMenuItem(activePage, target);
    if (!found) {
      const allText = await activePage.evaluate(() => [...document.querySelectorAll('*')]
        .filter(el => el.children.length === 0 && el.textContent.trim().length > 0 && el.textContent.trim().length < 30)
        .map(el => el.textContent.trim()));
      const match = allText.find(t => t.includes(target));
      if (match) {
        console.log(`[nav] 通过全文本匹配: "${match}"`);
        try { const el = activePage.locator(`text="${match}"`).first(); if (await el.isVisible().catch(() => false)) { await el.click(); found = true; } } catch {}
      }
    }
    if (!found) console.warn(`[nav] ⚠ 未找到: "${target}"`);
    await activePage.waitForTimeout(1500);
  }
  console.log('[nav] ✓ 导航完成');
  await activePage.waitForTimeout(1000);
  return activePage;
}

async function expandHiddenMenus(page) {
  // Check for collapsed/expandable menus that need to be opened first
  const allCandidates = ['其他应用', '···', '≡', '☰', '更多', '展开', '菜单', '导航'];
  for (const candidate of allCandidates) {
    try {
      // Use evaluate to find matching elements
      const el = page.locator(`text="${candidate}"`).first();
      if (await el.isVisible().catch(() => false)) {
        console.log(`[nav] 发现: "${candidate}"，检查是否可点击...`);
        const isButton = await page.evaluate((text) => {
          const els = [...document.querySelectorAll('*')].filter(e => e.textContent.trim() === text && e.offsetParent !== null);
          const el = els[0];
          if (!el) return false;
          const role = el.getAttribute('role') || '';
          const tag = el.tagName.toLowerCase();
          const cursor = window.getComputedStyle(el).cursor;
          return role === 'button' || tag === 'button' || tag === 'a' || cursor === 'pointer' || el.onclick;
        }, candidate).catch(() => false);
        if (isButton || candidate === '其他应用') {
          await el.click();
          console.log(`[nav] 点击 "${candidate}"，等待菜单展开...`);
          await page.waitForTimeout(2000);
          return true;
        }
      }
    } catch {}
  }
  return false;
}

async function clickMenuItem(page, text) {
  // Debug: scan ALL visible text on the page
  const allVisible = await page.evaluate(() => {
    const result = [];
    try {
      // Get all elements with text
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
      let node;
      const seen = new Set();
      while (node = walker.nextNode()) {
        const text = node.textContent.trim();
        if (text && text.length > 0 && text.length < 50 && !seen.has(text)) {
          seen.add(text);
          result.push(text);
        }
      }
    } catch(e) { result.push('treeWalker error: ' + e.message); }
    return result;
  });
  console.log(`[nav] 页面所有可见文本 (${allVisible.length}):`);
  allVisible.forEach(t => console.log(`  "${t}"`));

  // Try to find menu container first
  const menuContainers = [
    '.ant-menu', '.ant-layout-sider', '[class*="sidebar"]', '[class*="menu"]',
    'nav', '.ant-layout-sider-children', 'aside'
  ];
  let scope = page;
  for (const sel of menuContainers) {
    try {
      const el = page.locator(sel).first();
      if (await el.isVisible().catch(() => false)) {
        console.log(`[nav] 找到菜单容器: ${sel}`);
        scope = el;
        break;
      }
    } catch {}
  }

  // Strategy 1: Ant Design menu items within scope
  const selectors = [
    `.ant-menu-item:has-text("${text}")`,
    `.ant-menu-submenu-title:has-text("${text}")`,
    `[class*="menu"]:has-text("${text}")`,
  ];

  for (const sel of selectors) {
    try {
      const el = scope.locator(sel).first();
      if (await el.isVisible().catch(() => false)) {
        await el.click();
        console.log(`[nav] ✓ 点击: ${text}`);
        return true;
      }
    } catch {}
  }

  // Strategy 2: Try to expand submenus first, then find
  try {
    const submenus = await scope.locator('.ant-menu-submenu-title').all();
    for (const sm of submenus) {
      const smText = await sm.textContent();
      if (smText.trim().includes(text)) {
        await sm.click();
        console.log(`[nav] ✓ 展开子菜单: ${text}`);
        await page.waitForTimeout(500);
        return true;
      }
    }
  } catch {}

  // Strategy 3: Search all text nodes for partial match
  const allItems = await scope.locator('span, a, li, div').all();
  for (const item of allItems) {
    try {
      const itemText = await item.textContent();
      if (itemText.trim().includes(text) && await item.isVisible()) {
        await item.click();
        console.log(`[nav] ✓ 点击(模糊): ${text}`);
        return true;
      }
    } catch {}
  }

  console.warn(`[nav] ✗ 未找到: "${text}"`);
  return false;
}

async function scanMenuTree(page) {
  console.log('[nav] 扫描菜单树...');
  const menuData = await page.evaluate(() => {
    const items = [];
    // Try Ant Design menu
    const menuItems = document.querySelectorAll('.ant-menu-item, .ant-menu-submenu-title');
    menuItems.forEach(el => {
      const text = el.textContent.trim();
      if (text && text.length > 0) items.push(text);
    });
    if (items.length === 0) {
      // Fallback: find all clickable nav items
      document.querySelectorAll('a, button, li, span').forEach(el => {
        const text = el.textContent.trim();
        if (text && text.length > 0 && text.length < 30) items.push(text);
      });
    }
    return [...new Set(items)];
  });
  console.log('[nav] 扫描到', menuData.length, '个菜单项');
  return menuData;
}

module.exports = { navigateToPage, scanMenuTree, clickMenuItem };
