---
name: design-analyze
description: 从 CoDesign 或 JSDesign 设计稿提取规格数据，AI 分析生成结构化测试需求报告，追加回写到 TAPD 需求详情，并可自动衔接 tapd-gen 生成测试用例。用户只需打开链接登录，MCP 和依赖自动安装。支持双平台（腾讯 CoDesign + 即时设计 JSDesign），输出 JSON 兼容 tapd-gen 输入格式。触发词：/design-analyze、分析设计稿、设计需求提取、CoDesign分析、即时设计分析。当用户提到"分析设计稿"、"提取设计需求"、"CoDesign需求"、"即时设计需求"、"设计稿同步TAPD"等涉及设计稿分析和需求同步的请求时，必须使用此 Skill。
metadata:
  audience: testers
  workflow: tapd
---

# Design Analyze — 设计稿分析 + TAPD 需求同步

## 功能概述

本 Skill 从 CoDesign 或 JSDesign 设计稿中提取规格数据，AI 分析生成结构化测试需求报告，追加回写到 TAPD 需求详情，并衔接 `tapd-gen` 生成测试用例。

**核心体验：用户只需打开链接、登录，其余全自动。**

支持两种设计平台：

| 平台 | 提取方式 | 登录方式 | 用户体验 |
|------|---------|---------|---------|
| 腾讯 CoDesign | `codesign-mcp`（MCP 服务器，自动安装） | 扫码登录一次，之后自动复用 | 打开链接 → 扫码 → 完成 |
| 即时设计 JSDesign | `playwright`（浏览器自动化，自动安装） | 浏览器登录，之后自动复用 | 打开链接 → 登录 → 完成 |

> **零配置设计**：CoDesign 的 `codesign-mcp` 和 JSDesign 的 `playwright` 均通过 `opencode.jsonc` 配置，首次使用时 `npx -y` 自动下载安装，无需手动配置。

## 触发方式

### 命令式

```
/design-analyze S-xxx                        # 从 TAPD 需求提取设计链接，分析并回写
/design-analyze S-xxx --no-update            # 只分析不回写 TAPD
/design-analyze S-xxx --auto                 # 分析 + 自动回写 + 自动生成用例
/design-analyze <URL>                        # 直接分析设计链接（不关联 TAPD）
/design-analyze <URL> --story-id S-xxx       # 分析设计链接并关联到指定 TAPD 需求
```

### 对话式

用户说类似："分析 S-xxx 的设计稿"、"把这个设计稿同步到 TAPD"、"提取设计需求"、"CoDesign 需求分析"。

## 配置文件

本 Skill 通过 `_extends` 引用共享凭证 `_shared/tapd-config.json`，自身只保留 Skill 特有字段：

```json
{
  "_extends": "../_shared/tapd-config.json",
  "output_dir": "design-analysis",
  "analysis_depth": "detailed",
  "max_screens": 20,
  "auto_update_tapd": false,
  "auto_gen_cases": false
}
```

> **共享凭证**：`workspace_id`、`api_user`、`api_password`、`api_url`、`real_user`、`modules`、`owner_list`、`defaults` 等共用字段统一管理在 `_shared/tapd-config.json`。详见 tapd-analyze SKILL.md 中的完整字段说明。
>
> - `auto_update_tapd` 默认为 `false`，即回写 TAPD 前需用户确认
> - `auto_gen_cases` 默认为 `false`，即生成用例前需用户确认
> - CoDesign 和 JSDesign 的链接模式正则内置在 Skill 逻辑中，无需在 config 中配置

## 工作流

### 第零步：环境自动检查（无需用户操作）

Skill 启动时自动执行以下检查：

1. **MCP 服务器可用性**：
   - CoDesign：检查 `codesign-mcp` MCP 是否已配置并可用（`opencode.jsonc` 中配置 `npx -y codesign-mcp@latest`，首次调用时自动下载安装）
   - JSDesign：检查 `playwright` MCP 是否已配置并可用（同上，`npx -y @executeautomation/playwright-mcp-server`）
2. **TAPD 连通性**：验证 `config.json` 中的 API 凭证是否有效（复用 tapd-analyze 的连通性检查逻辑）
3. 如有缺失，自动提示并引导完成配置

> 用户无需手动安装任何 MCP 服务器或浏览器插件。一切通过 `npx -y` 自动完成。

### 第一步：获取 TAPD 需求

**调用 `tapd-analyze` Skill 获取需求详情**，复用其 TAPD API 调用逻辑：

1. 当用户提供 story_id 时，调用 `tapd-analyze` 的第一步和第二步：
   - 读取 TAPD config 获取凭证
   - 调用 TAPD Stories API 获取需求详情（标题、描述、优先级、状态等）
2. 从 tapd-analyze 返回的结果中提取 `description`（HTML 格式）

> 如果用户直接提供了设计链接（而非 story_id），跳过本步，直接进入第二步。

### 第二步：提取设计链接

从 TAPD 需求的 description（HTML 格式）中提取设计链接：

**CoDesign 链接正则**：
```
https?://codesign\.qq\.com/app/s/(\w+)[^\s"'<>]*
https?://codesign\.qq\.com/s/(\w+)[^\s"'<>]*
https?://codesign\.qq\.com/app/design/(\d+)[^\s"'<>]*
```

**JSDesign 链接正则**：
```
https?://js\.design/f/(\w+)(?:\?p=(\w+))?[^\s"'<>]*
```

