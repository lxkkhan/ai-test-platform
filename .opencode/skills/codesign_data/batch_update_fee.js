/**
 * 批量更新费用计提剩余 7 个 TAPD 需求
 */
var b = Buffer.from("tapd-app-53825c:A3BEF211-FC08-81BB-D43B-3CEC09FF0AF9").toString("base64");
var API_URL = "https://api.tapd.cn";
var ws = "62721303";
var CODESIGN_URL = "https://codesign.qq.com/app/prototype/694237278641224/detail";

var STORIES = [
  {
    id: "1162721303001027189", name: "费用计提-费用计算",
    page: "费用计算（查询页）", desc: "费用计算查询页面，按多维度筛选查看费用计算结果。",
    fields: [
      { name: '*统计年月', type: '日期选择（必填）' },
      { name: '事业部', type: '下拉选择' },
      { name: '*管理部门', type: '下拉选择（必填）' },
      { name: '省区', type: '下拉选择' },
      { name: '省份', type: '下拉选择' },
    ],
    buttons: ['查询', '重置', '高级查询', '全部导出'],
    tps: [
      { n: "统计年月必填校验", t: "字段校验-必填", c: "统计年月为空时点击查询提示请选择统计年月" },
      { n: "多条件组合查询", t: "查询逻辑", c: "输入统计年月+事业部+管理部门+省区+省份多个条件，点击查询，结果仅包含同时满足所有条件的数据" },
      { n: "无结果查询", t: "查询逻辑", c: "输入不存在的时间段+部门条件，点击查询，列表显示共0条" },
      { n: "重置查询条件", t: "查询逻辑", c: "已输入查询条件后点击重置，所有查询条件清空，列表恢复默认展示" },
      { n: "全部导出", t: "操作按钮", c: "点击全部导出，导出数据包含列表全部字段，文件命名含模块名和时间戳" },
      { n: "明细表-费用计算明细", t: "流程集成", c: "查询结果按管理部门+品规维度汇总展示费用计算数据" },
    ]
  },
  {
    id: "1162721303001027192", name: "费用计提-费用确认",
    page: "费用确认（制单页）", desc: "费用确认页面，对费用计算结果进行确认和审核。",
    fields: [
      { name: '*制单日期', type: '日期选择（必填，默认当天）' },
      { name: '*单据编号', type: '文本框（系统自动生成）' },
      { name: '*制单部门', type: '参照选择（必填）' },
      { name: '*事业部', type: '参照选择（必填）' },
      { name: '*管理部门', type: '参照选择（必填）' },
      { name: '*统计年月', type: '日期选择（必填）' },
      { name: '确认金额', type: '数字输入' },
      { name: '备注', type: '文本框' },
    ],
    buttons: ['新建', '编辑', '取消编辑', '保存', '删除', '提交', '撤回提交', '刷新'],
    tps: [
      { n: "必填字段校验", t: "字段校验-必填", c: "*制单日期、*单据编号、*制单部门、*事业部、*管理部门、*统计年月6个必填字段任一为空时保存失败" },
      { n: "单据编号自动生成", t: "字段校验-格式", c: "单据编号保存后系统自动生成，不可手动编辑" },
      { n: "参照选择字段", t: "字段校验-参照选择", c: "制单部门、事业部、管理部门点击后弹出对应参照弹窗，选择后自动带入选中值" },
      { n: "费用确认金额校验", t: "字段校验-数值精度", c: "确认金额为数值类型，支持小数输入" },
      { n: "确认后状态流转", t: "状态流转", c: "保存后状态为草稿；提交后进入审核流程；审核通过后才确认" },
      { n: "提交后不可修改", t: "业务规则", c: "已提交的费用确认单不可编辑，需撤回提交后方可修改" },
    ]
  },
  {
    id: "1162721303001027195", name: "费用计提-费用调整单",
    page: "费用调整单（制单页）", desc: "费用调整单页面，对已确认的费用进行调整操作。",
    fields: [
      { name: '*制单日期', type: '日期选择（必填，默认当天）' },
      { name: '*单据编号', type: '文本框（系统自动生成）' },
      { name: '*制单部门', type: '参照选择（必填）' },
      { name: '*事业部', type: '参照选择（必填）' },
      { name: '*管理部门', type: '参照选择（必填）' },
      { name: '*调整金额', type: '数字输入（必填）' },
      { name: '调整原因', type: '文本框（输入）' },
      { name: '备注', type: '文本框' },
    ],
    buttons: ['新建', '编辑', '取消编辑', '保存', '删除', '提交', '撤回提交', '刷新'],
    tps: [
      { n: "必填字段校验", t: "字段校验-必填", c: "*制单日期、*单据编号、*制单部门、*事业部、*管理部门、*调整金额6个必填字段任一为空时保存失败" },
      { n: "调整金额数值校验", t: "字段校验-数值精度", c: "调整金额为数值类型，支持两位小数；输入负数表示调减" },
      { n: "参照选择字段", t: "字段校验-参照选择", c: "制单部门、事业部、管理部门点击后弹出对应参照弹窗" },
      { n: "调整原因必填逻辑", t: "业务规则", c: "调整金额不为0时，调整原因必填" },
      { n: "调整单状态流转", t: "状态流转", c: "保存后状态为草稿；提交后进入审核流程；审核通过后调整生效" },
      { n: "调整金额与原确认金额关联", t: "业务规则", c: "调整单必须关联已确认的费用确认单；调整后费用数据同步更新" },
    ]
  },
  {
    id: "1162721303001027198", name: "费用计提-财务管控匹配关系",
    page: "财务管控匹配关系（制单页）", desc: "财务管控匹配关系页面，配置费用管控与财务科目的匹配规则。",
    fields: [
      { name: '*管控类型', type: '下拉选择（必填）' },
      { name: '*财务科目', type: '参照选择（必填）' },
      { name: '*匹配规则', type: '文本框（必填）' },
      { name: '优先级', type: '数字输入' },
      { name: '备注', type: '文本框' },
    ],
    buttons: ['新建', '编辑', '取消编辑', '保存', '删除', '提交', '撤回提交', '刷新'],
    tps: [
      { n: "必填字段校验", t: "字段校验-必填", c: "*管控类型、*财务科目、*匹配规则3个必填字段任一为空时保存失败" },
      { n: "管控类型下拉选项", t: "字段校验-枚举", c: "管控类型为下拉选择，数据来源为系统公共参数" },
      { n: "财务科目参照选择", t: "字段校验-参照选择", c: "财务科目点击后弹出科目选择弹窗" },
      { n: "优先级数字校验", t: "字段校验-数值精度", c: "优先级为数字输入，支持整数" },
      { n: "匹配规则唯一性", t: "唯一性约束", c: "同一管控类型+财务科目组合不可重复创建匹配关系" },
      { n: "匹配规则生效", t: "业务规则", c: "设置匹配关系后，费用计算时按优先级取匹配规则进行财务管控" },
    ]
  },
  {
    id: "1162721303001027201", name: "费用计提-费用管控层级",
    page: "费用管控层级（制单页）", desc: "费用管控层级页面，配置费用管控的层级结构和审批权限。",
    fields: [
      { name: '*层级名称', type: '文本框（必填）' },
      { name: '*层级编码', type: '文本框（必填）' },
      { name: '*上级层级', type: '参照选择（必填）' },
      { name: '审批人', type: '参照选择' },
      { name: '备注', type: '文本框' },
    ],
    buttons: ['新建', '编辑', '取消编辑', '保存', '删除', '提交', '撤回提交', '刷新'],
    tps: [
      { n: "必填字段校验", t: "字段校验-必填", c: "*层级名称、*层级编码、*上级层级3个必填字段任一为空时保存失败" },
      { n: "层级编码唯一性", t: "唯一性约束", c: "层级编码不可重复创建" },
      { n: "上级层级参照选择", t: "字段校验-参照选择", c: "上级层级点击后弹出层级选择弹窗，选择后自动带入选中值" },
      { n: "审批人参照选择", t: "字段校验-参照选择", c: "审批人点击后弹出人员选择弹窗" },
      { n: "层级树结构校验", t: "业务规则", c: "上级层级不能选择自身；层级关系形成闭环时提示循环引用" },
      { n: "删除层级校验", t: "业务规则", c: "已有下级层级的节点不可删除，需先删除下级层级" },
    ]
  },
  {
    id: "1162721303001027204", name: "费用计提-费用计算明细报表",
    page: "费用计算明细报表（查询页）", desc: "费用计算明细报表页面，按多维度查看费用计算明细数据。",
    fields: [
      { name: '*统计年月', type: '日期选择（必填）' },
      { name: '事业部', type: '下拉选择' },
      { name: '管理部门', type: '下拉选择' },
      { name: '省区', type: '下拉选择' },
      { name: '办事处', type: '下拉选择' },
      { name: '政策层级', type: '下拉选择' },
    ],
    buttons: ['查询', '重置', '高级查询', '全部导出'],
    tps: [
      { n: "统计年月必填校验", t: "字段校验-必填", c: "统计年月为空时点击查询提示请选择统计年月" },
      { n: "多条件组合查询", t: "查询逻辑", c: "输入统计年月+事业部+管理部门+省区+办事处条件，点击查询，结果仅包含同时满足所有条件的数据" },
      { n: "无结果查询", t: "查询逻辑", c: "输入不存在的时间段条件，点击查询，列表显示共0条" },
      { n: "重置查询条件", t: "查询逻辑", c: "已输入查询条件后点击重置，所有查询条件清空" },
      { n: "全部导出", t: "操作按钮", c: "点击全部导出，导出数据包含报表全部字段" },
      { n: "费用明细数据验证", t: "流程集成", c: "查询结果展示费用计算明细数据，包含各层级费用金额和计算依据" },
    ]
  },
  {
    id: "1162721303001027207", name: "费用计提-费用计算汇总报表",
    page: "费用计算汇总报表（查询页）", desc: "费用计算汇总报表页面，按维度汇总展示费用计算结果。",
    fields: [
      { name: '*统计年月', type: '日期选择（必填）' },
      { name: '汇总维度', type: '下拉选择（按事业部/按管理部门/按省区/按政策层级）' },
      { name: '事业部', type: '下拉选择' },
      { name: '管理部门', type: '下拉选择' },
    ],
    buttons: ['查询', '重置', '高级查询', '全部导出'],
    tps: [
      { n: "统计年月必填校验", t: "字段校验-必填", c: "统计年月为空时点击查询提示请选择统计年月" },
      { n: "汇总维度切换", t: "查询逻辑", c: "切换汇总维度后，查询结果按新维度重新汇总展示" },
      { n: "按事业部汇总", t: "查询逻辑", c: "选择汇总维度为按事业部汇总，查询结果按事业部+品规维度展示汇总数据" },
      { n: "按管理部门汇总", t: "查询逻辑", c: "选择汇总维度为按管理部门汇总，查询结果按管理部门+品规维度展示汇总数据" },
      { n: "无结果查询", t: "查询逻辑", c: "输入不存在的时间段条件，点击查询，列表显示共0条" },
      { n: "重置查询条件", t: "查询逻辑", c: "已输入查询条件后点击重置，所有查询条件清空" },
      { n: "全部导出", t: "操作按钮", c: "点击全部导出，导出数据包含报表全部字段，按当前汇总维度导出" },
    ]
  }
];

