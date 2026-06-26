const { chromium } = require('E:/006Skills/.opencode/skills/playwright-mind/node_modules/playwright');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const PROFILE_DIR = 'E:/006Skills/.opencode/skills/.codesign-mcp/profile';
const DATAJS_URL = 'https://cdn4.codesign.qq.com/prototypes/2026/06/18/nZaDP26mWLYn06gpK0b18/fhnznggrfgpscjwb/350de5121709f7e1dd9c6fe3b0d677f4.js';
const SAVE_DIR = 'E:/006Skills/.opencode/skills/codesign_data';

(async () => {
  const context = await chromium.launchPersistentContext(PROFILE_DIR, { headless: true, timeout: 30000 });
  const page = context.pages()[0] || await context.newPage();

  try {
    // Download data.js
    console.log('[fetch] 下载 data.js...');
    const jsContent = await page.evaluate(async (url) => {
      const r = await fetch(url);
      return await r.text();
    }, DATAJS_URL);
    console.log(`[fetch] ${jsContent.length} bytes`);

    // Parse
    console.log('[parse] 解析 Axure 数据...');
    const iife = jsContent.substring(
      jsContent.indexOf('(function() {'),
      jsContent.lastIndexOf('return _creator();') + 'return _creator();'.length
    ) + '\n})()';

    const result = vm.runInContext(iife, vm.createContext({}));
    const pageObj = result.page || {};
    const pageName = pageObj.name || '客户管理（全功能）-制单';

    // Build widget index
    const allWidgets = [];
    function walkWidgets(obj, parentPath) {
      if (!obj || typeof obj !== 'object') return;
      if (Array.isArray(obj)) { obj.forEach(w => walkWidgets(w, parentPath)); return; }
      if (obj.id && obj.type) {
        const w = {
          id: obj.id,
          label: obj.label || '',
          type: obj.type,
          friendlyType: obj.friendlyType || '',
          widgetType: obj.widgetType || '',
          styleType: obj.styleType || '',
          parentPath,
          // Data structure info
          items: obj.items || null,
          options: obj.options || null,
          listItems: obj.listItems || null,
          // Constraints
          maxLength: obj.maxLength,
          min: obj.min,
          max: obj.max,
          required: obj.required,
          readOnly: obj.readOnly,
          hidden: obj.hidden,
          // Default values
          defaultText: obj.defaultText,
          defaultValue: obj.defaultValue || obj['默认值'],
          // Data source
          dataSource: obj.dataSource || obj['数据源'],
          refType: obj.refType || obj['参照类型'],
        };
        allWidgets.push(w);
      }
      // Recurse
      for (const ck of ['objects', 'objs', 'children', 'items', 'widgets']) {
        if (Array.isArray(obj[ck])) walkWidgets(obj[ck], (parentPath ? parentPath + ' > ' : '') + (obj.label || obj.id || ''));
      }
    }
    walkWidgets(pageObj.diagram?.objects || pageObj, '');

    console.log(`\n共 ${allWidgets.length} 个控件\n`);

    // Group by type
    const byType = {};
    allWidgets.forEach(w => {
      const t = w.friendlyType || w.type || 'unknown';
      if (!byType[t]) byType[t] = [];
      byType[t].push(w);
    });

    console.log('=== 控件类型分布 ===');
    Object.keys(byType).sort().forEach(t => {
      console.log(`  ${t}: ${byType[t].length}`);
    });

    // Extract data structures - combo boxes, list boxes, dropdowns
    const dataWidgets = allWidgets.filter(w => w.items || w.listItems || w.options || w.dataSource);
    if (dataWidgets.length > 0) {
      console.log('\n=== 数据结构控件 ===');
      dataWidgets.forEach(w => {
        console.log(`  [${w.friendlyType || w.type}] ${w.label || '(未命名)'}`);
        if (w.items) console.log(`    items:`, JSON.stringify(w.items).substring(0, 200));
        if (w.listItems) console.log(`    listItems:`, JSON.stringify(w.listItems).substring(0, 200));
        if (w.options) console.log(`    options:`, JSON.stringify(w.options).substring(0, 200));
        if (w.dataSource) console.log(`    dataSource: ${w.dataSource}`);
      });
    }

    // Extract textBox/input widgets with constraints
    const formWidgets = allWidgets.filter(w => w.type === 'textBox' || w.friendlyType === '文本框' || w.type === 'dropList' || w.friendlyType === '下拉框');
    if (formWidgets.length > 0) {
      console.log('\n=== 表单控件详情 ===');
      formWidgets.forEach(w => {
        const constraints = [];
        if (w.maxLength) constraints.push(`maxLength=${w.maxLength}`);
        if (w.min !== undefined) constraints.push(`min=${w.min}`);
        if (w.max !== undefined) constraints.push(`max=${w.max}`);
        if (w.required) constraints.push('required');
        if (w.readOnly) constraints.push('readOnly');
        if (w.hidden) constraints.push('hidden');
        console.log(`  [${w.friendlyType || w.type}] ${w.label || '(未命名)'} ${constraints.length ? '| ' + constraints.join(', ') : ''}`);
        if (w.defaultText || w.defaultValue) console.log(`    默认值: ${w.defaultText || w.defaultValue}`);
        if (w.dataSource) console.log(`    数据源: ${w.dataSource}`);
        if (w.refType) console.log(`    参照: ${w.refType}`);
        if (w.items) console.log(`    items:`, JSON.stringify(w.items).substring(0, 300));
        if (w.listItems) console.log(`    listItems:`, JSON.stringify(w.listItems).substring(0, 300));
      });
    }

    // Save full widget data
    const output = {
      pageName,
      widgetCount: allWidgets.length,
      byType,
      formWidgets: formWidgets.map(w => ({
        id: w.id,
        label: w.label,
        type: w.type,
        friendlyType: w.friendlyType,
        constraints: { maxLength: w.maxLength, min: w.min, max: w.max, required: w.required, readOnly: w.readOnly },
        defaultValue: w.defaultText || w.defaultValue,
        dataSource: w.dataSource,
        refType: w.refType,
        items: w.items,
        listItems: w.listItems,
        options: w.options,
      })),
    };
    fs.writeFileSync(path.join(SAVE_DIR, 'widget-structure.json'), JSON.stringify(output, null, 2), 'utf8');
    console.log(`\n✅ 已保存到: ${path.join(SAVE_DIR, 'widget-structure.json')}`);

  } catch (e) {
    console.error('[error]', e.message);
  } finally {
    await context.close();
  }
})();