提取结果分类：
| URL 类型 | 处理方式 |
|---------|---------|
| CoDesign 分享链接（`/s/` 或 `/app/s/`） | 直接使用 |
| CoDesign 设计链接（`/app/design/`） | 引导用户创建分享链接 |
| JSDesign 链接（`/f/`） | 提取 fileKey 和 pageId，通过 Playwright 打开 |

如果 description 中没有设计链接，提示用户手动提供。

### 第三步：平台检测与登录

#### CoDesign 平台（codesign-mcp）

1. 调用 `codesign_status` 检查是否已登录
2. 如果未登录，调用 `codesign_login` → 弹出浏览器窗口，用户扫码登录
3. 登录成功后，持久化 Profile 自动保存登录态，后续无需重复登录

#### JSDesign 平台（playwright）

1. 使用 `browser_navigate` 打开设计链接（如 `https://js.design/f/OSPvON?p=55HgATZqKP`）
2. 如果页面跳转到登录页，等待用户扫码或输入账号密码登录
3. 登录成功后，Playwright 浏览器保持登录状态，后续自动复用
4. 使用 `browser_snapshot` 确认页面已成功加载设计内容

> **JSDesign 无需安装任何插件**，通过 Playwright 浏览器自动化直接访问页面、提取数据。

### 第四步：提取设计规格

#### CoDesign 提取流程

CoDesign 分享链接有两种类型，提取方式不同：

**类型 A：设计文件（Figma/设计稿）** — 使用 `codesign-mcp` MCP 工具：

1. 调用 `list_artboards` 获取分享链接下的所有设计和画板
2. 对每个画板调用 `get_artboard_spec`，获取图层、文字、颜色、CSS、切图数据
3. 可选调用 `download_slice` 下载设计师导出的切图资源

**类型 B：原型文件（Axure 原型/交互原型）** — 使用 Playwright 浏览器自动化提取：

1. 使用 `playwright_navigate` 打开分享链接（`https://codesign.qq.com/s/{sharingId}`）
2. 如果链接需要密码，通过 `POST /api/sharings/{id}/state-keys` 提交密码获取 state-key，或在页面中填写密码提交
3. 等待页面加载完成，使用 `browser_evaluate` 获取左侧画板树的所有页面名称：
   ```javascript
   document.querySelectorAll('.label-text').forEach(el => console.log(el.textContent.trim()));
   ```
4. 使用 `browser_evaluate` 通过 JS 点击 `.label-text` 元素切换到目标页面
5. 提取每个页面的 widget 控件内容（字段标签、按钮、搜索条件等）

> **注意**：`codesign-mcp` 的 `list_artboards`/`get_artboard_spec` 不支持 Axure 原型类型，会返回 `SHARING_NOT_FOUND`。

#### VLM 视觉识别增强（推荐）

DOM 提取的按钮/字段顺序可能与设计稿视觉顺序不一致（多 tab 重复、iframeText 顺序错乱），VLM（视觉语言模型）直接从截图识别视觉顺序，更准确且能自动发现 DOM 遗漏的按钮。

**流程**：
1. **截图**：用 Playwright 打开 CoDesign 分享链接，逐页切换并截图
   - 截图前自动展开折叠区域（高级查询、展开按钮等）
   - 内容超出视口时分段截图（纵向滚动）
   - 截图保存到 `codesign_data/screenshots/{pageName}.png`
   - 支持手动截图模式：如果目录下已有同名 png 则跳过自动截图
2. **VLM 识别**：调用 Midscene 配置的 qwen3-vl-plus 模型识别截图
   - 按视觉顺序输出工具栏按钮、搜索字段、表格列
   - 多段截图逐张识别后按顺序合并去重
   - VLM 结果保存到 `codesign_data/vlm_results.json`
3. **合并 DOM + VLM**（`merge-extractions.js` 的 `mergeWithVLM` 函数）：
   - **按钮**：VLM 顺序优先，DOM 提取的按钮作为白名单补充
   - **字段**：VLM 顺序优先，DOM 提取的字段类型/备注说明作为属性补充
   - **表格列**：VLM 顺序优先，手动定义的 tableFields 作为白名单过滤噪音

**关键模块**：
- `playwright-mind/vlm-extract.js`：VLM 识别模块，直接调 qwen3-vl-plus API
- `playwright-mind/codesign-screenshot.js`：Playwright 自动截图模块
- `playwright-mind/merge-extractions.js`：`mergeWithVLM` 函数合并 DOM + VLM 结果
- `playwright-mind/run_vlm_pipeline.js`：一键运行截图 + VLM 识别的入口脚本
- `playwright-mind/verify_budget_fields.js`：字段验证（CDP 登录→DOM 扫描→校验）

**使用方式**：
```bash
cd .opencode/skills/playwright-mind
# 全部页面
node run_vlm_pipeline.js
# 只处理包含"业绩确认单"的页面
node run_vlm_pipeline.js 业绩确认单
# 验证系统 vs 设计稿字段
node verify_budget_fields.js
```

**CDP 登录（系统验证时使用）**：
- 启动真实 Chrome 进程 + `--remote-debugging-port=9222`
- 通过 `chromium.connectOverCDP()` 连接，绕过 WebDriver 检测
- 自动填写账号密码，调用 Python + OpenCV 自动解决滑块验证码
- 登录态持久化到 `.auth/chrome-profile-yxxt` 或独立 profile 目录
- 侧边栏搜索框输入菜单名，键盘方向键选择后回车导航

**Ant Design 表单字段检查要点**：
- 必填标记：检查 `.ant-form-item-required` CSS 类（Ant Design 用 CSS 伪元素渲染 `*`，DOM 文本中不可见）
- 控件类型检测：
  - `.ant-select` → 下拉选择/参照选择
  - `.ant-picker` → 日期选择
  - `input[type="number"]` → 数值输入
  - `textarea` → 多行文本