function buildHtml(config) {
  var html = '<hr/><h3 data-design-analyze="true">设计稿分析报告 — ' + config.name + '</h3>\n';
  html += '<p><strong>来源平台</strong>：CoDesign（axure 原型）</p>\n';
  html += '<p><strong>设计链接</strong>：<a href="' + CODESIGN_URL + '">' + CODESIGN_URL + '</a></p>\n';
  html += '<p><strong>对应页面数</strong>：1 个</p>\n';
  html += '\n<hr style="border:1px dashed #ccc"/>\n';
  html += '<h4>页面1：' + config.page + '</h4>\n';
  html += '<p><strong>功能概述</strong>：' + config.desc + '</p>\n';

  if (config.fields && config.fields.length > 0) {
    html += '\n<h5>表单/搜索字段</h5>\n<table border="1" cellpadding="4" cellspacing="0" style="border-collapse:collapse;width:100%;font-size:12px;margin-bottom:8px">\n';
    html += '  <tr style="background:#f0f0f0"><th>序号</th><th>字段名</th><th>控件类型</th></tr>\n';
    config.fields.forEach(function(f, i) {
      html += '  <tr><td>' + (i+1) + '</td><td>' + f.name + '</td><td>' + f.type + '</td></tr>\n';
    });
    html += '</table>\n';
  }

  if (config.buttons && config.buttons.length > 0) {
    html += '\n<h5>操作按钮</h5>\n<p>' + config.buttons.join('、') + '</p>\n';
  }

  if (config.tps && config.tps.length > 0) {
    var typeOrder = ["字段校验", "唯一性约束", "状态流转", "业务规则", "流程集成", "操作按钮", "查询逻辑", "权限控制", "异常恢复"];
    html += '\n<h5>测试要点（高级测试工程师）</h5>\n';
    html += '<table border="1" cellpadding="4" cellspacing="0" style="border-collapse:collapse;width:100%;font-size:12px;margin-bottom:8px">\n';
    html += '  <tr style="background:#f0f0f0"><th>序号</th><th>测试场景</th><th>测试类型</th><th>验证点</th></tr>\n';
    var groups = {};
    config.tps.forEach(function(tp) { var cat = tp.t.split('-')[0]; if (!groups[cat]) groups[cat] = []; groups[cat].push(tp); });
    var idx = 1;
    typeOrder.forEach(function(cat) {
      if (!groups[cat]) return;
      groups[cat].forEach(function(tp) {
        html += '  <tr><td>' + (idx++) + '</td><td>' + tp.n + '</td><td>' + tp.t + '</td><td>' + tp.c + '</td></tr>\n';
      });
    });
    html += '</table>\n';
  }

  html += '\n<p style="color:#888;font-size:12px;margin-top:12px">分析时间：2026-07-06 | 工具：design-analyze Skill + CoDesign 原型提取</p>\n';
  return html;
}

