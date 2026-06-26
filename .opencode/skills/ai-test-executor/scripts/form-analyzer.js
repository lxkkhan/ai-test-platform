async function analyzeForm(page) {
  console.log('[form] 分析表单字段...');
  await page.waitForTimeout(500);

  return await page.evaluate(() => {
    // 1. Find form area
    let formArea = document.querySelector('form');
    if (!formArea) formArea = document.querySelector('[class*="form"]');
    if (!formArea) formArea = document.querySelector('.ant-form');
    if (!formArea) {
      // Fallback: use the main content area
      formArea = document.querySelector('.ant-layout-content') ||
                 document.querySelector('main') ||
                 document.body;
    }

    if (!formArea) return { fields: [], error: '找不到表单区域' };

    const fields = [];
    const processed = new Set();

    // Find all interactive elements
    const interactives = formArea.querySelectorAll('input, select, textarea, [role="combobox"], [role="listbox"], .ant-select, .ant-picker, .ant-checkbox, .ant-radio');

    interactives.forEach(el => {
      // Skip hidden elements
      if (el.offsetParent === null && !el.matches('.ant-select, .ant-picker')) return;
      if (processed.has(el)) return;
      processed.add(el);

      // Determine field type
      let type = 'text';
      const tag = el.tagName.toLowerCase();

      if (tag === 'select') type = 'select';
      else if (tag === 'textarea') type = 'textarea';
      else if (el.type === 'number') type = 'number';
      else if (el.type === 'date') type = 'date';
      else if (el.type === 'checkbox') type = 'checkbox';
      else if (el.type === 'radio') type = 'radio';
      else if (el.matches('.ant-select')) type = 'select';
      else if (el.matches('.ant-picker')) type = 'date';
      else if (el.matches('[role="combobox"]')) type = 'select';
      else if (el.matches('[role="listbox"]')) type = 'select';

      // Get label
      let label = '';
      const id = el.id || '';

      // Method 1: aria-label
      if (el.getAttribute('aria-label')) label = el.getAttribute('aria-label');
      // Method 2: associated label element
      else if (id && document.querySelector(`label[for="${id}"]`)) label = document.querySelector(`label[for="${id}"]`).textContent.trim();
      // Method 3: placeholder (if no other label)
      else if (el.placeholder && el.placeholder.length > 1) label = el.placeholder;
      // Method 4: preceding label/span in parent
      else {
        const parent = el.closest('.ant-form-item, [class*="form-item"], .ant-row, div');
        if (parent) {
          const labelEl = parent.querySelector('label, .ant-form-item-label, [class*="label"]');
          if (labelEl) label = labelEl.textContent.trim();
        }
      }
      // Method 5: previous sibling
      if (!label) {
        let prev = el.previousElementSibling;
        while (prev) {
          const txt = prev.textContent.trim();
          if (txt && txt.length > 0 && txt.length < 50) { label = txt; break; }
          prev = prev.previousElementSibling;
        }
      }

      // Determine if required
      let required = el.hasAttribute('required');

      // Check for asterisk in label
      if (!required && label) {
        const parent = el.closest('.ant-form-item, [class*="form-item"], div');
        if (parent) {
          const labelHtml = parent.querySelector('label, .ant-form-item-label')?.innerHTML || '';
          if (labelHtml.includes('*') || labelHtml.includes('<span class="ant-form-item-required')) required = true;
        }
      }

      // Collect select options
      let options = [];
      if (type === 'select' && tag === 'select') {
        options = Array.from(el.options).map(o => ({ value: o.value, text: o.text.trim() }));
      } else if (type === 'select' && el.matches('.ant-select')) {
        // For Ant Design Select, options are in dropdown
        // We can't get them without opening the dropdown, so mark as select with unknown options
        options = [{ value: '', text: '(Ant Design Select)' }];
      }

      // Get constraints
      const constraints = {};
      if (el.maxLength > 0) constraints.maxlength = el.maxLength;
      if (el.min !== '') constraints.min = el.min;
      if (el.max !== '') constraints.max = el.max;
      if (el.pattern) constraints.pattern = el.pattern;

      fields.push({
        id: id || el.name || '',
        tag,
        type,
        label,
        required,
        options,
        constraints,
        placeholder: el.placeholder || '',
      });
    });

    // Filter out system fields and duplicates
    const uniqueFields = [];
    const seenLabels = new Set();
    fields.forEach(f => {
      const key = f.label || f.id || f.tag;
      if (seenLabels.has(key)) return;
      if (f.label === '' && f.type === 'text' && !f.required) {
        // Skip plain hidden inputs or search inputs
        return;
      }
      seenLabels.add(key);
      uniqueFields.push(f);
    });

    return { fields: uniqueFields, fieldCount: uniqueFields.length };
  });
}

module.exports = { analyzeForm };