- 只读检测：检查 `ant-select-disabled` / `ant-picker-disabled` / `input[readonly]`
- 错误提示：`.ant-form-item-explain-error` / `.ant-message-error`

**完成 TAPD 更新后自动生成 XMind**：
```bash
cd .opencode/skills/playwright-mind
node gen_xmind_from_story_desc.js <story_id1> <story_id2> ...
```

**注意事项**：
- VLM 识别结果可能包含噪音（分页文字、导航元素等），需在合并阶段用 DOM 白名单过滤
- 截图前必须展开折叠区域，否则会丢失搜索字段
- 内容超出视口时必须分段截图，否则会丢失底部按钮/字段
- 如果 CoDesign 访问失败，用户可手动截图放入 `screenshots/` 目录
- 系统验证时 CDP 端口 9222 可能与其他脚本冲突，改用独立 profile 目录
- 不同系统（配送中心 vs 营销系统）使用独立的 profile 目录，避免登录态串扰

#### CoDesign 备注说明提取（核心流程）

原型文件中的**备注说明（元素注释）**是生成测试用例的关键数据源，必须逐页提取：

**第一步：打开备注面板**

在目标页面加载完成后，点击工具栏中的备注按钮（类名 `icon-v2-note2`，位于页面顶端正中第一个图标）：

```javascript
// 使用 browser_evaluate 执行
document.querySelector('.icon-v2-note2')?.click();
// 或
document.querySelectorAll('button').forEach(b => {
  if (b.querySelector('[class*="note"]')) b.click();
});
```

**第二步：提取带序号的备注数据（两种方式）**

备注面板的数据有两种获取方式，**优先使用方式一**，如果方式一无法解析则使用方式二：

**方式一（优先）：通过 innerHTML 保留结构化格式**

```javascript
const drawer = document.querySelector('[class*="notes-drawer"]');
const html = drawer.innerHTML;

// 提取所有注释单元格的结构化内容
const cells = drawer.querySelectorAll('[class*="notes-cell"]');
const items = [];
cells.forEach(function(cell) {
  const numEl = cell.querySelector('[class*="num"]');
  const nameEl = cell.querySelector('[class*="note-subtitle"] p');
  const contentEl = cell.querySelector('[class*="note-content"]');
  if (numEl && nameEl) {
    // 保留原始 HTML 结构（含 <ul><li> 列表）
    const contentHtml = contentEl ? contentEl.innerHTML.trim() : '';
    items.push({
      num: numEl.textContent.trim(),
      name: nameEl.textContent.trim(),
      note: contentHtml  // 保留 <ul><li><br> 等结构标签
    });
  }
});

// 同时提取页面说明（page notes）
const pageNoteEl = drawer.querySelector('[class*="note-title"] + [class*="mark"]');
const pageNote = pageNoteEl ? pageNoteEl.innerHTML : '';
```

> 使用 `innerHTML` 而非 `textContent` 可保留 CoDesign 备注中的列表结构（`<ul><li>`）、换行、缩进等格式，避免文本合并成一行。

**方式二（备选）：通过 textContent 解析纯文本**

```javascript
const drawer = document.querySelector('[class*="notes-drawer"]');
const raw = drawer.textContent.trim();
// 按序号拆分（注意排除备注内容中的 1、2、3、枚举）
const items = raw.split(/(?<![、\d])(\d+)(?=[\(（\u4e00-\u9fff])/);
for (let i = 1; i < items.length - 1; i += 2) {
  const num = items[i];
  const content = items[i + 1] || '';
  const nameMatch = content.match(/^([\u4e00-\u9fff_a-zA-Z\(\)\（\）]+)\s*/);
  const noteMatch = content.match(/^[\u4e00-\u9fff_a-zA-Z\(\)\（\）]+\s*(?:注释\s*)?([\s\S]*)$/);
  if (nameMatch) {
    console.log({ num, name: nameMatch[1].trim(), note: noteMatch ? noteMatch[1].trim() : content.trim() });
  }
}
```

**写入 TAPD 时的格式化规则**：

无论是哪种方式获取的备注文本，写入 TAPD story 的 `description` 字段（HTML 格式）时：

1. 如果原文包含 `<ul><li>` 列表结构，**保留原样**，不做任何压缩
2. 如果原文是纯文本但有多行/分段，用 `<br>` 或 `<p>` 保持分段
3. **禁止**将列表项合并为一段话，禁止删除或缩写任何原文内容
4. 实在无法获取结构化格式时，标注"备注内容为纯文本，原始结构不可恢复"

**第三步：匹配未命名控件**

当备注中的名称为 `(文本框)` 时，需要通过对照原型页面中的控件顺序来匹配实际字段名：

```javascript
// 从原型 iframe 中获取按顺序排列的文本控件
const iframe = document.querySelector('iframe');
const doc = iframe.contentDocument || iframe.contentWindow.document;
const texts = doc.querySelectorAll('[class*="text"][id*="_text"]');
const widgets = [];
texts.forEach(el => {
  const text = el.textContent?.trim() || '';
  if (text && text.length > 1 && !['主页','标签页','菜单名称','管理员','消息中心','处理中心','问题反馈','切换组织','紧急任务','122'].includes(text)) {
    const pid = el.closest('div[id^="u"]')?.id || el.id;
    const idNum = parseInt(pid.replace('u','').replace('_text','')) || 0;
    widgets.push({ id: pid, text: text, num: idNum });
  }
});
// 按 Axure widget ID 排序（决定视觉顺序）
widgets.sort((a, b) => a.num - b.num);
// 从第一个可输入字段开始匹配 (文本框) 备注项
```

