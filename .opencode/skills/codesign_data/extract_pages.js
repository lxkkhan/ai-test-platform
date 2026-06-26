const { chromium } = require('E:\\006Skills\\.opencode\\skills\\apifox-sync\\node_modules\\playwright-core');
const path = require('path');
const fs = require('fs');

const profileDir = 'E:\\006Skills\\.opencode\\skills\\.codesign-mcp\\profile';
const outputDir = 'E:\\006Skills\\.opencode\\skills\\codesign_data';

async function extractPageInfo(page, pageName) {
  console.log(`\n========== Extracting: ${pageName} ==========`);
  
  // Try to find and click the page label
  const labels = await page.$$('.label-text');
  let clicked = false;
  for (const label of labels) {
    const text = await label.textContent();
    if (text.trim() === pageName) {
      await label.click();
      console.log(`Clicked on "${pageName}"`);
      clicked = true;
      break;
    }
  }
  
  if (!clicked) {
    console.log(`Could not find label for "${pageName}"`);
    return null;
  }
  
  await page.waitForTimeout(3000);
  
  // Take screenshot
  await page.screenshot({ 
    path: path.join(outputDir, `${pageName}.png`), 
    fullPage: false 
  });
  
  // Extract content from the prototype iframe
  const pageData = await page.evaluate((name) => {
    const result = {
      pageName: name,
      url: window.location.href,
      iframeContent: null,
      pageFields: [],
      widgets: [],
    };
    
    // Try to get the main content area
    const mainContent = document.querySelector('[class*="content"]') || 
                        document.querySelector('[class*="main"]') ||
                        document.querySelector('[class*="canvas"]');
    if (mainContent) {
      result.mainContentText = mainContent.textContent.substring(0, 3000);
    }
    
    // Try to get iframe content (Axure prototypes use iframes)
    const iframes = document.querySelectorAll('iframe');
    result.iframeCount = iframes.length;
    
    iframes.forEach((iframe, idx) => {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc) {
          const texts = doc.querySelectorAll('[class*="text"][id*="_text"]');
          const fields = [];
          texts.forEach(el => {
            const text = el.textContent?.trim() || '';
            if (text && text.length > 1) {
              const pid = el.closest('div[id^="u"]')?.id || el.id;
              const idNum = parseInt(pid.replace('u','').replace('_text','')) || 0;
              fields.push({ id: pid, text: text, num: idNum });
            }
          });
          fields.sort((a, b) => a.num - b.num);
          result.iframeContent = {
            idx,
            fieldCount: fields.length,
            fields: fields.slice(0, 100)
          };
        }
      } catch (e) {
        // Cross-origin iframe
      }
    });
    
    return result;
  }, pageName);
  
  console.log(`URL: ${pageData.url}`);
  console.log(`Iframes: ${pageData.iframeCount}`);
  if (pageData.mainContentText) {
    console.log(`Main content: ${pageData.mainContentText.substring(0, 500)}`);
  }
  if (pageData.iframeContent) {
    console.log(`Iframe fields (${pageData.iframeContent.fieldCount}):`);
    pageData.iframeContent.fields.slice(0, 50).forEach(f => {
      console.log(`  [${f.num}] ${f.text}`);
    });
  }
  
  // Try to open notes panel
  console.log('Trying to open notes panel...');
  const noteResult = await page.evaluate(() => {
    const result = { clicked: false, notes: null };
    
    // Try the note button
    const noteBtn = document.querySelector('.icon-v2-note2');
    if (noteBtn) {
      noteBtn.click();
      result.clicked = true;
      result.method = 'icon-v2-note2';
    }
    
    return result;
  });
  
  if (noteResult.clicked) {
    await page.waitForTimeout(2000);
    
    const notesData = await page.evaluate(() => {
      const result = { items: [], pageNote: null, rawText: '' };
      
      // Try to find notes drawer/panel
      const drawer = document.querySelector('[class*="notes-drawer"]') ||
                     document.querySelector('[class*="note-drawer"]') ||
                     document.querySelector('[class*="drawer"]');
      
      if (drawer) {
        result.rawText = drawer.textContent.substring(0, 3000);
        
        const cells = drawer.querySelectorAll('[class*="notes-cell"]');
        cells.forEach(cell => {
          const numEl = cell.querySelector('[class*="num"]');
          const nameEl = cell.querySelector('[class*="note-subtitle"] p');
          const contentEl = cell.querySelector('[class*="note-content"]');
          if (numEl && nameEl) {
            result.items.push({
              num: numEl.textContent.trim(),
              name: nameEl.textContent.trim(),
              note: contentEl ? contentEl.textContent.trim() : ''
            });
          }
        });
      }
      
      return result;
    });
    
    console.log('Notes panel found:');
    if (notesData.items.length > 0) {
      notesData.items.forEach(item => {
        console.log(`  #${item.num} ${item.name}: ${item.note}`);
      });
    } else {
      console.log(`  Raw text: ${notesData.rawText.substring(0, 1000)}`);
    }
    
    pageData.notes = notesData;
    
    // Close the drawer
    await page.evaluate(() => {
      const closeBtn = document.querySelector('[class*="drawer"] [class*="close"]') ||
                       document.querySelector('[class*="note"] [class*="close"]') ||
                       document.querySelector('[class*="icon-close"]');
      if (closeBtn) closeBtn.click();
    });
    await page.waitForTimeout(500);
  } else {
    console.log('No notes panel button found');
    
    // Try clicking the "需求回应" tab first
    console.log('Trying to click 需求回应 tab...');
    const tabs = await page.$$('.label-text');
    for (const tab of tabs) {
      const text = await tab.textContent();
      if (text.trim() === '需求回应') {
        await tab.click();
        await page.waitForTimeout(1000);
        break;
      }
    }
    
    // Then try notes again
    const noteResult2 = await page.evaluate(() => {
      // Try various note selectors
      const buttons = document.querySelectorAll('button');
      for (const btn of buttons) {
        if (btn.textContent.includes('备注') || btn.querySelector('[class*="note"]')) {
          btn.click();
          return { clicked: true, text: btn.textContent };
        }
      }
      return { clicked: false };
    });
    
    if (noteResult2.clicked) {
      await page.waitForTimeout(2000);
      const notesText = await page.evaluate(() => {
        const content = document.querySelector('[class*="panel"]') || document.querySelector('[class*="content"]');
        return content ? content.textContent.substring(0, 3000) : '';
      });
      console.log(`Notes content: ${notesText}`);
      pageData.notes = { items: [], rawText: notesText };
    }
  }
  
  return pageData;
}

(async () => {
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
    await page.waitForTimeout(3000);
    
    console.log('Page loaded:', page.url());
    
    // First, click on "原型图" to expand the section
    const labels = await page.$$('.label-text');
    for (const label of labels) {
      const text = await label.textContent();
      if (text.trim() === '原型图') {
        await label.click();
        console.log('Clicked on "原型图"');
        await page.waitForTimeout(1000);
        break;
      }
    }
    
    // Extract the two target pages
    const pagesToExtract = ['打单商业申请单', '打单商业档案'];
    const results = {};
    
    for (const pageName of pagesToExtract) {
      const data = await extractPageInfo(page, pageName);
      if (data) {
        results[pageName] = data;
      }
    }
    
    // Save results
    const outputPath = path.join(outputDir, 'extracted_data.json');
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf-8');
    console.log(`\nResults saved to ${outputPath}`);
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await browser.close();
  }
})();
