const { chromium } = require('E:\\006Skills\\.opencode\\skills\\apifox-sync\\node_modules\\playwright-core');
const path = require('path');

(async () => {
  const profileDir = 'E:\\006Skills\\.opencode\\skills\\.codesign-mcp\\profile';
  
  const browser = await chromium.launchPersistentContext(profileDir, {
    headless: true,
    args: ['--no-sandbox'],
  });

  const page = await browser.newPage();
  
  try {
    console.log('Navigating to CoDesign sharing URL...');
    await page.goto('https://codesign.qq.com/s/697313341916783', { 
      waitUntil: 'networkidle', 
      timeout: 60000 
    });
    
    console.log('Page loaded. URL:', page.url());
    
    // Wait a bit for the page to fully render
    await page.waitForTimeout(3000);
    
    // Get the page title
    const title = await page.title();
    console.log('Title:', title);
    
    // Try to get the page content
    const bodyText = await page.evaluate(() => {
      return document.body ? document.body.innerText.substring(0, 2000) : 'No body';
    });
    console.log('Body text:', bodyText);
    
    // Try to find page/screen names in the left panel
    const screens = await page.evaluate(() => {
      // Try various selectors for the screen list
      const selectors = [
        '.screen-item .name',
        '.artboard-item .name',
        '[class*="screen"] [class*="name"]',
        '[class*="artboard"] [class*="name"]',
        '.page-item',
        '[class*="page-tree"] [class*="node"]',
        '.tree-node',
        '.label-text',
        '[class*="sidebar"] [class*="item"]',
        '[class*="leftPanel"] [class*="item"]',
        '.menu-item',
      ];
      
      let results = [];
      for (const sel of selectors) {
        const elements = document.querySelectorAll(sel);
        if (elements.length > 0) {
          results.push({ selector: sel, count: elements.length, items: Array.from(elements).slice(0, 20).map(e => e.textContent.trim()) });
        }
      }
      return results;
    });
    
    console.log('Screens found:');
    for (const s of screens) {
      console.log(`  Selector: ${s.selector}, Count: ${s.count}`);
      for (const item of s.items) {
        console.log(`    - "${item}"`);
      }
    }
    
    // Take a screenshot
    await page.screenshot({ path: 'E:\\006Skills\\.opencode\\skills\\codesign_data\\screenshot.png', fullPage: false });
    console.log('Screenshot saved.');
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await browser.close();
  }
})();