匹配规则：
- 备注中的序号对应原型页面中交互控件的视觉顺序
- 排除系统级导航元素（菜单名称、管理员、消息中心等）
- 重点关注搜索框、下拉框、输入框等可交互控件
- 按钮类（新增、修改、保存等）直接从备注中自动识别名称

**第四步：逐页遍历所有相关页面**

对每个匹配的需求模块，遍历其所有设计页面，重复第一步到第三步。

#### JSDesign 提取流程（playwright MCP）

通过 Playwright 浏览器自动化提取设计数据，**无需安装任何插件**：

1. **确认页面加载**：使用 `browser_snapshot` 获取页面结构，确认设计内容已加载
2. **获取画板列表**：通过 `browser_evaluate` 执行 JS，提取页面左侧画板树的所有画板名称和 ID
3. **逐画板提取规格**：对每个画板：
   - 使用 `browser_click` 切换到目标画板
   - 使用 `browser_snapshot` 获取画板的完整无障碍树（包含节点层级、文字、角色等）
   - 使用 `browser_evaluate` 提取节点详细信息（宽高、颜色、字体、位置等）
4. **可选截图**：使用 `browser_take_screenshot` 保存每个画板的截图到 `output_dir`
5. **多页面处理**：如果设计文件有多个页面（`?p=` 参数），使用 `browser_navigate` 逐页提取

#### 数据提取 JS 代码片段（JSDesign）

```javascript
// 获取所有画板信息
() => {
  const panels = document.querySelectorAll('[class*="screen_list__item"]');
  return Array.from(panels).map(p => ({
    id: p.id,
    name: p.querySelector('[class*="screen_list__item-name"]')?.textContent,
    width: parseInt(p.dataset.width),
    height: parseInt(p.dataset.height)
  }));
}
```

> **注意**：JSDesign 的 DOM 结构可能随版本更新变化，上述选择器为参考示例。实际提取时根据 `browser_snapshot` 返回的无障碍树动态适配。

### 第五步：数据标准化

将两平台提取的数据映射为统一 Schema：

```json
{
  "source": "codesign | jsdesign",
  "source_url": "原始链接",
  "design_name": "项目名称",
  "platform": "codesign | jsdesign",
  "screen_count": 5,
  "screens": [
    {
      "id": "画板/节点ID",
      "name": "画板名称",
      "width": 375,
      "height": 812,
      "layer_count": 45,
      "slice_count": 3
    }
  ],
  "design_specs": {
    "ui_components": ["按钮", "输入框", "列表", "弹窗"],
    "interactions": ["点击跳转", "下拉刷新", "模态弹窗"],
    "text_content": {
      "screen_name": ["标题文字", "按钮文案"]
    },
    "colors": ["#333333", "#1890FF", "#FFFFFF"],
    "typography": [
      { "fontFace": "PingFang SC", "fontSize": 28, "fontWeight": "bold" }
    ],
    "layout_info": {
      "screen_name": { "frameType": "mobile", "width": 375, "height": 812 }
    }
  }
}
```

#### 字段映射表

| 统一字段 | CoDesign 来源 | JSDesign 来源 |
|---------|-------------|--------------|
| `id` | `screen.id` | 节点 DOM ID 或 data 属性 |
| `name` | `screen.name` | `aria-label` 或文本内容 |
| `width/height` | `spec.artboard.width/height` | `node.width/height` 或截图尺寸 |
| `ui_components` | `spec.layers[].type` 枚举去重 | 无障碍树 role 属性枚举去重 |
| `text_content` | `spec.layers[].content` | 节点 `textContent` |
| `colors` | `spec.layers[].fills[]` RGB 提取 | CSS `computedStyle` 提取 |
| `typography` | `spec.layers[]` 的 fontSize/fontFace/fontWeight | CSS `computedStyle` 提取 |
| `interactions` | 从画板名称和文字推断 | 从画板名称和文字推断 |

### 第六步：结构化分析报告生成

根据从设计稿提取的数据，**按固定格式生成需求分析报告**，覆盖写入 TAPD 需求详情（如已有旧分析则清除后追加）。

#### 标准输出结构（每个需求必须包含以下 4 个部分）

| # | 模块 | 说明 | 格式 |
|---|------|------|------|
| 1 | **表单/搜索字段** | 页面中所有的表单字段或搜索条件，含序号和字段名。必填字段标注 `*` 前缀 | HTML table，列：序号、字段名 |
| 2 | **操作按钮** | 页面中所有的操作按钮清单 | 纯文本，顿号分隔 |
| 3 | **设计稿备注说明** | 从 CoDesign 备注面板提取的原始注释（如有）。保留原文结构，禁止压缩 | HTML table，列：序号、控件、备注说明 |
| 4 | **测试要点** | 正向/逆向/异常测试场景，覆盖核心功能 | HTML table，列：序号、测试场景、类型、验证点 |

> **注意**：
> - 每个页面（表单/列表/弹窗）独立一套 4 部分结构，多个页面用 `<hr>` 分隔
> - 若设计稿无备注说明，标注"—（无备注）"或跳过该部分
> - 写入前检查 `data-design-analyze` 标记，有则清除旧内容再写入
> - 备注说明内容必须使用 `innerHTML` 提取，保留 `<br>- ` 列表结构

#### HTML 结构模板

