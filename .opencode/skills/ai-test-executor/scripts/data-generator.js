function generateTestCases(fields, action) {
  console.log('[gen] 生成测试用例...');
  const cases = [];

  // #1: All fields normal
  cases.push({
    id: 'TC_ALL_NORMAL',
    name: `全字段正常${action === '新增' ? '新增' : '修改'}保存`,
    description: `所有字段填正常值，执行${action}操作`,
    fields: {},
    expected: '保存成功',
  });

  // Required field validation
  fields.filter(f => f.required).forEach(f => {
    const vals = {};
    fields.forEach(ff => { vals[ff.label || ff.id] = getNormalValue(ff); });
    vals[f.label || f.id] = '';
    cases.push({
      id: `TC_REQ_${f.label}`,
      name: `必填校验-${f.label}（留空）`,
      description: `${f.label}字段留空，其他字段正常填写，验证必填提示`,
      fields: vals,
      expected: '提示必填',
    });
  });

  // Select fields - each option
  fields.filter(f => f.type === 'select' && f.options.length > 0).forEach(f => {
    f.options.forEach(opt => {
      if (!opt.value && opt.value !== '0') return; // skip placeholder option
      const vals = {};
      fields.forEach(ff => { vals[ff.label || ff.id] = getNormalValue(ff); });
      vals[f.label || f.id] = opt.value;
      cases.push({
        id: `TC_SEL_${f.label}_${opt.value}`,
        name: `下拉框-${f.label}=${opt.text}`,
        description: `选择${f.label}=${opt.text}，其他默认值，保存`,
        fields: vals,
        expected: '保存成功',
      });
    });
  });

  // Text fields - boundary values
  fields.filter(f => f.type === 'text' && !f.options.length).forEach(f => {
    if (f.constraints.maxlength) {
      const maxLen = f.constraints.maxlength;
      const vals = {}; fields.forEach(ff => { vals[ff.label || ff.id] = getNormalValue(ff); });
      vals[f.label || f.id] = 'A'.repeat(maxLen - 1);
      cases.push({ id: `TC_BOUNDARY_${f.label}`, name: `边界值-${f.label}(${maxLen})`, description: `${f.label}输入${maxLen}个字符`, fields: vals, expected: '保存成功' });

      const vals2 = {}; fields.forEach(ff => { vals2[ff.label || ff.id] = getNormalValue(ff); });
      vals2[f.label || f.id] = 'A'.repeat(maxLen + 5);
      cases.push({ id: `TC_OVER_${f.label}`, name: `超长值-${f.label}(${maxLen}+5)`, description: `${f.label}输入${maxLen+5}个字符`, fields: vals2, expected: '截断或提示超长' });
    }

    const vals3 = {}; fields.forEach(ff => { vals3[ff.label || ff.id] = getNormalValue(ff); });
    vals3[f.label || f.id] = '@#$%^&*()<script>alert(1)</script>';
    cases.push({
      id: `TC_SPECIAL_${f.label}`,
      name: `特殊字符-${f.label}`,
      description: `${f.label}输入特殊字符<script>`,
      fields: vals3,
      expected: '正确转义或提示，不报错',
    });
  });

  // Number fields
  fields.filter(f => f.type === 'number').forEach(f => {
    const vals0 = {}; fields.forEach(ff => { vals0[ff.label || ff.id] = getNormalValue(ff); });
    vals0[f.label || f.id] = 0;
    cases.push({ id: `TC_ZERO_${f.label}`, name: `数值零-${f.label}`, description: `${f.label}输入0`, fields: vals0, expected: '保存成功或提示最小值' });

    const valsNeg = {}; fields.forEach(ff => { valsNeg[ff.label || ff.id] = getNormalValue(ff); });
    valsNeg[f.label || f.id] = -1;
    cases.push({ id: `TC_NEG_${f.label}`, name: `负数-${f.label}`, description: `${f.label}输入-1`, fields: valsNeg, expected: '提示请输入正数或保存成功' });
  });

  // Date fields
  fields.filter(f => f.type === 'date').forEach(f => {
    const vals = {}; fields.forEach(ff => { vals[ff.label || ff.id] = getNormalValue(ff); });
    vals[f.label || f.id] = '2099-12-31';
    cases.push({ id: `TC_DATE_BOUNDARY_${f.label}`, name: `边界日期-${f.label}`, description: `${f.label}输入2099-12-31`, fields: vals, expected: '保存成功或提示日期超范围' });
  });

  console.log(`[gen] 生成 ${cases.length} 条测试用例`);
  return cases;
}

function getNormalValue(field) {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');

  switch (field.type) {
    case 'text':
      return field.label || '测试';
    case 'number':
      return field.constraints.min ? Number(field.constraints.min) + 1 : 1;
    case 'date':
      return `${y}-${m}-${d}`;
    case 'select':
      if (field.options.length > 0) {
        const firstReal = field.options.find(o => o.value && o.value !== '0');
        return firstReal ? firstReal.value : '';
      }
      return '';
    case 'textarea':
      return '测试内容';
    case 'checkbox':
      return true;
    default:
      return '测试';
  }
}

module.exports = { generateTestCases, getNormalValue };
