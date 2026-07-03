const fs = require('fs');
const path = require('path');
const API_URL = "https://api.tapd.cn";
const ws = "62721303";

const pageData = require('./performance_pages.json');
const me = require('../playwright-mind/merge-extractions.js');

// VLM 结果缓存（从 vlm_results.json 加载）
let vlmCache = null;

function loadVLMResults() {
  if (vlmCache !== null) return vlmCache;
  var vlmPath = path.join(__dirname, 'vlm_results.json');
  if (!fs.existsSync(vlmPath)) {
    console.log('未找到 vlm_results.json，将使用纯 DOM 提取');
    vlmCache = {};
    return vlmCache;
  }
  vlmCache = JSON.parse(fs.readFileSync(vlmPath, 'utf-8'));
  console.log('加载 VLM 结果: ' + Object.keys(vlmCache).length + ' 个页面');
  return vlmCache;
}

function getPageVLMData(pageName) {
  var vlmResults = loadVLMResults();
  // 匹配方式：去掉*和_前缀、去掉（列表页）后缀
  var matchName = pageName.replace(/（(列表页|制单页|查询页)）$/, '').replace(/^[*_]+/, '');
  var keys = Object.keys(vlmResults);
  for (var i = 0; i < keys.length; i++) {
    var keyNorm = keys[i].replace(/^[*_]+/, '');
    if (keyNorm === matchName) {
      return vlmResults[keys[i]];
    }
  }
  return null;
}

function getMergedData(pageName, existingSearchFields, existingTableFields) {
  var key = pageName.replace(/（(列表页|制单页|查询页)）$/, '');
  var pd = pageData[key];
  var vlm = getPageVLMData(pageName);

  if (!pd && !vlm) {
    return { buttons: [], searchFields: existingSearchFields || [], tableColumns: existingTableFields || [] };
  }

  if (vlm) {
    var merged = me.mergeWithVLM(pd || {}, vlm, existingSearchFields);
    // 表格列：如果有 existingTableFields，用 VLM 顺序排列；没有则用 VLM 结果
    if (existingTableFields && existingTableFields.length > 0) {
      merged.tableColumns = orderTableByVLM(existingTableFields, vlm.tableColumns || []);
    }
    return merged;
  }

  // 降级：纯 DOM 提取
  return {
    buttons: me.extractButtonsFromDOM(pd),
    searchFields: existingSearchFields || [],
    tableColumns: existingTableFields || []
  };
}

function orderTableByVLM(existingFields, vlmColumns) {
  if (!vlmColumns || vlmColumns.length === 0) return existingFields;
  var ordered = [];
  var used = {};
  var vlmNorm = vlmColumns.map(function(c) { return me.normalize(c); });

  // VLM 顺序优先
  for (var i = 0; i < vlmNorm.length; i++) {
    for (var j = 0; j < existingFields.length; j++) {
      if (used[j]) continue;
      if (me.normalize(existingFields[j]) === vlmNorm[i]) {
        used[j] = 1;
        ordered.push(existingFields[j]);
        break;
      }
    }
  }
  // 追加 VLM 未识别的
  for (var k = 0; k < existingFields.length; k++) {
    if (!used[k]) ordered.push(existingFields[k]);
  }
  return ordered;
}

async function getToken() {
  const apiUser = "tapd-app-53825c";
  const apiPass = "A3BEF211-FC08-81BB-D43B-3CEC09FF0AF9";
  const basic = Buffer.from(`${apiUser}:${apiPass}`).toString('base64');
  const r = await fetch(`${API_URL}/tokens/request_token`, {
    method: 'POST', headers: { Authorization: `Basic ${basic}` },
    body: new URLSearchParams({ grant_type: 'client_credentials' })
  });
  return (await r.json()).data.access_token;
}