```html
<hr />
<h3 data-design-analyze="true">设计稿分析报告 — {需求名称}</h3>
<p><strong>来源平台</strong>：CoDesign（axure 原型）</p>
<p><strong>设计链接</strong>：<a href="{URL}">{URL}</a></p>
<p><strong>对应页面数</strong>：N 个</p>

<!-- ===== 页面一：表单/列表/弹窗 ===== -->
<hr style="border:1px dashed #ccc"/>
<h4>📝 页面一：{页面名称}</h4>
<p><strong>功能概述</strong>：{简述}</p>

<h5>表单/搜索字段</h5>
<table border="1" cellpadding="4" cellspacing="0" style="border-collapse:collapse;width:100%;font-size:12px;margin-bottom:8px">
  <tr style="background:#f0f0f0"><th>序号</th><th>字段名</th></tr>
  <tr><td>1</td><td>*必填字段</td></tr>
  <tr><td>2</td><td>非必填字段</td></tr>
</table>

<h5>操作按钮</h5>
<p>保存、取消、查询、重置、导出</p>

<h5>📝 设计稿备注说明</h5>
<table border="1" cellpadding="4" cellspacing="0" style="border-collapse:collapse;width:100%;font-size:12px;margin-bottom:8px">
  <tr style="background:#f0f0f0"><th>序号</th><th>控件</th><th>备注说明</th></tr>
  <tr><td>1</td><td>保存</td><td>校验必填项，失败toast提示</td></tr>
</table>

<h5>🧪 测试要点</h5>
<table border="1" cellpadding="4" cellspacing="0" style="border-collapse:collapse;width:100%;font-size:12px;margin-bottom:8px">
  <tr style="background:#f0f0f0"><th>序号</th><th>测试场景</th><th>类型</th><th>验证点</th></tr>
  <tr><td>1</td><td>必填项为空保存</td><td>逆向</td><td>toast提示必填</td></tr>
  <tr><td>2</td><td>正常新增保存</td><td>正向</td><td>保存成功返回列表</td></tr>
  <tr><td>3</td><td>取消操作</td><td>逆向</td><td>弹出确认框</td></tr>
</table>

<!-- ===== 更多页面重复上述结构 ===== -->

<p style="color:#888;font-size:12px;margin-top:12px">分析时间：{时间} | 工具：design-analyze Skill</p>
```

#### 测试要点生成规则

| 场景类型 | 示例 | 数量建议 |
|---------|------|---------|
| **正向** | 正常新增、正常查询、成功保存、状态切换 | 占 40% |
| **逆向** | 必填为空、取消操作、删除确认、重复提交 | 占 40% |
| **异常** | 无结果搜索、特殊字符、网络中断、超长输入 | 占 20% |

每个页面至少生成 3~8 条测试要点，覆盖主要功能路径。

#### 测试要点模板适配规则

每个页面类型的测试要点数量可根据页面实际控件调整：

| 页面类型 | 基础用例数 | 适配说明 |
|---------|-----------|---------|
| 列表页 | 20 条 | 移除不适用的按钮测试（如无导出按钮则删导出用例） |
| 制单页 | 17 条 | 字段级校验用例按实际字段数量展开（每个必填字段独立一条） |
| 弹窗页 | 12 条 | 搜索条件相关用例按实际条件数量调整 |

页面类型自动判断规则：
- 页面名包含"列表"、"查询"、"管理" → 列表页
- 页面名包含"制单"、"编辑"、"新增"、"详情" → 制单页
- 页面名包含"弹窗"、"选择"、"弹出" → 弹窗页
- 页面名包含"流程"、"流程图" → 流程图页（仅作参考，不生成测试用例）
```

#### 字段匹配规则

备注说明中标注为 `(文本框)` 的未命名控件，按以下规则匹配实际字段名：

1. 从 Axure 原型 iframe 中获取 `[class*="text"][id*="_text"]` 控件列表
2. 按 widget ID 数字排序（决定视觉顺序）
3. 排除系统导航元素（主页、菜单名称、管理员、消息中心、处理中心、问题反馈、切换组织、紧急任务等）
4. 剩余控件的顺序与备注序号一一对应
5. 按钮类控件优先从备注的 `name` 字段获取名称（1新增、2修改、3保存...）

#### 原型页面内容提取

除了备注说明，还需提取页面中的实际控件内容（字段标签、按钮文字）：

```javascript
// 获取原型 iframe 中所有文本控件的文字内容和顺序
const doc = iframe.contentDocument || iframe.contentWindow.document;
const texts = doc.querySelectorAll('[class*="text"][id*="_text"]');
const fields = [];
texts.forEach(el => {
  const text = el.textContent?.trim() || '';
  if (text && text.length > 1 && !忽略系统导航文字) {
    const pid = el.closest('div[id^="u"]')?.id || el.id;
    fields.push({ id: pid, text: text, order: parseInt(pid.replace('u','')) });
  }
});
fields.sort((a, b) => a.order - b.order);
```

## 状态管理

全流程使用状态文件 `.design-analyze-state.json` 保存进度，支持中断后恢复：

```json
{
  "story_id": "S-xxx",
  "source_platform": "jsdesign",
  "source_url": "https://js.design/f/OSPvON?p=55HgATZqKP",
  "current_step": "extract",
  "steps_completed": ["tapd_fetch", "link_extract", "platform_login"],
  "tapo_summary": { "title": "...", "description": "..." },
  "design_data": {
    "screen_count": 5,
    "screens_extracted": 3,
    "extracted_screens": ["画板1", "画板2", "画板3"]
  },
  "analysis_result": { ... },
  "tapd_updated": false,
  "cases_generated": false,
  "created_at": "2025-06-01T10:30:00Z",
  "updated_at": "2025-06-01T10:45:00Z"
}
```

**状态文件字段说明**：

| 字段 | 说明 |
|------|------|
| `current_step` | 当前所在步骤：`tapd_fetch` / `link_extract` / `platform_login` / `extract` / `analyze` / `tapd_update` / `gen_cases` |
| `steps_completed` | 已完成的步骤列表 |
| `design_data` | 设计稿提取进度（支持部分画板提取中断续跑） |
| `tapd_updated` | TAPD 回写是否已完成 |
| `cases_generated` | 测试用例是否已生成 |

### 恢复机制

如果流程中断（网络错误、用户中断、API 限流等）：

1. 读取 `.design-analyze-state.json` 获取当前步骤和数据
2. 如果 `current_step` 为 `extract` 且有部分画板已提取，从未完成的画板继续
3. 如果 `current_step` 为 `analyze`，保留已提取的设计数据，继续 AI 分析
4. 如果 `current_step` 为 `tapd_update`，跳过提取和分析步骤，直接回写
5. 已完成的步骤不会重复执行

### 恢复命令

```bash
/design-analyze S-xxx --resume    # 从中断处恢复
/design-analyze S-xxx --restart   # 从头开始（清除状态文件）
```

### 第七步：回写 TAPD 需求详情

> **认证方式**：TAPD API 使用 Bearer Token。参见 `_shared/tapd-config.json` 中的 `token_url`。

将分析结果以 HTML 格式**追加**到原需求的 description 字段（保留原有内容）：

```bash
curl.exe -H "Authorization: Bearer {access_token}" \
  --data-urlencode "workspace_id={workspace_id}" \
  --data-urlencode "description={original_description}{append_html}" \
  "{api_url}/stories/{story_id}"
