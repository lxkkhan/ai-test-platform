/**
 * 更新 TAPD 需求 1026977（政策类型）和 1026974（费用政策）
 * 数据来源：CoDesign 费用计提原型
 */

const API_URL = "https://api.tapd.cn";
const ws = "62721303";
const CODESIGN_URL = "https://codesign.qq.com/app/prototype/694237278641224/detail";

const STORIES = [
  {
    id: "1162721303001026977",
    name: "费用计提-政策类型",
    pages: [
      {
        name: "费用计提-政策类型（制单页）",
        desc: "费用计提-政策类型页面，管理营销活动中各政策类型的定义与配置。",
        searchFields: [
          { name: '*终端', type: '参照选择（客户选择弹窗（全））' },
          { name: '*政策类型', type: '下拉选择（系统公共参数）' },
          { name: '*代理商', type: '参照选择（人员选择弹窗）' },
          { name: '*事业部', type: '参照选择（事业部选择弹窗）' },
          { name: '*品规', type: '参照选择（成药与大健康物料选择弹窗）' },
          { name: '*行政省份', type: '参照选择（行政区域选择弹窗（一级））' },
          { name: '*开始年月', type: '日期选择（YYYYMM）' },
          { name: '*结束年月', type: '日期选择（YYYYMM）' },
        ],
        buttons: ['新建', '编辑', '取消编辑', '保存', '删除', '提交', '撤回提交', '刷新'],
        testPoints: [
          { n: "必填字段校验", t: "字段校验-必填", c: "*终端、*政策类型、*代理商、*事业部、*品规、*行政省份、*开始年月、*结束年月8个必填字段任一为空时保存失败" },
          { n: "政策类型下拉选项", t: "字段校验-枚举", c: "政策类型为系统公共参数，需新增；下拉选择后带出对应值" },
          { n: "参照选择-客户弹窗", t: "字段校验-参照选择", c: "终端字段点击后弹出客户选择弹窗（全），选择后自动带入选中值" },
          { n: "参照选择-人员弹窗", t: "字段校验-参照选择", c: "代理商字段点击后弹出人员选择弹窗，选择后自动带入选中值" },
          { n: "参照选择-事业部弹窗", t: "字段校验-参照选择", c: "事业部字段点击后弹出事业部选择弹窗，选择后自动带入选中值" },
          { n: "参照选择-物料弹窗", t: "字段校验-参照选择", c: "品规字段点击后弹出成药与大健康物料选择弹窗，选择后自动带入选中值" },
          { n: "参照选择-行政区域弹窗", t: "字段校验-参照选择", c: "行政省份字段点击后弹出行政区域选择弹窗（一级），选择后自动带入选中值" },
          { n: "日期格式校验", t: "字段校验-日期格式", c: "开始年月和结束年月格式为YYYYMM，选择日期后自动格式化" },
          { n: "开始年月不晚于结束年月", t: "业务规则", c: "开始年月不能晚于结束年月；保存时校验" },
          { n: "政策类型唯一性校验", t: "唯一性约束", c: "同一终端+政策类型+代理商+事业部+品规+行政省份维度组合不可重复创建" },
          { n: "保存后状态流转", t: "状态流转", c: "保存后状态为草稿；提交后状态变更；撤回提交可回退" },
          { n: "删除已提交数据", t: "操作按钮", c: "已提交的数据删除时提示确认弹窗；草稿数据可直接删除" },
          { n: "编辑已提交数据", t: "操作按钮", c: "已提交的数据不可编辑，需撤回提后方可编辑" },
          { n: "新建-空白表单", t: "操作按钮", c: "点击新建打开空白编辑页，所有字段为默认值；可正常填写并保存" },
        ]
      }
    ]
  },
  {
    id: "1162721303001026974",
    name: "费用计提-费用政策",
    pages: [
      {
        name: "费用计提-费用政策（制单页）",
        desc: "费用计提-费用政策页面，管理费用政策的底价、单价、比例等核心参数配置。",
        searchFields: [
          { name: '*制单日期', type: '日期选择（必填，默认当天，可修改）' },
          { name: '*单据编号', type: '文本框（系统自动生成，50字符）' },
          { name: '*制单部门', type: '参照选择（办事处选择弹窗，100字符）' },
          { name: '*岗位级别', type: '下拉选择' },
          { name: '计算频率', type: '下拉选择' },
          { name: '*营销中心底价', type: '数字输入' },
          { name: '事业部底价', type: '数字输入' },
          { name: '管理部门底价', type: '数字输入' },
          { name: '管理内部底价一', type: '数字输入' },
          { name: '管理内部底价二', type: '数字输入' },
          { name: '管理内部底价三', type: '数字输入' },
          { name: '计算比例（%）', type: '数字输入' },
          { name: '计算单价（元/盒）', type: '数字输入' },
          { name: '事业部', type: '参照选择' },
          { name: '*管理部门', type: '参照选择' },
          { name: '省区', type: '参照选择' },
          { name: '行政省份', type: '参照选择' },
          { name: '二级行政省区', type: '参照选择' },
          { name: '办事处', type: '参照选择' },
          { name: '政策层级', type: '下拉选择' },
          { name: '备注', type: '文本框' },
        ],
        buttons: ['新建', '编辑', '取消编辑', '保存', '删除', '提交', '撤回提交', '刷新'],
        testPoints: [
          { n: "必填字段校验", t: "字段校验-必填", c: "*制单日期、*单据编号、*制单部门、*岗位级别、*营销中心底价、*管理部门6个必填字段任一为空时保存失败" },
          { n: "单据编号自动生成", t: "字段校验-格式", c: "单据编号保存后自动生成，格式：FYZC+YYYYMMDD+6位流水号，不可手动编辑，50字符" },
          { n: "制单日期默认值", t: "字段校验-默认值", c: "默认当天，可修改；查询时必须输入起止日期范围" },
          { n: "制单部门参照选择", t: "字段校验-参照选择", c: "制单部门点击后弹出办事处选择弹窗，必填；必须从组织档案中选择有效值" },
          { n: "数字底价字段校验", t: "字段校验-数值精度", c: "营销中心底价、事业部底价、管理部门底价、管理内部底价一/二/三为数值类型，支持小数输入" },
          { n: "计算比例和单价校验", t: "字段校验-数值精度", c: "计算比例（%）和计算单价（元/盒）为数值类型，支持小数输入" },
          { n: "事业部参照选择", t: "字段校验-参照选择", c: "事业部点击后弹出事业部选择弹窗" },
          { n: "管理部门参照选择", t: "字段校验-参照选择", c: "管理部门必填，点击后弹出部门选择弹窗" },
          { n: "省区/行政省份/二级行政省区/办事处", t: "字段校验-参照选择", c: "行政区域类字段点击后弹出对应区域选择弹窗" },
          { n: "政策层级下拉选项", t: "字段校验-枚举", c: "政策层级下拉选择，数据来源为系统公共参数" },
          { n: "计算频率下拉选项", t: "字段校验-枚举", c: "计算频率下拉选择，选择后影响费用计算逻辑" },
          { n: "岗位级别下拉选项", t: "字段校验-枚举", c: "岗位级别必填，下拉选择，决定费用计算所用的岗位层级" },
          { n: "底价联动计算", t: "业务规则", c: "设置不同级别的底价后，费用计算按优先级取价（营销中心→事业部→管理部门→管理内部）" },
          { n: "保存后状态流转", t: "状态流转", c: "保存后状态为草稿；提交后状态变更；撤回提交可回退" },
          { n: "删除已提交数据", t: "操作按钮", c: "已提交的数据删除时提示确认弹窗；草稿数据可直接删除" },
          { n: "编辑已提交数据", t: "操作按钮", c: "已提交的数据不可编辑，需撤回提交后方可编辑" },
          { n: "新建-空白表单", t: "操作按钮", c: "点击新建打开空白编辑页，所有字段为默认值；可正常填写并保存" },
        ]
      }
    ]
  }
];