// Each story's correct field definitions based on actual CoDesign notes and iframe content
const STORY_FIELDS = {
  // 目标终端备案单 + 目标终端备案单详情
  '1026475': {
    name: '业绩管理-目标终端备案',
    pages: [
      {
        name: '目标终端备案单（列表页）',
        desc: '目标终端备案列表页，支持导入新增、批量修改、按条件查询筛选备案数据。',
        searchFields: [
          { name: '编号', type: '文本框（输入）' },
          { name: '状态', type: '下拉选择（正常/停用）' },
          { name: '生效年月', type: '日期选择' },
        ],
        tableFields: ['序号', '编号', '事业部', '省份', '品规', '关联品类', '开始年月', '结束年月', '状态', '备注', '审核时间', '审核人', '创建时间', '创建人'],
        notes: [
          { num: 1, name: '导入新增', note: '批量导入新增目标终端备案数据' },
          { num: 2, name: '批量修改', note: '批量修改结束年月弹窗操作' },
          { num: 3, name: '生效年月', note: '默认查询开始年月、结束年月均为当前服务器月份' },
          { num: 4, name: '修改', note: '校验是否已被引用；已被引用的终端备案，除结束年月、备注外其它字段不允许修改' },
          { num: 5, name: '批量修改结束年月', note: '点击后显示批量修改结束年月弹窗' },
          { num: 6, name: '状态', note: '正常/停用，初始化数据' },
          { num: 7, name: '单据状态', note: '初始化数据' },
          { num: 8, name: '审核状态', note: '控制审核流程' },
          { num: 9, name: '修改后的结束年月', note: '类型：DATE，长度：yyyy-mm，非必填，不能早于开始年月' },
        ]
      },
      {
        name: '目标终端备案单详情（制单页）',
        desc: '目标终端备案单详情页，新增/编辑终端备案信息，选择备案类型和品类。',
        searchFields: [
          { name: '*备案类型', type: '下拉选择（精准招商终端/其他终端备案/商业旗下终端/协同终端）' },
          { name: '*品类名称', type: '文本框（输入）' },
          { name: '编号', type: '文本框（系统自动生成）' },
          { name: '备注', type: '文本框（输入）' },
        ],
        tableFields: [],
        notes: [
          { num: 1, name: '保存', note: '校验必填项，成功保存后返回列表页或继续新增' },
          { num: 2, name: '保存并新增', note: '保存当前数据并继续新增下一条' },
          { num: 3, name: '返回列表', note: '返回目标终端备案列表页' },
          { num: 4, name: '*备案类型', note: '必填，单选；数据=精准招商终端、其他终端备案、商业旗下终端、协同终端（业绩拆分）' },
          { num: 5, name: '*品类名称', note: '必填，单选；数据=目标终端备案品类；输入内容后自动检索匹配数据' },
          { num: 6, name: '编号', note: '系统自动生成，保存后自动编号' },
          { num: 7, name: '备注', note: '类型：VARCHAR2，长度：255，非必填' },
          { num: 8, name: '状态', note: '默认启用，可选择启用/停用' },
          { num: 9, name: '创建人/创建时间', note: '系统自动记录' },
        ]
      }
    ]
  },

  '1026469': {
    name: '业绩管理-目标终端备案品类管理',
    pages: [
      {
        name: '目标终端备案品类管理（制单页）',
        desc: '目标终端备案品类管理页面，新增/编辑终端备案的品类基础信息。',
        searchFields: [
          { name: '*品类名称', type: '文本框（输入）' },
          { name: '编号', type: '文本框（系统自动生成）' },
          { name: '备注', type: '文本框（输入）' },
        ],
        tableFields: [],
        notes: [
          { num: 1, name: '保存', note: '校验必填项，保存品类数据' },
          { num: 2, name: '返回列表', note: '取消并返回列表' },
          { num: 3, name: '取消', note: '取消当前操作' },
          { num: 4, name: '编号', note: '系统自动生成，保存后自动编号，仅查看' },
          { num: 5, name: '*品类名称', note: '必填，类型：VARCHAR2，长度：100' },
          { num: 6, name: '备注', note: '非必填，类型：VARCHAR2，长度：200' },
        ]
      }
    ]
  },

  '1026472': {
    name: '业绩管理-目标终端备案物料关联',
    pages: [
      {
        name: '目标终端备案物料关联单（列表页）',
        desc: '目标终端备案物料关联列表页，管理终端与物料的关联关系。',
        searchFields: [
          { name: '编号', type: '文本框（输入）' },
          { name: '状态', type: '下拉选择（正常/停用）' },
          { name: '生效年月', type: '日期选择' },
          { name: '事业部', type: '下拉选择' },
          { name: '省份', type: '下拉选择' },
        ],
        tableFields: ['序号', '编号', '事业部', '省份', '品规', '关联品类', '开始年月', '结束年月', '备注'],
        notes: [
          { num: 1, name: '生效年月', note: '默认查询开始年月、结束年月均为当前服务器月份' },
          { num: 2, name: '批量修改结束年月', note: '点击后显示批量修改结束年月弹窗' },
          { num: 3, name: '状态', note: '正常/停用，初始化数据' },
          { num: 4, name: '单据状态', note: '初始化数据' },
          { num: 5, name: '修改后的结束年月', note: '类型：DATE，长度：yyyy-mm，非必填，不能早于开始年月' },
          { num: 6, name: '省份+品规+年月+品类', note: '省份+品规只能对应一个品类' },
        ]
      },
      {
        name: '目标终端备案物料关联单详情（制单页）',
        desc: '物料关联单详情页，新增/编辑物料关联信息。',
        searchFields: [
          { name: '*来源', type: '下拉选择（系统生成/手工）' },
          { name: '*单据分类', type: '文本框（仅查看）' },
          { name: '单据类型', type: '文本框（仅查看）' },
          { name: '上游单据', type: '文本框（仅查看）' },
          { name: '*制单部门', type: '下拉选择' },
          { name: '*单据日期', type: '日期选择' },
          { name: '*事业部', type: '下拉选择（必填）' },
          { name: '*省份', type: '下拉选择（必填）' },
          { name: '*品规', type: '下拉选择（必填）' },
          { name: '物料编码', type: '文本框（仅查看，选择品规后自动带出）' },
          { name: '物料类别', type: '文本框（仅查看）' },
          { name: '产品系列', type: '文本框（仅查看）' },
          { name: '规格', type: '文本框（仅查看）' },
          { name: '单位名称', type: '文本框（仅查看）' },
          { name: 'NC编码', type: '文本框（仅查看）' },
          { name: 'NCPK', type: '文本框（仅查看）' },
          { name: '*关联品类', type: '下拉选择（必填）' },
          { name: '*开始年月', type: '日期选择（必填）' },
          { name: '结束年月', type: '日期选择' },
          { name: '备注', type: '文本框（输入）' },
        ],
        tableFields: [],
        notes: [
          { num: 1, name: '保存', note: '校验省份+品规+品类唯一性，唯一可保存' },
          { num: 2, name: '复制', note: '复制需校验唯一性' },
          { num: 3, name: '修改', note: '已被引用的关联单，除结束年月和备注外不允许修改' },
          { num: 4, name: '删除', note: '弹窗确认，校验是否被引用' },
          { num: 5, name: '*单据编号', note: 'VARCHAR2(100)，保存后自动生成' },
          { num: 6, name: '*来源', note: '仅查看，系统生成/手工' },
          { num: 7, name: '*单据分类', note: '仅查看，默认=业务确认单' },
          { num: 8, name: '单据类型', note: '仅查看，数据=业绩确认单' },
          { num: 9, name: '上游单据', note: '仅查看，系统生成时存在' },
          { num: 10, name: '*制单部门', note: 'VARCHAR2(100)，默认当前用户办事处' },
          { num: 11, name: '*单据日期', note: 'DATE，默认服务器日期' },
          { num: 12, name: '*事业部', note: 'VARCHAR2(100)，必填，数据=组织架构' },
          { num: 13, name: '*省份', note: 'VARCHAR2(100)，必填，数据=行政区域' },
          { num: 14, name: '*品规', note: 'VARCHAR2(200)，必填，数据=物料管理' },
          { num: 15, name: '物料编码', note: 'VARCHAR2(100)，仅查看，选择品规后自动带出' },
          { num: 22, name: '*关联品类', note: 'VARCHAR2(100)，必填，数据=目标终端备案品类' },
          { num: 23, name: '*开始年月', note: 'DATE，必填' },
          { num: 24, name: '结束年月', note: 'DATE，非必填，留空默认当年12月' },
          { num: 25, name: '备注', note: 'VARCHAR2(255)，非必填' },
        ]
      }
    ]
  },

  '1026478': {
    name: '业绩管理-业绩政策',
    pages: [
      {
        name: '*业绩政策单（列表页）',
        desc: '业绩政策列表页，管理业绩政策数据，支持导入新增、批量修改、条件查询。',
        searchFields: [
          { name: '编号', type: '文本框（输入）' },
          { name: '事业部', type: '下拉选择' },
          { name: '状态', type: '下拉选择（正常/终止）' },
          { name: '生效年月', type: '日期选择' },
          { name: '单据状态', type: '下拉选择' },
        ],
        tableFields: ['序号', '单据编号', '制单日期', '制单部门', '状态', '单据状态', '流水号', '开始年月', '结束年月', '事业部', '管理部门', '省区', '办事处', '省份', '业务分线', '计算方法', '客户名称', '品类/品规', '政策类型', '底价', '计算金额类型', '政策层级', '备注'],
        notes: [
          { num: 1, name: '生效年月', note: '默认查询开始年月、结束年月均为当前服务器月份' },
          { num: 2, name: '修改', note: '已被业绩确认单引用的政策，除结束年月、备注外不允许修改' },
          { num: 3, name: '批量修改结束年月', note: '点击后显示批量修改结束年月弹窗' },
          { num: 4, name: '业务分线', note: '导出模板字段' },
          { num: 5, name: '状态', note: '正常/终止，初始化数据' },
          { num: 6, name: '单据状态', note: '初始化数据' },
          { num: 7, name: '修改后的结束年月', note: 'DATE，非必填，不能早于开始年月' },
          { num: 8, name: '唯一性校验', note: '事业部+管理部门+省份等维度唯一性校验' },
        ]
      },
      {
        name: '*业绩政策单详情（制单页）',
        desc: '业绩政策单详情页，新增/编辑业绩政策，配置政策类型、计算方法等。',
        searchFields: [
          { name: '*来源', type: '下拉选择（仅查看）' },
          { name: '*单据分类', type: '文本框（仅查看）' },
          { name: '单据类型', type: '文本框（仅查看）' },
          { name: '上游单据', type: '文本框（仅查看）' },
          { name: '*制单部门', type: '下拉选择' },
          { name: '*单据日期', type: '日期选择' },
          { name: '流水号', type: '文本框（输入）' },
          { name: '*开始年月', type: '日期选择（必填）' },
          { name: '结束年月', type: '日期选择' },
          { name: '*事业部', type: '下拉选择（必填）' },
          { name: '*管理部门', type: '下拉选择（必填）' },
          { name: '省区', type: '下拉选择' },
          { name: '办事处', type: '下拉选择（必填）' },
          { name: '*省份', type: '下拉选择（必填）' },
          { name: '*计算方法', type: '下拉选择（必填，84条数据）' },
          { name: '商业客户', type: '下拉选择（必填）' },
          { name: '购入客户属性', type: '文本框（仅查看，自动带出）' },
          { name: '*品种', type: '下拉选择（必填）' },
          { name: '*政策类型', type: '下拉选择（必填，特殊政策/基础政策）' },
          { name: '底价', type: '数字输入' },
          { name: '*计算金额类型', type: '下拉选择（必填）' },
          { name: '*政策层级', type: '下拉选择（必填）' },
          { name: '适用岗位(67部)', type: '下拉选择' },
          { name: '六部经理', type: '下拉选择' },
          { name: '固定业绩单价', type: '数字输入' },
          { name: '备注', type: '文本框（输入）' },
        ],
        tableFields: [],
        notes: [
          { num: 1, name: '保存', note: '校验事业部+管理部门+省区+办事处+年月+品种+客户+政策层级唯一性' },
          { num: 5, name: '*单据编号', note: 'VARCHAR2(100)，保存后自动生成' },
          { num: 13, name: '*开始年月', note: 'DATE(yyyy-mm)，必填' },
          { num: 14, name: '结束年月', note: 'DATE，非必填，留空默认为开始年月的12月' },
          { num: 15, name: '*事业部', note: 'VARCHAR2(100)，必填，数据=组织结构' },
          { num: 16, name: '*管理部门', note: 'VARCHAR2(100)，必填，数据=组织结构' },
          { num: 19, name: '*省份', note: 'VARCHAR2(100)，必填，数据=行政区域' },
          { num: 20, name: '*计算方法', note: '必填，数据=字典calculationMethod，84条' },
          { num: 23, name: '*品种', note: 'VARCHAR2(200)，必填，数据=目标终端备案物料关联+物料管理' },
          { num: 24, name: '*政策类型', note: 'VARCHAR2(100)，必填，数据=字典-政策类型' },
          { num: 26, name: '*计算金额类型', note: '必填，数据=字典measureType' },
          { num: 27, name: '*政策层级', note: '必填，数据=字典policyLevel' },
          { num: 30, name: '固定业绩单价', note: 'NUMBER，当计算方法=5或6时必填' },
        ]
      }
    ]
  },

  '1026481': {
    name: '业绩管理-业绩确认单',
    pages: [
      {
        name: '*业绩确认单（列表页）',
        desc: '业绩确认列表页，管理业绩确认数据，支持查询筛选、审核流程管理、生成业绩。',
        searchFields: [
          { name: '单据编号', type: '文本框（输入）' },
          { name: '统计年月', type: '日期选择' },
          { name: '事业部', type: '下拉选择' },
          { name: '管理部门', type: '下拉选择' },
          { name: '单据状态', type: '下拉选择（自由/审核中/审核通过/审核不通过）' },
        ],
        tableFields: ['序号', '单据编号', '制单日期', '制单部门', '状态', '单据状态', '业绩生成状态', '业绩最后生成时间', '统计年月', '事业部', '管理部门', '政策层级', '调整金额', '备注'],
        notes: [
          { num: 1, name: '统计年月', note: '默认查询开始年月、结束年月均为当前服务器月份' },
          { num: 2, name: '修改', note: '业绩生成中不允许修改；修改保存后需重新生成业绩' },
          { num: 3, name: '生成业绩', note: '生成业绩明细到业绩明细表；已锁定状态不允许操作' },
          { num: 4, name: '锁定业绩', note: '业绩已生成后可操作锁定，锁定后不可操作生成业绩' },
          { num: 5, name: '状态', note: '初始化数据' },
          { num: 6, name: '单据状态', note: '自由/审核中/审核通过/审核不通过' },
          { num: 7, name: '业绩生成状态', note: '未生成/生成中/已生成' },
        ]
      },
      {
        name: '*业绩确认单详情（制单页）',
        desc: '业绩确认单详情页，新增/编辑业绩确认单，配置业绩参数。',
        searchFields: [
          { name: '*来源', type: '下拉选择（仅查看，系统生成/手工）' },
          { name: '*单据分类', type: '文本框（仅查看）' },
          { name: '单据类型', type: '文本框（仅查看，业绩确认单）' },
          { name: '上游单据', type: '文本框（仅查看）' },
          { name: '*制单部门', type: '下拉选择' },
          { name: '*单据日期', type: '日期选择' },
          { name: '*统计年月', type: '日期选择（必填）' },
          { name: '*事业部', type: '下拉选择（必填）' },
          { name: '*管理部门', type: '下拉选择（必填）' },
          { name: '省区', type: '下拉选择' },
          { name: '*省份', type: '下拉选择（必填）' },
          { name: '*政策层级', type: '下拉选择（必填）' },
          { name: '*计算金融类型', type: '下拉选择（必填）' },
          { name: '调整金额', type: '文本框（仅查看）' },
          { name: '备注', type: '文本框（输入）' },
        ],
        tableFields: [],
        notes: [
          { num: 1, name: '保存', note: '校验统计年月+事业部+管理部门+省份唯一性' },
          { num: 2, name: '复制', note: '复制需校验唯一性' },
          { num: 5, name: '生成业绩', note: '异步生成，生成后体现在业绩明细表' },
          { num: 6, name: '锁定业绩', note: '业绩已生成后可操作锁定' },
          { num: 14, name: '*统计年月', note: 'DATE(yyyy-mm)，默认服务器年月，仅2023年起' },
          { num: 15, name: '*事业部', note: 'VARCHAR2(100)，必填' },
          { num: 16, name: '*管理部门', note: 'VARCHAR2(100)，大产品必填' },
          { num: 18, name: '*省份', note: 'VARCHAR2(100)，必填' },
          { num: 19, name: '*政策层级', note: 'VARCHAR2(100)，必填' },
          { num: 20, name: '*计算金融类型', note: 'VARCHAR2(100)，必填' },
          { num: 21, name: '调整金额', note: 'VARCHAR2(100)，仅查看' },
          { num: 25, name: '备注', note: 'VARCHAR2(255)，非必填' },
        ]
      }
    ]
  },

  '1026484': {
    name: '业绩管理-业绩调整单',
    pages: [
      {
        name: '业绩调整单（列表页）',
        desc: '业绩调整列表页，管理业绩调整数据，支持查询筛选和审核流程。',
        searchFields: [
          { name: '单据编号', type: '文本框（输入）' },
          { name: '统计年月', type: '日期选择' },
          { name: '事业部', type: '下拉选择' },
          { name: '管理部门', type: '下拉选择' },
          { name: '单据状态', type: '下拉选择（自由/审核中/审核通过/审核不通过）' },
        ],
        tableFields: ['序号', '单据编号', '制单日期', '制单部门', '状态', '单据状态', '统计年月', '流水号', '事业部', '管理部门', '省区', '省份', '备注'],
        notes: [
          { num: 1, name: '统计年月', note: '默认查询开始年月、结束年月均为当前服务器月份' },
          { num: 2, name: '重置单据', note: '审核通过→自由状态，任何人可操作' },
          { num: 3, name: '状态', note: '初始化数据' },
          { num: 4, name: '单据状态', note: '自由/审核中/审核通过/审核不通过' },
        ]
      },
      {
        name: '*业绩调整详情（制单页）',
        desc: '业绩调整详情页，新增/编辑业绩调整单，填写调整明细数据。',
        searchFields: [
          { name: '*来源', type: '下拉选择（仅查看，系统生成/手工）' },
          { name: '*单据分类', type: '文本框（仅查看）' },
          { name: '单据类型', type: '文本框（仅查看）' },
          { name: '上游单据', type: '文本框（仅查看）' },
          { name: '*制单部门', type: '下拉选择' },
          { name: '*单据日期', type: '日期选择' },
          { name: '*统计年月', type: '日期选择（必填）' },
          { name: '流水号', type: '文本框（输入）' },
          { name: '*事业部', type: '下拉选择（必填）' },
          { name: '*管理部门', type: '下拉选择（必填）' },
          { name: '省区', type: '下拉选择' },
          { name: '*省份', type: '下拉选择（必填）' },
          { name: '备注', type: '文本框（输入）' },
        ],
        tableFields: ['流向年月', '办事处', '*品种', '*计算金额类型', '*政策层级', '购入客户名称', '购入客户名称（清洗后）', '购入客户名称（导入）', '销售客户名称', '商业名称（DDI）', '关联购入客户', '经理/责任人', '主管', '专员', '省平均发货价', '发票含税单价', '发货含税单价', '发货最低销售价', '*调整数量', '*调整金额', '*调整业绩对应发货金额', '调整总监数量/金额', '调整副总监数量/金额', '调整经理数量/金额', '调整主管数量/金额', '调整专员数量/金额', '业绩来源', '*调整类型', '批次号'],
        notes: [
          { num: 1, name: '保存', note: '校验统计年月+事业部+管理部门+省份唯一性' },
          { num: 2, name: '提交', note: '判断业绩是否已生成' },
          { num: 3, name: '重置单据', note: '审核通过→自由' },
          { num: 4, name: '*单据编号', note: '系统自动生成，仅查看' },
          { num: 11, name: '*统计年月', note: 'DATE(yyyy-mm)，必填' },
          { num: 13, name: '*事业部', note: 'VARCHAR2(100)，必填' },
          { num: 14, name: '*管理部门', note: 'VARCHAR2(100)，必填' },
          { num: 16, name: '*省份', note: 'VARCHAR2(100)，必填' },
          { num: 20, name: '*品种', note: 'VARCHAR2(500)，必填' },
          { num: 21, name: '*计算金额类型', note: '必填，数据=字典' },
          { num: 22, name: '*政策层级', note: '必填，数据=字典' },
          { num: 36, name: '*调整数量', note: 'NUMBER，必填' },
          { num: 37, name: '*调整金额', note: 'NUMBER，必填，支持两位小数' },
          { num: 50, name: '*调整类型', note: 'VARCHAR2(100)，必填，数据=字典' },
        ]
      }
    ]
  },

  '1026490': {
    name: '业绩管理-业绩汇总',
    pages: [
      {
        name: '业绩汇总（查询页）',
        desc: '业绩汇总查询页，按多维度汇总展示业绩数据，支持筛选和导出。',
        searchFields: [
          { name: '统计年月', type: '日期选择（开始/结束）' },
          { name: '汇总维度', type: '下拉选择（按事业部品规汇总/按管理部门品规汇总/按省份品规汇总/按省区品规汇总/按省区省份品规汇总/按办事处品规汇总/事业部省份品规属性维度）' },
          { name: '省份', type: '下拉选择' },
          { name: '事业部', type: '下拉选择' },
          { name: '管理部门', type: '下拉选择' },
        ],
        tableFields: ['序号', '统计年份', '统计年月', '事业部', '管理部门', '省区', '省份', '办事处', '政策层级', '业绩来源', '调整类型', '终端属性', '品规', '产品（合并）', '生产企业', '业绩数量', '省业绩金额', '总监业绩数量', '总监业绩金额', '业绩对应发货金额', '业绩备注', '供货金额'],
        notes: [
          { num: 1, name: '汇总维度', note: '默认选中第一个维度（按事业部品规汇总）' },
          { num: 2, name: '统计年月', note: '默认开始年月、结束年月均为当前服务器月份' },
          { num: 3, name: '全部导出（全字段）', note: '默认全部导出，导出字段为列表全部字段' },
        ]
      }
    ]
  },

  '1026487': {
    name: '业绩管理-业绩明细表',
    pages: [
      {
        name: '业绩明细表（查询页）',
        desc: '业绩明细查询页，展示详细的业绩数据，支持多维度筛选。',
        searchFields: [
          { name: '统计年月', type: '日期选择（开始/结束）' },
          { name: '事业部', type: '下拉选择' },
          { name: '管理部门', type: '下拉选择' },
          { name: '省份', type: '下拉选择' },
          { name: '政策层级', type: '下拉选择' },
          { name: '业绩来源', type: '下拉选择（发货/回款/流向/调整）' },
          { name: '业绩确认情况', type: '下拉选择（不限制/已审核/未审核）' },
          { name: '审批状态', type: '下拉选择（不限制/已审批/未审批）' },
          { name: '办事处', type: '下拉选择' },
          { name: '省区', type: '下拉选择' },
        ],
        tableFields: ['序号', '单据编号(业绩确认单编号)', '统计年月', '事业部编号/名称', '管理部门编号/名称', '省份编号/名称', '业绩来源', '调整类型', '省区', '办事处', '商业客户', '商业省份', '商业区域', '品规', '销售年月', '购入客户', '批次号', '备案类型'],
        notes: [
          { num: 1, name: '统计年月', note: '默认开始年月、结束年月均为当前服务器月份' },
          { num: 2, name: '业绩确认情况', note: '已审核=审核通过，未审核=自由/审核中' },
          { num: 3, name: '全部导出（全字段）', note: '默认全部导出' },
          { num: 4, name: '单据编号', note: '更名为业绩确认单编号' },
          { num: 5, name: '省份名称', note: '新药/大健康从发货明细计算，回写发货省份' },
          { num: 34, name: '商业备案类型', note: '业绩来源=流向时取值' },
          { num: 35, name: '商业属性', note: '业绩来源=流向时取值' },
        ]
      }
    ]
  },

  '1026493': {
    name: '业绩管理-终端业绩汇总表（职能部门）',
    pages: [
      {
        name: '终端业绩汇总表（职能部门查）（查询页）',
        desc: '终端业绩汇总表（职能部门查询用），按终端维度汇总业绩数据。',
        searchFields: [
          { name: '统计年月', type: '日期选择（开始/结束）' },
          { name: '省区', type: '下拉选择' },
          { name: '事业部', type: '下拉选择' },
          { name: '管理部门', type: '下拉选择' },
          { name: '省份', type: '下拉选择' },
        ],
        tableFields: ['序号', '统计年月', '销售年月', '事业部', '管理部门', '省区', '省份', '办事处', '业绩来源', '商业客户', '商业属性', '购入客户', '品规', '生产企业', '数量', '金额', '业绩对应发货金额', '政策层级', '审批状态', '备案类型'],
        notes: [
          { num: 1, name: '统计年月', note: '默认开始年月、结束年月均为当前服务器月份' },
          { num: 3, name: '审核状态', note: '业绩确认单状态，已审核/未审核' },
          { num: 4, name: '全部导出（全字段）', note: '默认全部导出，导出字段为列表全部字段' },
        ]
      }
    ]
  }
};