```

#### 追加 HTML 模板

```html
<hr/>
<h3>📋 设计稿分析报告</h3>
<p><strong>来源平台</strong>：{platform}</p>
<p><strong>设计链接</strong>：<a href="{source_url}">{source_url}</a></p>
<p><strong>画板数量</strong>：{screen_count}</p>

<h4>🎯 功能点</h4>
<table border="1" cellpadding="4" cellspacing="0">
  <tr><th>功能点</th><th>描述</th><th>风险</th><th>优先级</th><th>测试类型</th></tr>
  {features_rows}
</table>

<h4>📐 测试范围</h4>
<p><strong>IN SCOPE</strong>：{in_scope}</p>
<p><strong>OUT OF SCOPE</strong>：{out_of_scope}</p>

<h4>🔑 测试重点</h4>
<ul>{test_focus_items}</ul>

<h4>✅ 验收标准</h4>
<ul>{acceptance_criteria_items}</ul>

<h4>🎨 设计规格摘要</h4>
<p><strong>UI组件</strong>：{ui_components}</p>
<p><strong>交互</strong>：{interactions}</p>
<p><strong>主色调</strong>：{colors}</p>
```

> **重要**：
> - 回写前必须先获取原需求的完整 description，将分析报告**追加**到末尾，绝不替换原有内容
> - 中文字段必须通过 `--data-urlencode` 传入
> - `auto_update_tapd` 为 `false` 时，必须先展示分析报告让用户确认后再回写

### 第八步：衔接 tapd-gen 生成测试用例

分析完成后，将 JSON 输出传给 `tapd-gen` 生成测试用例：

1. 将 `analysis_result` 传给 `tapd-gen` Skill
2. `tapd-gen` 根据 features 生成测试用例并写入 TAPD
3. 所有用例通过 story_id 关联到原需求

当 `auto_gen_cases` 为 `true` 或用户确认时自动执行。

### 第九步：生成 XMind 思维导图（可选，调用 playwright-mind）

分析完成后，可根据 TAPD 需求内容生成 XMind 测试用例思维导图文件（由 `playwright-mind` Skill 驱动）：

#### XMind 文件结构规范

每个 XMind 文件必须包含**需求关联**，结构如下：

```
Root（需求标题）
  └── 需求：{需求标题}（href = TAPD story URL）
        ├── 模块：{模块名称1}
        │     ├── 测试点：{测试点名称}
        │     │     └── 用例：{用例名称} #{优先级}
        │     │           ├── 前置条件：{菜单导航路径}
        │     │           ├── 步骤：{步骤描述}
        │     │           └── 预期：{预期结果}
        │     └── ...
        ├── 模块：{模块名称2}
        └── ...
```

> **关键约束**：
> 1. `需求：` 节点的 `href` 属性必须设置为 TAPD story URL（格式：`https://www.tapd.cn/{workspace_id}/prong/stories/view/{story_id}`），这是 XMind 中关联需求的标准方式
> 2. `Root` 节点标题为需求标题（不带`需求：`前缀），`需求：`节点作为 Root 的第一子节点
> 3. 模块按功能区域组织（制单表单、操作按钮、搜索/筛选、状态流转、唯一性约束、业务规则、流程集成、数据权限、异常场景等）
> 4. **每条用例必须包含**：前置条件（含菜单导航路径）、步骤、预期三个子节点
> 5. 前置条件格式：`登录系统，进入菜单：{一级} → {二级} → {三级}；`
> 6. 菜单路径从需求名称自动提取（`getMenuPath(storyName)` 函数：按 `-` 分割取前段）
> 7. 测试点按类型自动展开为多条用例（通过 `test-case-engine.js` 的 `expandTestPoint` 函数）
> 8. XMind 文件使用 `xmind` npm 包生成，需包含 `content.json`、`metadata.json`、`manifest.json`、`content.xml`

