const { chromium } = require('E:/006Skills/.opencode/skills/playwright-mind/node_modules/playwright');
const fs = require('fs');
const vm = require('vm');

const PROFILE_DIR = 'E:/006Skills/.opencode/skills/.codesign-mcp/profile';
const DATAJS_URL = 'https://cdn4.codesign.qq.com/prototypes/2026/06/18/nZaDP26mWLYn06gpK0b18/fhnznggrfgpscjwb/350de5121709f7e1dd9c6fe3b0d677f4.js';
const SAVE_DIR = 'E:/006Skills/.opencode/skills/codesign_data';

(async () => {
  const context = await chromium.launchPersistentContext(PROFILE_DIR, { headless: true, timeout: 30000 });
  const page = context.pages()[0] || await context.newPage();

  try {
    const jsContent = await page.evaluate(async (url) => {
      const r = await fetch(url);
      return await r.text();
    }, DATAJS_URL);
    console.log(`[fetch] ${jsContent.length} bytes`);

    // Save raw for offline analysis
    fs.writeFileSync(SAVE_DIR + '/target_data.js', jsContent, 'utf8');

    // Search for specific patterns in raw text
    const patterns = [
      '中成药', '化学药', '生物制品', '保健品', '食品', '中药饮片',
      '业绩核算', '信息组', '连锁体系', '客户类别', '行政区域',
      '使用', '停用', '默认',
      '编码', '生成规则', 'NCPK', 'NC编号',
      '销售组织', '99990001',
    ];

    console.log('\n=== 查找数据定义模式 ===');
    for (const pat of patterns) {
      let idx = 0;
      const count = [];
      while ((idx = jsContent.indexOf(pat, idx)) !== -1) {
        count.push(idx);
        idx += pat.length;
        if (count.length >= 3) break;
      }
      if (count.length > 0) {
        // Show context around the first occurrence
        const ctx = jsContent.substring(Math.max(0, count[0] - 60), count[0] + pat.length + 60);
        console.log(`\n[${pat}] x${count.length > 2 ? '3+' : count.length}`);
        console.log(`  ...${ctx.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '').substring(0, 200)}...`);
      }
    }

    // Search for dropdown/list widget patterns
    // In Axure, dropdown items might be stored as "listItems", "options", or "items" arrays
    console.log('\n=== 搜索数据结构关键词 ===');
    const dataKeywords = ['"listItems"', '"options"', '"items"', '"option"', '"list"', 'dropList', 'comboBox', 'listBox'];
    for (const kw of dataKeywords) {
      const idx = jsContent.indexOf(kw);
      if (idx >= 0) {
        const ctx = jsContent.substring(Math.max(0, idx - 100), idx + 200);
        console.log(`\n[${kw}] at offset ${idx}`);
        console.log(`  ${ctx.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '').substring(0, 300)}`);
      }
    }

    // Try to find all option-like string patterns
    // Axure uses _(key, value) pairs. Look for Chinese values near "label" keys
    console.log('\n=== 搜索以下拉选项格式 ===');
    const lines = jsContent.split('\n');
    let foundOptionLines = 0;
    for (let i = 0; i < lines.length && foundOptionLines < 20; i++) {
      const line = lines[i];
      if ((line.includes('使用') || line.includes('停用') || line.includes('默认')) && 
          line.length < 200 && line.length > 10) {
        const cleaned = line.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '').trim();
        if (cleaned.length > 10) {
          console.log(`  L${i+1}: ${cleaned.substring(0, 200)}`);
          foundOptionLines++;
        }
      }
    }

  } catch (e) {
    console.error('[error]', e.message);
  } finally {
    await context.close();
  }
})();
