const { chromium } = require('E:\\006Skills\\.opencode\\skills\\apifox-sync\\node_modules\\playwright-core');
const path = require('path');
const fs = require('fs');

const profileDir = 'E:\\006Skills\\.opencode\\skills\\.codesign-mcp\\profile';
const outputDir = 'E:\\006Skills\\.opencode\\skills\\codesign_data';

async function clickLabelByText(page, text) {
  const labels = await page.$$('.label-text');
  for (const label of labels) {
    const t = await label.textContent();
    if (t.trim() === text) {
      await label.scrollIntoViewIfNeeded();
      await label.click();
      console.log(`Clicked: "${text}"`);
      await page.waitForTimeout(2000);
      return true;
    }
  }
  console.log(`NOT FOUND: "${text}"`);
  return false;
}

async function extractPageContent(page, pageName) {
  console.log(`\n===== Extracting: ${pageName} =====`);
  
  // Click the page
  const clicked = await clickLabelByText(page, pageName);
  if (!clicked) return null;
  
  // Wait for content to load
  await page.waitForTimeout(3000);
  
  const result = {
    pageName,
    url: page.url(),
    screenshots: [],
    iframes: [],
    pageContent: null,
    notesContent: null,
  };
  
  // Screenshot
  const screenshotPath = path.join(outputDir, `${pageName.replace(/[\\/:*?"<>|]/g, '_')}.png`);
  await page.screenshot({ path: screenshotPath });
  result.screenshots.push(screenshotPath);
  console.log(`Screenshot saved: ${screenshotPath}`);
  
  // Wait for the main content area and iframes
  await page.waitForTimeout(2000);
  
  // Extract content from all iframes
  const iframeData = await page.evaluate(() => {
    const iframes = document.querySelectorAll('iframe');
    const results = [];
    
    iframes.forEach((iframe, idx) => {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc && doc.body) {
          // Get all text
          const allText = doc.body.innerText || '';
          
          // Find text widgets (Axure style: text elements with ids like uXXX_text)
          const widgets = [];
          const textEls = doc.querySelectorAll('[id*="_text"]');
          textEls.forEach(el => {
            const text = el.textContent?.trim() || '';
            if (text && text.length > 1) {
              const parentIds = [];
              let p = el.parentElement;
              let depth = 0;
              while (p && depth < 5) {
                if (p.id) parentIds.push(p.id);
                p = p.parentElement;
                depth++;
              }
              widgets.push({
                id: el.id,
                text: text.substring(0, 200),
                parentIds: parentIds.join(','),
                tag: el.tagName,
                className: (el.className || '').substring(0, 60)
              });
            }
          });
          
          // Find interactive elements (inputs, buttons, selects)
          const inputs = [];
          doc.querySelectorAll('input, button, select, textarea, a').forEach(el => {
            const tag = el.tagName.toLowerCase();
            const type = el.type || '';
            const value = el.value || '';
            const text = el.textContent?.trim() || '';
            const placeholder = el.placeholder || '';
            const ariaLabel = el.getAttribute('aria-label') || '';
            const name = el.getAttribute('name') || '';
            const href = el.getAttribute('href') || '';
            const id = el.id || '';
            if (value || text || placeholder || ariaLabel || name) {
              inputs.push({ id, tag, type, value: value.substring(0, 100), text: text.substring(0, 100), placeholder: placeholder.substring(0, 100), ariaLabel: ariaLabel.substring(0, 100), name: name.substring(0, 100), href: href.substring(0, 100) });
            }
          });
          
          results.push({
            idx,
            src: iframe.src?.substring(0, 200) || '',
            width: iframe.width || '',
            height: iframe.height || '',
            textLength: allText.length,
            text: allText.substring(0, 5000),
            widgets: widgets.slice(0, 100),
            inputs: inputs.slice(0, 50),
          });
        }
      } catch(e) {
        results.push({ idx, src: iframe.src?.substring(0, 200) || '', error: e.message });
      }
    });
    return results;
  });
  
  result.iframes = iframeData;
  console.log(`Iframes found: ${iframeData.length}`);
  iframeData.forEach((f, i) => {
    console.log(`  Iframe ${i}: ${f.src.substring(0, 100)}`);
    if (f.text) console.log(`    Text length: ${f.textLength}, Widgets: ${f.widgets?.length}, Inputs: ${f.inputs?.length}`);
    if (f.widgets?.length > 0) {
      console.log(`    Widgets (first 30):`);
      f.widgets.slice(0, 30).forEach(w => console.log(`      [${w.id}] ${w.text}`));
    }
    if (f.inputs?.length > 0) {
      console.log(`    Inputs (first 20):`);
      f.inputs.slice(0, 20).forEach(inp => console.log(`      <${inp.tag} type="${inp.type}" id="${inp.id}"> value="${inp.value}" text="${inp.text}" placeholder="${inp.placeholder}"`));
    }
  });
  
  // Try to extract notes
  console.log('Trying to extract notes...');
  
  // Click the note button if available
  const noteClicked = await page.evaluate(() => {
    const noteBtn = document.querySelector('.icon-v2-note2');
    if (noteBtn && noteBtn.offsetParent !== null) {
      noteBtn.click();
      return true;
    }
    return false;
  });
  
  if (noteClicked) {
    console.log('Note button clicked');
    await page.waitForTimeout(2000);
    
    const notesData = await page.evaluate(() => {
      const result = { items: [], pageNote: null, rawText: '' };
      
      // Look for a notes drawer
      const drawer = document.querySelector('[class*="notes-drawer"]') ||
                     document.querySelector('[class*="NoteDrawer"]') ||
                     document.querySelector('[class*="drawer"]');
      
      if (drawer) {
        result.rawText = drawer.textContent.substring(0, 5000);
        
        const cells = drawer.querySelectorAll('[class*="notes-cell"], [class*="NotesCell"]');
        cells.forEach(cell => {
          const numEl = cell.querySelector('[class*="num"]');
          const nameEl = cell.querySelector('[class*="note-subtitle"] p, [class*="NoteSubtitle"] p');
          const contentEl = cell.querySelector('[class*="note-content"], [class*="NoteContent"]');
          if (numEl && nameEl) {
            result.items.push({
              num: numEl.textContent.trim(),
              name: nameEl.textContent.trim(),
              note: contentEl ? contentEl.textContent.trim().substring(0, 500) : ''
            });
          }
        });
      }
      
      return result;
    });
    
    console.log('Notes items:', notesData.items.length);
    notesData.items.forEach(item => {
      console.log(`  #${item.num} ${item.name}: ${item.note?.substring(0, 200)}`);
    });
    if (!notesData.items.length && notesData.rawText) {
      console.log(' Raw notes text:', notesData.rawText.substring(0, 2000));
    }
    
    result.notesContent = notesData;
  } else {
    console.log('No notes button found or not visible');
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
    await page.waitForTimeout(3000);
    console.log('Loaded:', page.url());
    
    // First ensure the tree is expanded properly
    // Click "原型图" if needed
    await clickLabelByText(page, '原型图');
    
    // Now extract the two target pages
    const results = {};
    
    results['打单商业申请单'] = await extractPageContent(page, '打单商业申请单');
    results['打单商业档案'] = await extractPageContent(page, '打单商业档案');
    
    // Save results
    const outputPath = path.join(outputDir, 'page_details.json');
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf-8');
    console.log(`\nAll results saved to ${outputPath}`);
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await browser.close();
  }
})();
