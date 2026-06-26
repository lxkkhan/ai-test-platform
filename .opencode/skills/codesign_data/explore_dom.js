const { chromium } = require('E:\\006Skills\\.opencode\\skills\\apifox-sync\\node_modules\\playwright-core');
const path = require('path');
const fs = require('fs');

const profileDir = 'E:\\006Skills\\.opencode\\skills\\.codesign-mcp\\profile';
const outputDir = 'E:\\006Skills\\.opencode\\skills\\codesign_data';

(async () => {
  const browser = await chromium.launchPersistentContext(profileDir, {
    headless: true,
    args: ['--no-sandbox'],
  });

  const page = await browser.newPage();
  
  try {
    console.log('Navigating...');
    await page.goto('https://codesign.qq.com/s/697313341916783', { 
      waitUntil: 'networkidle', 
      timeout: 60000 
    });
    await page.waitForTimeout(5000);
    
    // Get the full DOM tree structure of the left sidebar
    const domTree = await page.evaluate(() => {
      function getTree(el, depth = 0) {
        if (depth > 6) return '';
        let result = '';
        const children = el.children;
        for (let i = 0; i < children.length; i++) {
          const child = children[i];
          const tag = child.tagName.toLowerCase();
          const cls = child.className || '';
          const id = child.id || '';
          // Only look at structural elements
          if (['div', 'ul', 'li', 'nav', 'span'].includes(tag)) {
            const text = (child.textContent || '').trim().substring(0, 60);
            if (text) {
              const visible = child.offsetParent !== null;
              result += `${'  '.repeat(depth)}<${tag} class="${cls.substring(0, 80)}"${visible ? '' : ' hidden'}> ${text}\n`;
            } else {
              result += `${'  '.repeat(depth)}<${tag} class="${cls.substring(0, 80)}">\n`;
            }
            result += getTree(child, depth + 1);
          }
        }
        return result;
      }
      
      // Try to find the sidebar or tree container
      const containers = document.querySelectorAll('[class*="sidebar"]');
      let output = '';
      containers.forEach((c, i) => {
        output += `=== Sidebar ${i}: ${(c.className || '').substring(0, 100)} ===\n`;
        output += getTree(c) + '\n';
      });
      
      const trees = document.querySelectorAll('[class*="tree"]');
      trees.forEach((c, i) => {
        if (c.className && !c.closest('[class*="sidebar"]')) {
          output += `=== Tree ${i}: ${(c.className || '').substring(0, 100)} ===\n`;
          output += getTree(c) + '\n';
        }
      });
      
      // Also try to find the menu/panel area
      const panels = document.querySelectorAll('[class*="panel"]');
      panels.forEach((c, i) => {
        if (c.children.length > 2 && (c.className || '').includes('left')) {
          output += `=== Panel ${i}: ${(c.className || '').substring(0, 100)} ===\n`;
          output += getTree(c) + '\n';
        }
      });
      
      return output || 'No structure found';
    });
    
    console.log('DOM Structure:');
    console.log(domTree);
    
    // Also check what classes are on the .label-text elements and their parents
    const labelInfo = await page.evaluate(() => {
      const labels = document.querySelectorAll('.label-text');
      const result = [];
      labels.forEach((l, i) => {
        const parent = l.parentElement;
        const grandparent = parent?.parentElement;
        result.push({
          index: i,
          text: l.textContent.trim(),
          parentTag: parent?.tagName,
          parentClass: (parent?.className || '').substring(0, 100),
          grandparentClass: (grandparent?.className || '').substring(0, 100),
          visible: l.offsetParent !== null,
          rect: l.getBoundingClientRect()
        });
      });
      return result;
    });
    
    console.log('\nLabel info:');
    labelInfo.forEach(l => {
      console.log(`  #${l.index} "${l.text}" visible=${l.visible} parent=${l.parentClass.substring(0, 60)} rect=(${Math.round(l.rect.x)},${Math.round(l.rect.y)})`);
    });
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await browser.close();
  }
})();