#### 生成步骤

**方式一：从 TAPD 自动拉取用例生成（推荐）**
```bash
cd .opencode/skills/playwright-mind
node gen_xmind_from_tapd.js {story_id}
```

自动从 TAPD 获取需求名称和已关联的测试用例，生成带 TAPD URL 关联的 XMind 文件。

**方式二：从当前分析数据生成（内置测试要点）**
```bash
cd .opencode/skills/playwright-mind
node gen_xmind_from_analysis.js {story_id}
```

基于本分析报告中的测试要点数据直接生成 XMind 文件，无需等待用例创建后再执行。

**输出**：
- `.xmind` 文件保存到 `test_pool/` 目录
- 文件命名格式：`{需求名称}.xmind`
- 自动关联 TAPD story URL

> XMind 文件由 [playwright-mind](../playwright-mind/SKILL.md) Skill 生成，所有生成脚本遵循 XMind 结构规范，确保 `href` 关联到 TAPD story。

## 错误处理

| 场景 | 处理方式 |
|------|---------|
| MCP 服务器未启动 | 自动重试；`npx -y` 首次调用会自动下载安装，等待完成即可 |
| TAPD 需求 description 中无设计链接 | 提示用户手动提供设计链接，或尝试通过需求名称匹配 |
| CoDesign URL 是设计链接而非分享链接 | 引导用户在 CoDesign 中点击"分享"按钮创建分享链接 |
| CoDesign 分享链接需密码 | 提示用户输入密码，传入 `password` 参数，通过 `POST /api/sharings/{id}/state-keys` 获取密钥 |
| CoDesign 登录超时 | 默认等 10 分钟，超时提示重试 |
| CoDesign 分享是原型类型而非设计类型 | `codesign-mcp` 的 `list_artboards` 不支持原型，改用 Playwright 浏览器自动化提取 |
| 备注面板无内容 | 页面显示"暂无内容 Axure文件中，当前页无备注说明"，则跳过该页 |
| 备注内容中的序号与内容冲突 | 备注内容中包含 `1、2、3、` 枚举时，拆分正则需排除后跟`、`的序号（使用 `(?<![、\d])` 前视断言） |
| (文本框) 无法匹配字段名 | 通过读取 iframe 中的 `[class*="text"][id*="_text"]` 控件列表，按 widget ID 顺序匹配 |
| JSDesign 页面加载失败 | 刷新页面重试，或使用 `browser_navigate` 重新导航 |
| JSDesign 登录页面未检测到 | 等待页面加载完成，使用 `browser_snapshot` 检测登录状态 |
| JSDesign DOM 结构变化 | 根据 `browser_snapshot` 返回的无障碍树动态适配，而非硬编码选择器 |
| 设计文件无画板数据 | 检查链接是否正确，是否为空项目 |
| 多画板未指定 | 列出所有画板让用户选择，或遍历全部（≤ max_screens） |
| TAPD 回写失败 | 保存本地 JSON 备份到 `output_dir`，提供手动回写指引 |
| 画板数量超过 max_screens | 只分析前 max_screens 个画板，提示用户增加限制 |

## TAPD API 参考

详细的 Stories API 文档请参考 `references/tapd-story-update-reference.md`，重点包含：
- GET /stories/{id} — 获取需求详情（含 description）
- POST /stories/{id} — 更新需求详情（追加分析报告）
- Stories 自定义字段 API

CoDesign MCP API 文档请参考 `references/codesign-api-reference.md`。

JSDesign Playwright 提取参考请参考 `references/jsdesign-api-reference.md`。

## 与其他 Skill 的协作

- **tapd-analyze**：本 Skill 的第一步调用 tapd-analyze 获取 TAPD 需求详情，复用其 TAPD API 调用逻辑。当无设计链接时可直接使用 tapd-analyze
- **tapd-gen**：JSON 输出可直接作为输入，生成 TAPD 测试用例
- **tapd-notify**：分析+回写完成后推送通知到企业微信
- **tapd-executor**：本 Skill 可替代 tapd-executor 中的 tapd-analyze 环节，形成新路线路：design-analyze → tapd-gen → template-engine → auto-test-runner → tapd-sync → tapd-notify
- **template-engine**：设计规格中的 UI 组件可辅助模板匹配
- **tapd-bug**：分析过程中发现的设计问题可提 Bug
- **playwright-mind**：分析报告中的测试要点可导入 playwright-mind 生成 XMind 思维导图文件

### 与 tapd-analyze 的关系

| 场景 | 使用哪个 Skill |
|------|--------------|
| 只有 TAPD 需求，无设计稿 | `tapd-analyze` |
| TAPD 需求中有 CoDesign/JSDesign 链接 | `design-analyze`（调用 tapd-analyze 获取需求 + 设计稿增强分析） |
| 只有设计链接，无 TAPD 需求 | `design-analyze`（跳过 TAPD 获取，只做设计分析） |
| 全流程自动化（TAPD 需求 + 设计稿） | `design-analyze --auto` |

### 与 tapd-executor 的关系

tapd-executor 的流程是 `tapd-analyze → tapd-gen → template-engine → ...`。
当需求中包含设计稿链接时，可用 `design-analyze` 替代 `tapd-analyze` 环节：
- 原流程：`tapd-analyze S-xxx → tapd-gen → template-engine → ...`
- 新流程：`design-analyze S-xxx → tapd-gen → template-engine → ...`