function buildHtml(config) {
  let html = `<hr/><h3 data-design-analyze="true">设计稿分析报告 — ${config.name}</h3>
<p><strong>来源平台</strong>：CoDesign（axure 原型）</p>
<p><strong>设计链接</strong>：<a href="${CODESIGN_URL}">${CODESIGN_URL}</a></p>
<p><strong>对应页面数</strong>：${config.pages.length} 个</p>`;

  config.pages.forEach((p, pi) => {
    html += `\n<hr style="border:1px dashed #ccc"/>
<h4>页面${pi + 1}：${p.name}</h4>
<p><strong>功能概述</strong>：${p.desc}</p>`;

    // 字段
    if (p.searchFields && p.searchFields.length > 0) {
      html += `\n<h5>表单/搜索字段</h5>
<table border="1" cellpadding="4" cellspacing="0" style="border-collapse:collapse;width:100%;font-size:12px;margin-bottom:8px">
  <tr style="background:#f0f0f0"><th>序号</th><th>字段名</th><th>控件类型</th></tr>`;
      p.searchFields.forEach((f, i) => {
        html += `  <tr><td>${i + 1}</td><td>${f.name}</td><td>${f.type}</td></tr>`;
      });
      html += `</table>`;
    }

    // 按钮
    if (p.buttons && p.buttons.length > 0) {
      html += `\n<h5>操作按钮</h5><p>${p.buttons.join('、')}</p>`;
    }

    // 测试要点
    if (p.testPoints && p.testPoints.length > 0) {
      const typeOrder = ["字段校验", "唯一性约束", "状态流转", "业务规则", "流程集成", "操作按钮", "查询逻辑", "权限控制", "异常恢复"];
      html += `\n<h5>测试要点（高级测试工程师）</h5>
<table border="1" cellpadding="4" cellspacing="0" style="border-collapse:collapse;width:100%;font-size:12px;margin-bottom:8px">
  <tr style="background:#f0f0f0"><th>序号</th><th>测试场景</th><th>测试类型</th><th>验证点</th></tr>`;
      let groups = {};
      p.testPoints.forEach(tp => { const cat = tp.t.split('-')[0]; if (!groups[cat]) groups[cat] = []; groups[cat].push(tp); });
      let idx = 1;
      typeOrder.forEach(cat => {
        if (!groups[cat]) return;
        groups[cat].forEach(tp => {
          html += `  <tr><td>${idx++}</td><td>${tp.n}</td><td>${tp.t}</td><td>${tp.c}</td></tr>`;
        });
      });
      html += `</table>`;
    }
  });

  html += `\n<p style="color:#888;font-size:12px;margin-top:12px">分析时间：2026-07-06 | 工具：design-analyze Skill + CoDesign 原型提取</p>`;
  return html;
}