function buildHtml(storyId, config) {
  let html = `<hr/><h3 data-design-analyze="true">设计稿分析报告 — ${config.name}</h3>
<p><strong>来源平台</strong>：CoDesign（axure 原型）</p>
<p><strong>设计链接</strong>：<a href="https://codesign.qq.com/s/692086714431365">https://codesign.qq.com/s/692086714431365</a></p>
<p><strong>对应页面数</strong>：${config.pages.length} 个</p>`;

  config.pages.forEach((p, pi) => {
    html += `\n<hr style="border:1px dashed #ccc"/>
<h4>页面${pi + 1}：${p.name}</h4>
<p><strong>功能概述</strong>：${p.desc}</p>`;

    // Merge DOM + VLM data
    var merged = getMergedData(p.name, p.searchFields || [], p.tableFields || []);

    // Search/form fields (VLM 顺序优先，DOM 属性补充)
    if (merged.searchFields && merged.searchFields.length > 0) {
      html += `\n<h5>表单/搜索字段</h5>
<table border="1" cellpadding="4" cellspacing="0" style="border-collapse:collapse;width:100%;font-size:12px;margin-bottom:8px">
  <tr style="background:#f0f0f0"><th>序号</th><th>字段名</th><th>控件类型</th></tr>`;
      merged.searchFields.forEach((f, i) => {
        html += `  <tr><td>${i + 1}</td><td>${f.name}</td><td>${f.type}</td></tr>`;
      });
      html += `</table>`;
    }

    // Buttons (VLM 顺序优先，DOM 白名单补充)
    if (merged.buttons && merged.buttons.length > 0) {
      html += `\n<h5>操作按钮</h5><p>${merged.buttons.join('、')}</p>`;
    }

    // Table fields (VLM 顺序优先)
    if (merged.tableColumns && merged.tableColumns.length > 0) {
      html += `\n<h5>列表/表格列字段</h5>
<table border="1" cellpadding="4" cellspacing="0" style="border-collapse:collapse;width:100%;font-size:12px;margin-bottom:8px">
  <tr style="background:#f0f0f0"><th>序号</th><th>字段名</th></tr>`;
      merged.tableColumns.forEach((f, i) => {
        html += `  <tr><td>${i + 1}</td><td>${f}</td></tr>`;
      });
      html += `</table>`;
    }

    // Notes
    if (p.notes && p.notes.length > 0) {
      html += `\n<h5>设计稿备注说明</h5>
<table border="1" cellpadding="4" cellspacing="0" style="border-collapse:collapse;width:100%;font-size:12px;margin-bottom:8px">
  <tr style="background:#f0f0f0"><th>序号</th><th>控件</th><th>备注说明</th></tr>`;
      p.notes.forEach(n => {
        html += `  <tr><td>${n.num}</td><td>${n.name}</td><td>${n.note}</td></tr>`;
      });
      html += `</table>`;
    }
  });

  html += `\n<p style="color:#888;font-size:12px;margin-top:12px">分析时间：2026-06-26 | 工具：design-analyze Skill</p>`;
  return html;
}

