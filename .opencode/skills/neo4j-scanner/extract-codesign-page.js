const { chromium } = require('E:/006Skills/.opencode/skills/playwright-mind/node_modules/playwright');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const PROFILE_DIR = 'E:/006Skills/.opencode/skills/.codesign-mcp/profile';
const SHARING_URL = 'https://codesign.qq.com/s/686059816013115';
const PASSWORD = 'SRSZ';
const SAVE_DIR = path.resolve(__dirname, '..', 'codesign_data');
fs.mkdirSync(SAVE_DIR, { recursive: true });

(async () => {
  const context = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: true, viewport: { width: 1920, height: 1080 }, timeout: 60000
  });
  const page = context.pages()[0] || await context.newPage();

  try {
    // Intercept API response - capture the one with prototypes data
    let sharingData = null;
    page.on('response', async (resp) => {
      if (resp.url().includes('/api/sharings/686059816013115') && resp.status() === 200) {
        try {
          const json = await resp.json();
          if (json.prototypes?.length > 0) {
            sharingData = json;
            console.log('[✓] 捕获到完整 sharing 数据');
          }
        } catch {}
      }
    });

    // Navigate
    await page.goto(SHARING_URL, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(3000);

    // Submit password if needed
    if (await page.locator('input[placeholder="请输入"]').isVisible().catch(() => false)) {
      console.log('[pwd] 提交密码...');
      await page.fill('input[placeholder="请输入"]', PASSWORD);
      await page.click('button:has-text("确定")');
      await page.waitForTimeout(5000);
    }

    // Wait for data
    for (let i = 0; i < 20; i++) {
      if (sharingData) break;
      await page.waitForTimeout(1000);
    }

    if (!sharingData) {
      console.log('[✗] 未捕获到 sharing 数据');
      return;
    }

    console.log('[data] 标题:', sharingData.title, '类型:', sharingData.type);
    console.log('[data] 原型数:', sharingData.prototypes?.length);

    if (!sharingData.prototypes?.length) { console.log('[✗] 无原型数据'); return; }

    const proto = sharingData.prototypes[0];

    console.log(`原型: ${proto.name}, ${proto.pages_count} 页`);
    console.log(`CDN: ${proto.resource_base_url}`);

    // Save full data
    fs.writeFileSync(path.join(SAVE_DIR, 'sharing-data.json'), JSON.stringify(sharingData, null, 2), 'utf8');

    // Find target page
    const pages = proto.pages || {};
    const targetKey = Object.keys(pages).find(k => k.includes('客户管理（全功能）-制单'));
    if (!targetKey) { console.log('未找到目标页面'); return; }

    const pageInfo = pages[targetKey];
    console.log(`\n目标页: ${targetKey}`);
    console.log(`meta: ${pageInfo.meta_path}`);

    // Download meta JSON
    const base = (proto.resource_base_url || 'https://cdn4.codesign.qq.com/').replace(/\/$/, '');
    const metaUrl = base + pageInfo.meta_path;
    console.log(`下载 meta...`);
    
    const metaResp = await page.evaluate(async (url) => {
      const r = await fetch(url); return await r.json();
    }, metaUrl);
    fs.writeFileSync(path.join(SAVE_DIR, 'target_meta.json'), JSON.stringify(metaResp, null, 2), 'utf8');

    // Find data.js
    const dataJsKey = Object.keys(metaResp.scripts || {}).find(k => k.includes('客户管理（全功能）-制单') && k.endsWith('data.js'));
    if (!dataJsKey) { console.log('未找到 data.js'); return; }

    const jsInfo = metaResp.scripts[dataJsKey];
    const jsUrl = base + jsInfo.path;
    console.log(`下载 data.js (${jsInfo.hash})...`);

    const jsContent = await page.evaluate(async (url) => {
      const r = await fetch(url); return await r.text();
    }, jsUrl);
    console.log(`data.js: ${jsContent.length} bytes`);

    // Parse annotations
    const iife = jsContent.substring(
      jsContent.indexOf('(function() {'),
      jsContent.lastIndexOf('return _creator();') + 'return _creator();'.length
    ) + '\n})()';

    const result = vm.runInContext(iife, vm.createContext({}));
    const pageObj = result.page || {};
    const pageName = pageObj.name || targetKey;
    const annotations = pageObj.annotations || [];

    console.log(`\n========== ${pageName} ==========`);
    console.log(`控件注释数: ${annotations.length}\n`);

    for (const a of annotations) {
      const noteHtml = a['注释'] || '';
      const plainText = noteHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      console.log(`[${a.label || '(未命名)'}]`);
      console.log(`   ${plainText.substring(0, 800)}`);
      console.log('');
    }

    // Save extracted data
    const extracted = {
      pageName,
      annotations: annotations.map(a => ({
        label: a.label,
        notes: a['注释'] || '',
        plainText: (a['注释'] || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
      })),
    };
    const extractedPath = path.join(SAVE_DIR, 'extracted.json');
    fs.writeFileSync(extractedPath, JSON.stringify(extracted, null, 2), 'utf8');
    console.log(`\n✅ 已保存到: ${extractedPath}`);

  } catch (e) {
    console.error('[error]', e.message);
  } finally {
    await context.close();
  }
})();