async function getToken() {
  const basic = Buffer.from("tapd-app-53825c:A3BEF211-FC08-81BB-D43B-3CEC09FF0AF9").toString("base64");
  const r = await fetch(`${API_URL}/tokens/request_token`, {
    method: "POST", headers: { Authorization: `Basic ${basic}` },
    body: new URLSearchParams({ grant_type: "client_credentials" })
  });
  return (await r.json()).data.access_token;
}

async function updateStory(storyId, html) {
  const token = await getToken();
  const r = await fetch(`${API_URL}/stories?workspace_id=${ws}&id=${storyId}&fields=description`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const d = await r.json();
  let desc = (d.data?.[0]?.Story?.description) || '';

  // 清除旧分析报告
  while (true) {
    const idx = desc.indexOf('设计稿分析报告');
    if (idx < 0) break;
    const prevHr = desc.lastIndexOf('<hr/>', idx);
    if (prevHr >= 0) desc = desc.substring(0, prevHr);
    else {
      const pEnd = desc.lastIndexOf('</p>', idx);
      if (pEnd >= 0) desc = desc.substring(0, pEnd + 4);
      else desc = desc.substring(0, idx);
    }
  }

  const body = new URLSearchParams({ workspace_id: ws, description: desc + html });
  const ur = await fetch(`${API_URL}/stories/${storyId}`, {
    method: "POST", headers: { Authorization: `Bearer ${token}` }, body
  });
  const ud = await ur.json();
  return ud.status === 1;
}

async function main() {
  for (const story of STORIES) {
    console.log(`\n===== ${story.name} (${story.id}) =====`);
    const html = buildHtml(story);
    const ok = await updateStory(story.id, html);
    console.log(`  ${ok ? '✅' : '❌'} 更新成功`);
  }
  console.log('\n全部完成');
}

main().catch(console.error);