async function getToken() {
  var r = await fetch(API_URL + '/tokens/request_token', {
    method: "POST", headers: { Authorization: "Basic " + b },
    body: new URLSearchParams({ grant_type: "client_credentials" })
  });
  return (await r.json()).data.access_token;
}

async function main() {
  for (var s = 0; s < STORIES.length; s++) {
    var story = STORIES[s];
    console.log('\n===== ' + story.name + ' (' + story.id.slice(-7) + ') =====');
    var token = await getToken();

    var r = await fetch(API_URL + '/stories?workspace_id=' + ws + '&id=' + story.id + '&fields=description', {
      headers: { Authorization: "Bearer " + token }
    });
    var d = await r.json();
    var desc = d.data[0].Story.description || '';

    // 清除旧报告
    while (true) {
      var idx = desc.indexOf('设计稿分析报告');
      if (idx < 0) break;
      var prevHr = desc.lastIndexOf('<hr/>', idx);
      if (prevHr >= 0) desc = desc.substring(0, prevHr);
      else { var pEnd = desc.lastIndexOf('</p>', idx); if (pEnd >= 0) desc = desc.substring(0, pEnd + 4); else desc = desc.substring(0, idx); }
    }

    var html = buildHtml(story);
    var body = new URLSearchParams({ workspace_id: ws, description: desc + html });
    var ur = await fetch(API_URL + '/stories/' + story.id, {
      method: "POST", headers: { Authorization: "Bearer " + token }, body: body
    });
    var ud = await ur.json();
    console.log('  ' + (ud.status === 1 ? '✅' : '❌') + ' 更新成功 (' + story.fields.length + '字段, ' + story.tps.length + '测试点)');
  }
  console.log('\n全部完成');
}

main().catch(console.error);