async function updateStory(storyId, html) {
  const token = await getToken();
  const fullId = `116272130300${storyId}`;
  
  const r = await fetch(`${API_URL}/stories?workspace_id=${ws}&id=${fullId}&fields=description`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const d = await r.json();
  let desc = (d.data?.[0]?.Story?.description) || '';

  // 清除旧的分析报告，但保留测试要点
  // 测试要点在"设计稿分析报告"之后追加，需要单独保留
  var tpIdx = desc.indexOf('测试要点（高级测试工程师）');
  var tpHtml = '';
  if (tpIdx >= 0) {
    // 提取测试要点表格 HTML（从 <h5>测试要点 到 </table>）
    var tpMatch = desc.match(/<h5>测试要点[\s\S]*?<\/table>/);
    if (tpMatch) tpHtml = tpMatch[0];
  }

  // 清除所有旧的分析报告（可能有多份）
  while (true) {
    var idx = desc.indexOf('设计稿分析报告');
    if (idx < 0) break;
    var prevHr = desc.lastIndexOf('<hr/>', idx);
    if (prevHr >= 0) {
      desc = desc.substring(0, prevHr);
    } else {
      var pEnd = desc.lastIndexOf('</p>', idx);
      if (pEnd >= 0) desc = desc.substring(0, pEnd + 4);
      else desc = desc.substring(0, idx);
    }
  }

  // 追加新报告 + 保留的测试要点
  var finalDesc = desc + html;
  if (tpHtml) {
    finalDesc += '\n' + tpHtml;
  }

  const body = new URLSearchParams({ workspace_id: ws, description: finalDesc });
  const ur = await fetch(`${API_URL}/stories/${fullId}`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}` }, body
  });
  const ud = await ur.json();
  return ud.status === 1;
}

async function main() {
  // 支持命令行参数过滤（只更新指定需求）
  var filter = process.argv[2];
  var allStoryIds = ['1026475', '1026469', '1026472', '1026478', '1026481', '1026484', '1026490', '1026487', '1026493'];
  var storyIds = filter ? allStoryIds.filter(function(sid) { return sid === filter || sid.indexOf(filter) >= 0; }) : allStoryIds;

  for (const sid of storyIds) {
    const config = STORY_FIELDS[sid];
    if (!config) { console.log(`  ${sid} - no config`); continue; }
    
    console.log(`\n===== ${config.name} (${sid}) =====`);
    const html = buildHtml(sid, config);
    const ok = await updateStory(sid, html);
    console.log(`  ${ok ? '✅' : '❌'} 更新成功`);
  }
  console.log('\n全部完成');
}

main().catch(console.error);
