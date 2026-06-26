/**
 * menu-crawler.js
 * 递归扫描左侧菜单树，记录 Module 层级和 Page 叶子节点
 */
async function crawlMenuTree(page) {
  console.log('[crawl] 开始扫描菜单树...');
  await page.waitForTimeout(3000);

  // First ensure sidebar is expanded - click the collapse toggle SVG
  await page.evaluate(() => {
    // Use XPath-like selector for the menu toggle icon
    const toggle = document.querySelector('aside svg, .ant-layout-sider svg');
    if (toggle && toggle.offsetParent !== null) {
      const span = toggle.closest('span') || toggle.parentElement;
      if (span) span.click();
    }
    // Fallback: try the sider trigger
    const sider = document.querySelector('.ant-layout-sider');
    if (sider && sider.classList.contains('ant-layout-sider-collapsed')) {
      const trigger = sider.querySelector('.ant-layout-sider-trigger');
      if (trigger) trigger.click();
    }
  });
  await page.waitForTimeout(2000);

  // Approach: first click each submenu to expand, then extract all visible menu items
  // Step 1: Expand all submenus
  console.log('[crawl] 展开所有子菜单...');
  for (let expandPass = 0; expandPass < 5; expandPass++) {
    const clickedAny = await page.evaluate(() => {
      const submenus = document.querySelectorAll('.ant-menu-submenu');
      let clicked = false;
      submenus.forEach(sm => {
        if (!sm.classList.contains('ant-menu-submenu-open')) {
          const title = sm.querySelector('.ant-menu-submenu-title');
          if (title && title.offsetParent !== null) {
            title.click();
            clicked = true;
          }
        }
      });
      return clicked;
    });
    if (!clickedAny) {
      console.log(`[crawl]  无更多可展开的子菜单`);
      break;
    }
    console.log(`[crawl]  展开第 ${expandPass + 1} 轮...`);
    await page.waitForTimeout(2000);
  }

  // Wait for menu to stabilize
  await page.waitForTimeout(3000);

  // Step 2: Now extract the full tree from the expanded menu
  const menuTree = await page.evaluate(() => {
    const seen = new Set();

    function extractMenu(parentElement) {
      const items = [];
      const children = parentElement.children;
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (!child.classList.contains('ant-menu-submenu') && !child.classList.contains('ant-menu-item') && !child.classList.contains('ant-menu-sub')) continue;

        if (child.classList.contains('ant-menu-submenu')) {
          const titleEl = child.querySelector('.ant-menu-submenu-title');
          const textSpan = titleEl?.querySelector('.ant-menu-title-content');
          // Get text from title content or fallback to textContent
          let name = textSpan?.textContent?.trim() || titleEl?.textContent?.trim() || '';
          // Clean up: remove icon characters
          name = name.replace(/[🔍🔔⚙️📊🔄]+/g, '').trim();
          if (name && name.length > 0 && name.length < 40 && !seen.has(name)) {
            seen.add(name);
            // Look for submenu children
            const sub = child.querySelector(':scope > .ant-menu-sub');
            items.push({
              type: 'module',
              name,
              children: sub ? extractMenu(sub) : [],
            });
          }
        }
        else if (child.classList.contains('ant-menu-item')) {
          let name = child.textContent?.trim() || '';
          name = name.replace(/[🔍🔔⚙️📊🔄]+/g, '').trim();
          if (name && name.length > 0 && name.length < 40 && !seen.has(name)) {
            seen.add(name);
            items.push({ type: 'page', name });
          }
        }
        else if (child.classList.contains('ant-menu-sub')) {
          items.push(...extractMenu(child));
        }
      }
      return items;
    }

    const menu = document.querySelector('.ant-menu');
    if (!menu) return { error: '未找到 .ant-menu' };

    return extractMenu(menu);
  });

  console.log(`[crawl] 菜单树根节点: ${menuTree.length} 个`);
  printTree(menuTree, '');
  return menuTree;
}

function printTree(tree, indent) {
  tree.forEach(node => {
    const icon = node.type === 'module' ? '📁' : '📄';
    console.log(`${indent} ${icon} ${node.name}`);
    if (node.children) printTree(node.children, indent + '  ');
  });
}

/**
 * 根据路径扫描指定模块下的页面
 * 例如: targetModules = ['基础数据', '宣传物料管理']
 */
async function crawlTargetModules(page, targetModules) {
  const fullTree = await crawlMenuTree(page);
  const results = [];

  // Walk tree to find target modules
  function findModule(tree, pathParts) {
    for (const node of tree) {
      if (node.type !== 'module') continue;
      if (node.name === pathParts[0]) {
        if (pathParts.length === 1) return node;
        if (node.children) return findModule(node.children, pathParts.slice(1));
      }
      // Try deeper
      if (node.children) {
        const found = findModule(node.children, pathParts);
        if (found) return found;
      }
    }
    return null;
  }

  for (const target of targetModules) {
    const mod = findModule(fullTree, [target]);
    if (mod) {
      console.log(`[crawl] ✓ 找到目标模块: ${target}`);
      results.push(mod);
    } else {
      console.warn(`[crawl] ✗ 未找到目标模块: ${target}`);
    }
  }

  return results;
}

/**
 * 获取所有叶子页面路径
 */
function flattenPages(modules, parentPath = []) {
  const pages = [];
  for (const node of modules) {
    const currentPath = [...parentPath, node.name];
    if (node.type === 'page') {
      pages.push({ path: currentPath, name: node.name });
    }
    if (node.children) {
      pages.push(...flattenPages(node.children, currentPath));
    }
  }
  return pages;
}

module.exports = { crawlMenuTree, crawlTargetModules, flattenPages };
