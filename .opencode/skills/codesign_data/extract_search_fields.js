const { chromium } = require('E:\\006Skills\\.opencode\\skills\\apifox-sync\\node_modules\\playwright-core');
const path = require('path');
const fs = require('fs');

const profileDir = 'E:\\006Skills\\.opencode\\skills\\.codesign-mcp\\profile';
const outputDir = 'E:\\006Skills\\.opencode\\skills\\codesign_data';

async function clickPage(page, name) {
  return await page.evaluate((n) => {
    const labels = document.querySelectorAll('.label-text');
    for (const l of labels) {
      if (l.textContent.trim() === n) { l.click(); return true; }
    }
    return false;
  }, name);
}

(async () => {
  const browser = await chromium.launchPersistentContext(profileDir, {
    headless: true,
    args: ['--no-sandbox'],
  });

  const page = await browser.newPage();
  
  try {
    await page.goto('https://codesign.qq.com/s/697313341916783', { waitUntil: 'networkidle', timeout: 120000 });
    console.log('Page loaded, waiting for iframe...');
    await page.waitForTimeout(5000);
    console.log('Loaded:', page.url());

    const pagesToCheck = ['打单商业申请单', '打单商业档案'];
    const allResults = {};

    for (const pn of pagesToCheck) {
      console.log(`\n========== ${pn} ==========`);
      await clickPage(page, pn);
      await page.waitForTimeout(5000);

      // Use Playwright's frame API to access iframe content
      const details = { pageName: pn, allTextWidgets: [], allInputs: [], frames: 0 };
      
      const frames = page.frames();
      console.log(`  Total frames: ${frames.length}`);
      
      for (const frame of frames) {
        if (frame === page.mainFrame()) continue;
        details.frames++;
        console.log(`  Frame ${details.frames}: ${frame.url().substring(0, 200)}`);
        
        try {
          await frame.waitForSelector('body', { timeout: 5000 }).catch(() => {});
          
          // Get text content
          const bodyText = await frame.evaluate(() => document.body?.innerText || '');
          console.log(`  Body text (first 200): ${bodyText.substring(0, 200)}`);
          
          // Get all text widgets
          const widgets = await frame.evaluate(() => {
            const result = [];
            const textEls = document.querySelectorAll('[id*="_text"]');
            textEls.forEach(el => {
              const text = el.textContent?.trim() || '';
              if (text && text.length > 1) {
                const rect = el.getBoundingClientRect();
                result.push({
                  id: el.id,
                  tag: el.tagName,
                  text: text.substring(0, 100),
                  x: Math.round(rect.x), y: Math.round(rect.y),
                });
              }
            });
            return result;
          });
          details.allTextWidgets = widgets;
          console.log(`  Text widgets: ${widgets.length}`);

          // Get all input/select/button elements
          const inputs = await frame.evaluate(() => {
            const result = [];
            const elements = document.querySelectorAll('input, select, textarea, button, a');
            elements.forEach(el => {
              const tag = el.tagName.toLowerCase();
              const type = el.type || '';
              const id = el.id || '';
              const val = el.value || '';
              const text = el.textContent?.trim() || '';
              const placeholder = el.placeholder || '';
              const ariaLabel = el.getAttribute('aria-label') || '';
              
              // Find preceding text label
              let labelText = '';
              let prev = el.previousElementSibling;
              if (prev) labelText = prev.textContent?.trim() || '';

              const rect = el.getBoundingClientRect();
              result.push({
                id: id.substring(0, 60), tag, type,
                value: val.substring(0, 100), text: text.substring(0, 100),
                placeholder: placeholder.substring(0, 100), ariaLabel: ariaLabel.substring(0, 100),
                x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.w), h: Math.round(rect.h),
                labelText: labelText.substring(0, 100)
              });
            });
            result.sort((a, b) => a.y - b.y || a.x - b.x);
            return result;
          });
          if (inputs.length > 0) {
            details.allInputs = inputs;
            console.log(`  Inputs: ${inputs.length}`);
          }

        } catch(e) {
          console.log(`  Frame error: ${e.message.substring(0, 100)}`);
        }
      }

      allResults[pn] = details;
      
      // Print organized summary for this page
      const searchInputs = details.allInputs
        .filter(inp => inp.tag === 'input' && inp.type === 'text')
        .sort((a, b) => a.y - b.y);
      console.log(`\nSearch text inputs (sorted by position):`);
      searchInputs.forEach((inp, i) => {
        const label = inp.labelText || inp.placeholder || inp.ariaLabel || '(no label)';
        console.log(`  ${i+1}. y=${inp.y} label="${label}" placeholder="${inp.placeholder}"`);
      });
      
      const selectInputs = details.allInputs
        .filter(inp => inp.tag === 'select')
        .sort((a, b) => a.y - b.y);
      if (selectInputs.length > 0) {
        console.log(`\nSelect/dropdown inputs:`);
        selectInputs.forEach((inp, i) => {
          console.log(`  ${i+1}. y=${inp.y} text="${inp.text}" label="${inp.labelText}"`);
        });
      }
      
      console.log(`\nAll inputs (${details.allInputs.length}):`);
      details.allInputs.forEach((inp, i) => {
        console.log(`  ${i+1}. <${inp.tag} type="${inp.type}" id="${inp.id}"> y=${inp.y} "${(inp.text || inp.value || inp.placeholder || inp.ariaLabel).substring(0, 60)}"`);
      });
    }

    fs.writeFileSync(path.join(outputDir, 'search_fields_detailed.json'), JSON.stringify(allResults, null, 2), 'utf-8');
    console.log('\nSaved to search_fields_detailed.json');

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await browser.close();
  }
})();
