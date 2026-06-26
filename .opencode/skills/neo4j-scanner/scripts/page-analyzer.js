/**
 * page-analyzer.js
 * 分层分析页面：搜索区 → 操作按钮 → 表单/表格 → 新增弹窗
 */
async function analyzePage(page, pageName) {
  console.log(`[analyze] ${pageName}`);
  await page.waitForTimeout(2000);

  const result = {
    name: pageName,
    url: page.url(),
    searchFields: [],
    actionButtons: [],
    tableColumns: [],
    createForm: [],
    testPoints: [],
  };

  // 1. Extract all info from the page
  const pageInfo = await page.evaluate(() => {
    const info = {
      forms: 0, inputs: 0, selects: 0, buttons: [],
      searchFields: [], actionButtons: [], tableHeaders: [],
    };

    // Count forms and elements
    info.forms = document.querySelectorAll('form').length;
    info.inputs = document.querySelectorAll('input:not([type="hidden"])').length;
    info.selects = document.querySelectorAll('select').length;

    // Collect all buttons with their text
    document.querySelectorAll('button').forEach(b => {
      const t = b.textContent.trim();
      if (t && t.length < 10) info.buttons.push(t);
    });

    // Identify search fields - fields with labels in the search/query area
    const searchArea = document.querySelector('[class*="search"]') || 
                       document.querySelector('[class*="query"]') ||
                       document.querySelector('[class*="filter"]') ||
                       document.querySelector('.ant-card:first-child') ||
                       document.querySelector('.ant-form') ||
                       document.body;

    // Condition operators to exclude
    const condOps = new Set(['包含','等于','之内','之外','大于','小于','不等于','介于','请选择','不包含','不等于','大于等于','小于等于']);
    const isCondSelect = (sel) => {
      if (!sel) return false;
      const opts = Array.from(sel.options).map(o => o.text.trim()).filter(Boolean);
      return opts.length > 0 && opts.every(o => condOps.has(o));
    };

    // Get all form-item labels (Ant Design pattern)
    document.querySelectorAll('.ant-form-item').forEach(item => {
      const labelEl = item.querySelector('.ant-form-item-label label, .ant-form-item-label');
      if (!labelEl) return;
      const label = labelEl.textContent.trim();
      if (!label || condOps.has(label)) return;

      // Find inputs in this form-item, skip condition operator selects
      const selectEls = item.querySelectorAll('select');
      let valueSelect = null;
      for (const s of selectEls) {
        if (!isCondSelect(s)) { valueSelect = s; break; }
      }

      const input = item.querySelector('input:not([type="hidden"]), textarea') || valueSelect;
      if (!input && !item.querySelector('.ant-select') && !item.querySelector('.ant-picker')) return;

      let type = 'text';
      if (input) {
        if (input.tagName === 'SELECT') type = 'select';
        else if (input.type === 'number') type = 'number';
        else if (input.type === 'date') type = 'date';
        else if (input.tagName === 'TEXTAREA') type = 'textarea';
      } else if (item.querySelector('.ant-select')) type = 'select';
      else if (item.querySelector('.ant-picker')) type = 'date';

      const required = !!item.querySelector('.ant-form-item-required');

      // Only get options from value selects (not condition selects)
      let options = [];
      if (valueSelect) options = Array.from(valueSelect.options).map(o => o.text.trim()).filter(Boolean);

      info.searchFields.push({ label, type, required, options });
    });

    // Also get standalone inputs with labels (non-antd)
    if (info.searchFields.length === 0) {
      document.querySelectorAll('input, select').forEach(el => {
        if (el.closest('.ant-form-item')) return;
        if (el.type === 'hidden') return;
        const id = el.id || el.name;
        let label = '';
        if (id) {
          const lbl = document.querySelector(`label[for="${id}"]`);
          if (lbl) label = lbl.textContent.trim();
        }
        if (!label && el.placeholder) label = el.placeholder;
        if (!label) label = el.name || '';
        if (!label) return;

        let type = el.tagName === 'SELECT' ? 'select' : el.type || 'text';
        let options = [];
        if (el.tagName === 'SELECT') options = Array.from(el.options).map(o => o.text.trim()).filter(Boolean);
        info.searchFields.push({ label, type, required: el.hasAttribute('required'), options });
      });
    }

    // Get table headers - Ant Design table (multiple patterns)
    const headerSelectors = [
      '.ant-table-thead .ant-table-cell',
      '.ant-table-thead th',
      'table thead th',
      'table thead td',
      '[class*="header"] th',
      '[class*="header"] td',
      '.ant-table-column-has-sorters',
      '.ant-table-column-title',
    ];
    headerSelectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        // Get text from the innermost element that has text
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
        let text = '';
        let node;
        while (node = walker.nextNode()) {
          const t = node.textContent.trim();
          if (t && !['','*','#','序号'].includes(t)) text += (text ? ' ' : '') + t;
        }
        if (!text) text = el.textContent.trim();
        if (text && text.length > 0 && text.length < 30 && !info.tableHeaders.includes(text)) info.tableHeaders.push(text);
      });
    });

    // Deduplicate buttons (remove duplicates, keep order)
    info.buttons = [...new Set(info.buttons)];

    return info;
  });

  result.searchFields = pageInfo.searchFields.map(f => ({
    label: f.label, type: f.type, required: f.required,
    options: f.options, testType: getFieldTestType(f.type),
  }));

  result.tableColumns = pageInfo.tableHeaders;

  // Identify action buttons (exclude form buttons like 查询/重置)
  const formBtns = ['查询','重置','高级查询'];
  result.actionButtons = pageInfo.buttons.filter(b => b.length > 0 && !formBtns.includes(b));

  console.log(`  搜索字段: ${result.searchFields.length}, 按钮: ${result.actionButtons.length}, 表头: ${result.tableColumns.length}`);

  // ==== 区域一：搜索区域测试点 ====
  result.searchFields.forEach(f => {
    const pageName = result.name;
    if (f.required) {
      result.testPoints.push({
        area: '搜索', type: '必填校验', field: f.label, mode: '查询',
        precondition: `进入【${pageName}】页面`,
        steps: [`【${f.label}】留空不填写`, '点击【查询】按钮'],
        expected: '提示请输入查询条件 或 正常显示全部数据',
        testData: '',
      });
    }
    if (f.type === 'select' && f.options.length > 0) {
      f.options.forEach(opt => {
        if (!opt || ['请选择',''].includes(opt)) return;
        result.testPoints.push({
          area: '搜索', type: '下拉选项', field: f.label, mode: '查询',
          precondition: `进入【${pageName}】页面`,
          steps: [`【${f.label}】选择【${opt}】`, '点击【查询】按钮'],
          expected: `列表仅显示${f.label}为"${opt}"的数据`,
          testData: opt,
        });
      });
    }
    if (f.type === 'text') {
      result.testPoints.push({
        area: '搜索', type: '输入框正常值', field: f.label, mode: '查询',
        precondition: `进入【${pageName}】页面`,
        steps: [`【${f.label}】输入正常测试值`, '点击【查询】按钮'],
        expected: '匹配的查询结果正确显示',
        testData: '测试',
      });
      result.testPoints.push({
        area: '搜索', type: '输入框特殊字符', field: f.label, mode: '查询',
        precondition: `进入【${pageName}】页面`,
        steps: [`【${f.label}】输入特殊字符 @#$%`, '点击【查询】按钮'],
        expected: '正确转义，不报错，不触发XSS',
        testData: '@#$%',
      });
    }
    if (f.type === 'date') {
      result.testPoints.push({
        area: '搜索', type: '日期范围', field: f.label, mode: '查询',
        precondition: `进入【${pageName}】页面`,
        steps: [`【${f.label}】选择开始日期和结束日期`, '点击【查询】按钮'],
        expected: '仅显示该日期范围内的数据',
        testData: '',
      });
    }
  });

  // ==== 区域二：按钮区域测试点 ====
  const btnTestMap = {
    '新增': { precondition: `进入【${result.name}】页面`, steps: ['点击【新增】按钮'], expected: '弹出新增表单/跳转到新增页面' },
    '修改': { precondition: `进入【${result.name}】页面，选中一条数据`, steps: ['选中一条数据', '点击【修改】按钮'], expected: '弹出编辑表单，数据正确回填' },
    '删除': { precondition: `进入【${result.name}】页面，选中一条数据`, steps: ['选中一条数据', '点击【删除】按钮', '确认删除'], expected: '数据被删除，列表刷新' },
    '启用': { precondition: `进入【${result.name}】页面，选中一条数据`, steps: ['选中一条数据', '点击【启用】按钮', '确认'], expected: '数据状态变更为启用' },
    '停用': { precondition: `进入【${result.name}】页面，选中一条数据`, steps: ['选中一条数据', '点击【停用】按钮', '确认'], expected: '数据状态变更为停用' },
    '查看修改记录': { precondition: `进入【${result.name}】页面，选中一条数据`, steps: ['选中一条数据', '点击【查看修改记录】'], expected: '弹出修改记录列表' },
    '当前导出': { precondition: `进入【${result.name}】页面，已有查询结果`, steps: ['点击【当前导出】按钮'], expected: '导出当前页数据，格式正确' },
    '全部导出': { precondition: `进入【${result.name}】页面，已有查询结果`, steps: ['点击【全部导出】按钮'], expected: '导出全部数据，格式正确' },
    '导入excel': { precondition: `进入【${result.name}】页面`, steps: ['点击【导入excel】按钮', '选择文件上传'], expected: '数据导入成功' },
    '下载模板': { precondition: `进入【${result.name}】页面`, steps: ['点击【下载模板】按钮'], expected: '下载模板文件，格式正确' },
    '批量修改': { precondition: `进入【${result.name}】页面，选中多条数据`, steps: ['选中多条数据', '点击【批量修改】'], expected: '弹出批量修改弹窗' },
    '批量导入': { precondition: `进入【${result.name}】页面`, steps: ['点击【批量导入】', '选择文件'], expected: '数据批量导入成功' },
    '主子表模式': { precondition: `进入【${result.name}】页面`, steps: ['点击【主子表模式】'], expected: '切换为主子表显示模式' },
  };
  result.actionButtons.forEach(btn => {
    const tmpl = btnTestMap[btn];
    if (tmpl) {
      result.testPoints.push({
        area: '按钮', type: '操作验证', field: btn, mode: btn === '新增' ? '新增' : '修改',
        precondition: tmpl.precondition,
        steps: tmpl.steps,
        expected: tmpl.expected,
        testData: '',
      });
    } else {
      result.testPoints.push({
        area: '按钮', type: '操作验证', field: btn, mode: '其他',
        precondition: `进入【${result.name}】页面`,
        steps: [`点击【${btn}】按钮`],
        expected: '操作正常执行',
        testData: '',
      });
    }
  });

  // ==== 区域三：新增表单测试点 ====
  const createFormFields = await clickNewAndAnalyze(page);
  result.createForm = createFormFields;

  createFormFields.forEach(f => {
    if (f.required) {
      result.testPoints.push({
        area: '表单', type: '必填校验', field: f.label, mode: '新增',
        precondition: `进入【${result.name}】页面，点击【新增】`,
        steps: [`【${f.label}】留空不填写`, '其他字段填正常值', '点击【保存】按钮'],
        expected: `提示"${f.label}为必填项"`,
        testData: '',
      });
    }
    if (f.type === 'select' && f.options.length > 0) {
      f.options.forEach(opt => {
        if (!opt || ['请选择',''].includes(opt)) return;
        result.testPoints.push({
          area: '表单', type: '下拉选项', field: f.label, mode: '新增',
          precondition: `进入【${result.name}】页面，点击【新增】`,
          steps: [`【${f.label}】选择【${opt}】`, '其他字段填正常值', '点击【保存】'],
          expected: '保存成功',
          testData: opt,
        });
      });
    }
    if (f.type === 'text') {
      result.testPoints.push({
        area: '表单', type: '输入框正常值', field: f.label, mode: '新增',
        precondition: `进入【${result.name}】页面，点击【新增】`,
        steps: [`【${f.label}】输入正常测试值`, '其他字段填正常值', '点击【保存】'],
        expected: '保存成功',
        testData: '测试',
      });
      if (f.constraints && f.constraints.maxlength) {
        const maxLen = f.constraints.maxlength;
        result.testPoints.push({
          area: '表单', type: '边界值', field: f.label, mode: '新增',
          precondition: `进入【${result.name}】页面，点击【新增】`,
          steps: [`【${f.label}】输入${maxLen}个字符（边界值）`, '其他字段填正常值', '点击【保存】'],
          expected: `保存成功（自动截断或允许${maxLen}字符）`,
          testData: 'A'.repeat(Math.min(maxLen, 20)) + '...',
        });
        result.testPoints.push({
          area: '表单', type: '超长值', field: f.label, mode: '新增',
          precondition: `进入【${result.name}】页面，点击【新增】`,
          steps: [`【${f.label}】输入${maxLen + 5}个字符（超长值）`, '其他字段填正常值', '点击【保存】'],
          expected: `提示超长或自动截断至${maxLen}字符`,
          testData: 'A'.repeat(Math.min(maxLen + 5, 30)) + '...',
        });
      }
    }
    if (f.type === 'number') {
      result.testPoints.push({
        area: '表单', type: '数值零值', field: f.label, mode: '新增',
        precondition: `进入【${result.name}】页面，点击【新增】`,
        steps: [`【${f.label}】输入0`, '其他字段填正常值', '点击【保存】'],
        expected: '保存成功 或 提示请输入大于0的值',
        testData: '0',
      });
      result.testPoints.push({
        area: '表单', type: '数值负数', field: f.label, mode: '新增',
        precondition: `进入【${result.name}】页面，点击【新增】`,
        steps: [`【${f.label}】输入-1`, '其他字段填正常值', '点击【保存】'],
        expected: '提示请输入正数 或 保存成功',
        testData: '-1',
      });
    }
    if (f.type === 'date') {
      result.testPoints.push({
        area: '表单', type: '日期边界', field: f.label, mode: '新增',
        precondition: `进入【${result.name}】页面，点击【新增】`,
        steps: [`【${f.label}】选择边界日期（如2099-12-31）`, '其他字段填正常值', '点击【保存】'],
        expected: '保存成功 或 提示日期超出范围',
        testData: '2099-12-31',
      });
    }
  });

  return result;
}

