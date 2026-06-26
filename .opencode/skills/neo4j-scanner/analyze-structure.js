const fs = require('fs');

const DATAJS = 'E:/006Skills/.opencode/skills/neo4j-scanner/extract-widget-structure.js'; // redirect manually

// Actually need to re-download, but we have the annotations already.
// Let me search the sharing-data.json for page metadata about this page

const sharingData = JSON.parse(fs.readFileSync('E:/006Skills/.opencode/skills/codesign_data/sharing-data.json', 'utf8'));
const proto = sharingData.prototypes?.[0];
const pages = proto?.pages || {};

// Find the customer manage page
const targetKey = Object.keys(pages).find(k => k.includes('客户管理（全功能）-制单'));
if (targetKey) {
  console.log('目标页:', targetKey);
  console.log(JSON.stringify(pages[targetKey], null, 2));
}

// Now let me check what the widget-structure.json tells us
const extJsPath = 'E:/006Skills/.opencode/skills/codesign_data/widget-structure.json';
let totalDroplets = 0;
try {
  const ws = JSON.parse(fs.readFileSync(extJsPath, 'utf8'));
  console.log(`\n共 ${ws.widgetCount} 个控件`);
  console.log('\n=== 控件类型 ===');
  Object.keys(ws.byType).forEach(t => {
    const count = ws.byType[t].length;
    totalDroplets += count;
    console.log(`  ${t}: ${count}`);
  });
  
  // Check for widgets that have data
  console.log('\n=== 带数据的表单控件 ===');
  ws.formWidgets.forEach(w => {
    const hasData = w.items || w.listItems || w.options || w.dataSource || w.refType || w.defaultValue;
    if (hasData) {
      console.log(`  ${w.friendlyType} id=${w.id.substring(0,8)}`);
      if (w.items) console.log(`    items: ${JSON.stringify(w.items).substring(0,200)}`);
      if (w.listItems) console.log(`    listItems: ${JSON.stringify(w.listItems).substring(0,200)}`);
      if (w.options) console.log(`    options: ${JSON.stringify(w.options).substring(0,200)}`);
      if (w.dataSource) console.log(`    dataSource: ${w.dataSource}`);
    }
  });
  
  // Search raw data.js for droplist/combobox item patterns
  console.log('\n=== 直接从 data.js 搜索选项模式 ===');
  // Can't do this without the raw file
  console.log('(需从 CDN 重新下载 data.js)');
  
} catch(e) {
  console.log('结构文件未找到:', e.message);
}