## 全流程集成

```
design-analyze（设计稿分析）
  ├─ 平台检测（CoDesign / JSDesign）
  ├─ 页面树提取（获取所有页面名称）
  ├─ 逐页提取规格（字段/按钮/搜索条件）
  ├─ 备注说明提取（打开备注面板 → 解析序号 → 匹配字段名）
  ├─ 按页面菜单组织分析报告
       ↓
playwright-mind（XMind生成——可选）
       ↓
tapd-gen（用例生成）
       ↓
template-engine（脚本组装）
       ↓
auto-test-runner（测试执行）
       ↓
tapd-sync（结果同步）
       ↓
tapd-notify（企微通知）
```

## 双平台提取方式对比

| 维度 | CoDesign | JSDesign |
|------|-----------|-----------|
| **提取方式** | codesign-mcp MCP（API + CDN JSON） | playwright（浏览器自动化） |
| **登录** | 扫码一次，自动复用 | 浏览器登录，自动复用 |
| **是否需要插件** | 不需要 | 不需要 |
| **数据完整度** | 完整（图层/文字/颜色/CSS/切图） | 部分（DOM 结构 + 文字 + 截图 + CSS 属性） |
| **优势** | 官方 CDN 数据，100% 准确 | 无需额外依赖，直接浏览器操作 |
| **限制** | 需要分享链接 | DOM 结构可能随版本变化 |

## 注意事项

1. **零配置设计**：CoDesign 用 `codesign-mcp`（自动安装），JSDesign 用 `playwright`（自动安装），用户无需手动安装任何东西
2. **步骤 1 复用 tapd-analyze**：获取 TAPD 需求详情的逻辑与 tapd-analyze 相同，避免重复实现
3. **原型类型 vs 设计类型**：CoDesign 分享链接可能是原型类型（axure）或设计类型（Figma）。`codesign-mcp` 工具只支持设计类型；原型类型需使用 Playwright 浏览器自动化
4. **备注说明提取流程**：打开页面 → 点击 `icon-v2-note2` 按钮 → 解析备注文本 → 匹配 `(文本框)` 到实际字段名 → 按页面菜单组织输出
5. **字段名匹配规则**：备注中的序号对应原型控件在 iframe 中的视觉顺序。从 `[class*="text"][id*="_text"]` 获取所有文本控件，按 widget ID 排序后，跳过系统导航文字，剩余控件的顺序与备注序号一一对应
6. CoDesign 优先使用分享链接（`/s/` 格式），设计链接（`/app/design/`）需要用户创建分享链接后才能使用
7. JSDesign **无需安装任何插件**，通过 Playwright 浏览器自动化直接访问和提取数据
8. 回写 TAPD 时**追加**而非替换原需求描述，保留用户原有内容
9. 分析结果按**页面菜单**组织（列表/制单/弹窗），而非按功能类型，便于直接生成测试用例
10. Windows 环境下使用 `curl.exe` 而非 `curl`（PowerShell 别名）
11. 中文字段必须通过 `curl.exe --data-urlencode` 传入，避免编码乱码
12. 分析结果会保存到 `output_dir` 目录（默认 `design-analysis/`），JSON 文件命名格式：`{story_id}_{platform}_{timestamp}.json`
13. `config.json` 中的 TAPD 凭证（`workspace_id`、`api_user`、`api_password` 等）与 `tapd-analyze` 和 `tapd-gen` 共享，修改时需同步

## 代码规范与反偷懒规则

以下规则基于多次踩坑总结，所有 AI 生成/修改的提取代码必须遵守：

### 禁用项

| 规则 | 踩坑案例 | 正确做法 |
|------|---------|---------|
| ❌ 禁止对提取结果用 `.slice()` 硬截断 | `inputs.slice(0, 10)` 把"生成业绩""导出"等按钮截掉了 | 全量提取后过滤噪声，而非限制数量 |
| ❌ 禁止用 ID 黑名单过滤字段 | 排除 `u5_`/`u8_`/`u11_` 等 ID 前缀，把正常字段也误过滤了 | 用白名单（匹配位置/父容器）或正规则 |
| ❌ 禁止启发式 ID 匹配替代真实数据 | `input.id.replace('_input','_text')` 猜字段标签，结果对不上 | 直接读 iframe 中控件旁边的实际文本内容 |
| ❌ 禁止代码中留临时调试限制 | `// 先取前10个看看` 忘了删变成最终逻辑 | 提效前必须去掉所有调试限制和桩代码 |
| ❌ 禁止写泛泛的测试要点 | "按XX搜索→筛选匹配记录" 这种描述 | 必须按高级测试工程师标准：字段校验/状态流转/业务规则/权限/异常 |
| ❌ 禁止手动定义按钮列表 | 手写 `buttons: ['查询','重置']` 遗漏了原型中的按钮 | 从 iframe DOM 自动提取 + 关键词去重合并 |

### 提取后必查清单

```
□ 所有操作按钮是否都已提取？（对比页面截图或完整 iframe 文本）
□ 字段名是否与设计稿备注说明一致？
□ 控件类型是否正确（文本框/下拉选择/日期选择/复选框）？
□ 测试要点是否覆盖：字段校验、唯一性约束、状态流转、业务规则、权限控制、异常场景？
```

### 流程规范

```
提取数据 → 先保存 JSON 手动检查 → 确认完整后 → 再写入 TAPD
          ↑—————— 不准跳过 ——————↑
```

每次生成 TAPD 更新前必须将原始提取数据保存为 JSON，人工确认后再提交。