async function clickNewAndAnalyze(page) {
  // Click "新增" button
  let clicked = false;
  const newBtnSelectors = [
    'button:has-text("新增")',
    '[class*="ant-btn"]:has-text("新增")',
    'a:has-text("新增")',
    'span:has-text("新增")',
    '.ant-menu-item:has-text("新增")',
  ];
  for (const sel of newBtnSelectors) {
    try {
      const btn = page.locator(sel).first();
      if (await btn.isVisible().catch(() => false)) {
        await btn.click();
        clicked = true;
        break;
      }
    } catch {}
  }
  // Fallback: try evaluating in DOM
  if (!clicked) {
    clicked = await page.evaluate(() => {
      const all = document.querySelectorAll('button, a, span, [role="button"]');
      for (const el of all) {
        if (el.textContent.trim() === '新增' && el.offsetParent !== null) {
          el.click();
          return true;
        }
      }
      // Look for button with icon + text
      for (const el of all) {
        if (el.textContent.includes('新增') && el.offsetParent !== null && (el.classList.contains('ant-btn') || el.closest('.ant-btn'))) {
          el.click();
          return true;
        }
      }
      return false;
    });
  }

  if (!clicked) {
    console.log('  [新增] 未找到新增按钮');
    return [];
  }

  // Wait for modal/page to appear
  await page.waitForTimeout(3000);

  // Check if a new tab opened (新增 might open in new tab)
  const allPages = page.context().pages();
  if (allPages.length > 1) {
    const newPage = allPages[allPages.length - 1];
    if (newPage.url() !== page.url()) {
      console.log('  [新增] 检测到新标签页');
    }
  }

  // Analyze the create form (modal or page)
  const fields = await page.evaluate(() => {
    const result = [];
    // Find create form - look in modal or content area
    const modal = document.querySelector('.ant-modal-content');
    const formArea = modal || document.querySelector('.ant-form') || document.body;

    // Get all form items
    formArea.querySelectorAll('.ant-form-item').forEach(item => {
      const labelEl = item.querySelector('.ant-form-item-label label, .ant-form-item-label');
      if (!labelEl) return;
      const label = labelEl.textContent.trim();
      if (!label) return;

      const input = item.querySelector('input, select, textarea');
      let type = 'text';
      if (input) {
        if (input.tagName === 'SELECT') type = 'select';
        else if (input.type === 'number') type = 'number';
        else if (input.type === 'date') type = 'date';
        else if (input.tagName === 'TEXTAREA') type = 'textarea';
      } else if (item.querySelector('.ant-select')) type = 'select';
      else if (item.querySelector('.ant-picker')) type = 'date';

      const required = !!item.querySelector('.ant-form-item-required');

      let options = [];
      const sel = item.querySelector('select');
      if (sel) options = Array.from(sel.options).map(o => o.text.trim()).filter(Boolean);

      let constraints = {};
      if (input) {
        if (input.maxLength > 0) constraints.maxlength = input.maxLength;
        if (input.min !== '') constraints.min = input.min;
        if (input.max !== '') constraints.max = input.max;
      }

      result.push({ label, type, required, options, constraints });
    });

    return result;
  });

  console.log(`  [新增] ${fields.length} 个表单字段`);
  fields.forEach(f => console.log(`    ${f.required ? '* ' : '  '}${f.label} (${f.type})${f.options.length ? ' ['+f.options.slice(0,5).join(',')+'...]':''}`));

  // Close modal if it was a modal
  await page.evaluate(() => {
    const closeBtn = document.querySelector('.ant-modal-close');
    if (closeBtn) closeBtn.click();
    // Click "取消" if present
    document.querySelectorAll('button').forEach(b => {
      if (b.textContent.trim() === '取消' && b.offsetParent !== null) b.click();
    });
  });
  await page.waitForTimeout(1000);

  // Handle confirmation dialog (二次确认)
  for (let i = 0; i < 5; i++) {
    const confirmBtn = await page.evaluate(() => {
      // Look for confirmation modal with 确定/确认/是 button
      const modal = document.querySelector('.ant-modal-confirm, .ant-modal');
      if (!modal) return false;
      const btns = [...modal.querySelectorAll('button')];
      const btn = btns.find(b => {
        const t = b.textContent.trim();
        return (t === '确定' || t === '确认' || t === '是') && b.offsetParent !== null;
      });
      if (btn) { btn.click(); return true; }
      // Also try clicking "确定" on any visible modal
      const confirmBtn = document.querySelector('.ant-btn-primary');
      if (confirmBtn && confirmBtn.offsetParent !== null) {
        confirmBtn.click(); return true;
      }
      return false;
    });
    if (!confirmBtn) break;
    await page.waitForTimeout(500);
  }

  return fields;
}

function getFieldTestType(type) {
  const map = {
    'text': 'normal/boundary/special',
    'number': 'normal/zero/negative/boundary',
    'select': 'each_option',
    'date': 'normal/boundary',
    'textarea': 'normal/long/special',
  };
  return map[type] || 'normal';
}

module.exports = { analyzePage };
