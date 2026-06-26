const { chromium } = require('E:\\006Skills\\.opencode\\skills\\apifox-sync\\node_modules\\playwright-core');
const path = require('path');
const fs = require('fs');

const profileDir = 'E:\\006Skills\\.opencode\\skills\\.codesign-mcp\\profile';
const outputDir = 'E:\\006Skills\\.opencode\\skills\\codesign_data';

async function clickLabelByText(page, text) {
  return await page.evaluate((targetText) => {
    const labels = document.querySelectorAll('.label-text');
    for (const label of labels) {
      if (label.textContent.trim() === targetText) {
        label.click();
        return true;
      }
    }
    return false;
  }, text);
}

async function extractPageContent(page, pageName) {
  console.log(`\n===== Extracting: ${pageName} =====`);
  
  // Click the page using JS click (bypasses Playwright visibility checks)
  const clicked = await clickLabelByText(page, pageName);
  if (!clicked) {
    console.log(`Could not click: "${pageName}"`);
    return null;
  }
  
  console.log(`Clicked: "${pageName}"`);
  await page.waitForTimeout(4000);
  
  const result = {
    pageName,
    url: page.url(),
    screenshots: [],
    iframes: [],
    pageContent: null,
    notesContent: null,
  };
  
  // Take screenshot
  const safeName = pageName.replace(/[\\/:*?"<>|]/g, '_');
  const screenshotPath = path.join(outputDir, `${safeName}.png`);
  await page.screenshot({ path: screenshotPath });
  result.screenshots.push(screenshotPath);
  console.log(`Screenshot saved`);
  
  // Get current main content text (non-iframe)
  const mainText = await page.evaluate(() => {
    // Get the main content area text
    const contentAreas = document.querySelectorAll('[class*="content"], [class*="main"], [class*="canvas"]');
    let text = '';
    contentAreas.forEach(el => { text += el.textContent + '\n'; });
    return text.substring(0, 3000);
  });
  result.pageContent = mainText;
  console.log('Main content:', mainText.substring(0, 500));
  
  // Extract iframe content
  const iframeData = await page.evaluate(() => {
    const iframes = document.querySelectorAll('iframe');
    const results = [];
    
    iframes.forEach((iframe, idx) => {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc && doc.body) {
          const allText = doc.body.innerText || '';
          
          // Find text widgets (Axure style: elements with ids like uXXX)
          const widgets = [];
          const textEls = doc.querySelectorAll('[id*="_text"]');
          textEls.forEach(el => {
            const t = el.textContent?.trim() || '';
            if (t && t.length > 1) {
              let p = el.parentElement;
              let depth = 0;
              const parentIds = [];
              while (p && depth < 3) {
                if (p.id) parentIds.push(p.id);
                p = p.parentElement;
                depth++;
              }
              const style = el.getAttribute('style') || '';
              const fontSize = (style.match(/font-size:\s*(\d+)/) || [])[1] || '';
              widgets.push({
                id: el.id,
                text: t.substring(0, 200),
                parentIds: parentIds.join(','),
                fontSize
              });
            }
          });
          
          // Find interactive elements
          const inputs = [];
          doc.querySelectorAll('input, button, select, textarea, a').forEach(el => {
            const tag = el.tagName.toLowerCase();
            const type = el.type || '';
            const value = el.value || '';
            const text = el.textContent?.trim() || '';
            const placeholder = el.placeholder || '';
            const ariaLabel = el.getAttribute('aria-label') || '';
            const name = el.getAttribute('name') || '';
            const id = el.id || '';
            if (value || text || placeholder || ariaLabel || name) {
              inputs.push({ 
                id: id.substring(0, 50), tag, type, 
                value: value.substring(0, 80), 
                text: text.substring(0, 80), 
                placeholder: placeholder.substring(0, 80), 
                ariaLabel: ariaLabel.substring(0, 80), 
                name: name.substring(0, 80) 
              });
            }
          });

          // Find all table-related elements
          const tables = [];
          doc.querySelectorAll('table').forEach(t => tables.push(t.id || 'unnamed'));
          
          results.push({
            idx,
            src: (iframe.src || '').substring(0, 200),
            text: allText.substring(0, 5000),
            widgetCount: widgets.length,
            widgets: widgets.slice(0, 60),
            inputCount: inputs.length,
            inputs: inputs.slice(0, 40),
            tableCount: tables.length,
          });
        }
      } catch(e) {
        results.push({ idx, src: (iframe.src || '').substring(0, 200), error: e.message.substring(0, 100) });
      }
    });
    return results;
  });
  
  result.iframes = iframeData;
  console.log(`Iframes: ${iframeData.length}`);
  iframeData.forEach((f, i) => {
    console.log(`  Iframe ${i}: widgets=${f.widgetCount}, inputs=${f.inputCount}`);
    if (f.error) console.log(`    Error: ${f.error}`);
    if (f.widgets?.length > 0) {
      f.widgets.slice(0, 40).forEach(w => console.log(`    [${w.id}] ${w.text}`));
    }
    if (f.inputs?.length > 0) {
      f.inputs.slice(0, 30).forEach(inp => console.log(`    <${inp.tag} type="${inp.type}"> ${inp.text || inp.value || inp.placeholder || inp.ariaLabel}`));
    }
  });
  
  // Try to open notes panel
  console.log('Opening notes panel...');
  const noteClicked = await page.evaluate(() => {
    const btn = document.querySelector('.icon-v2-note2');
    if (btn) { btn.click(); return true; }
    // Try other selectors
    const btns = document.querySelectorAll('button');
    for (const b of btns) {
      if (b.textContent.includes('备注') || b.querySelector('[class*="note"]')) {
        b.click();
        return true;
      }
    }
    return false;
  });
  
  if (noteClicked) {
    console.log('Note button clicked, waiting for panel...');
    await page.waitForTimeout(3000);
    
    const notesData = await page.evaluate(() => {
      const result = { items: [], rawText: '' };
      
      // Look for notes drawer
      const selectors = [
        '[class*="notes-drawer"]',
        '[class*="NoteDrawer"]',
        '[class*="drawer"]',
        '[class*="note-panel"]',
        '[class*="NotePanel"]',
        '[class*="panel"]',
      ];
      
      for (const sel of selectors) {
        const els = document.querySelectorAll(sel);
        for (const el of els) {
          const text = el.textContent?.trim();
          if (text && text.length > 10 && (text.includes('备注') || text.includes('注释'))) {
            result.rawText = text.substring(0, 8000);
            
            // Try to parse cells
            const cells = el.querySelectorAll('[class*="cell"]');
            cells.forEach(cell => {
              const numEl = cell.querySelector('[class*="num"]');
              const nameEl = cell.querySelector('[class*="subtitle"] p, [class*="title"] p');
              const contentEl = cell.querySelector('[class*="content"]');
              if (numEl) {
                result.items.push({
                  num: numEl.textContent.trim(),
                  name: nameEl ? nameEl.textContent.trim() : '',
                  note: contentEl ? contentEl.textContent.trim().substring(0, 1000) : ''
                });
              }
            });
            
            return result;
          }
        }
      }
      
      return result;
    });
    
    result.notesContent = notesData;
    
    if (notesData.items.length > 0) {
      console.log(`Notes items (${notesData.items.length}):`);
      notesData.items.forEach(item => {
        console.log(`  #${item.num} ${item.name}: ${(item.note || '').substring(0, 300)}`);
      });
    } else if (notesData.rawText) {
      console.log('Raw notes text:', notesData.rawText.substring(0, 2000));
    } else {
      console.log('Notes panel opened but no content found');
    }
  } else {
    console.log('No notes button found');
  }
  
  return result;
}

(async () => {
  const browser = await chromium.launchPersistentContext(profileDir, {
    headless: true,
    args: ['--no-sandbox'],
  });

  const page = await browser.newPage();
  
  try {
    console.log('Navigating to CoDesign...');
    await page.goto('https://codesign.qq.com/s/697313341916783', { 
      waitUntil: 'networkidle', 
      timeout: 60000 
    });
    await page.waitForTimeout(5000);
    console.log('Loaded:', page.url());
    
    // Don't click 原型图 - the pages are already visible in the DOM
    const results = {};
    
    results['打单商业申请单'] = await extractPageContent(page, '打单商业申请单');
    
    // Check if we can still see the label (tree state)
    console.log('\nChecking tree state...');
    const labels = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.label-text')).map(l => ({
        text: l.textContent.trim(),
        visible: l.offsetParent !== null,
        rect: (() => { const r = l.getBoundingClientRect(); return {x: r.x, y: r.y, w: r.width, h: r.height}; })()
      }));
    });
    console.log('Labels now:');
    labels.forEach(l => console.log(`  "${l.text}" visible=${l.visible} rect=(${l.rect.x},${l.rect.y},${l.rect.w},${l.rect.h})`));
    
    results['打单商业档案'] = await extractPageContent(page, '打单商业档案');
    
    // Save results
    const outputPath = path.join(outputDir, 'page_details_v2.json');
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf-8');
    console.log(`\nAll results saved to ${outputPath}`);
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await browser.close();
  }
})();
