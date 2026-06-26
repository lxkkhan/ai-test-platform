---
name: ai-test-executor
description: AI智能测试执行器。用户描述测试路径和操作，AI自动导航、分析表单字段、生成测试数据、执行测试、截图报告、失败自动提Bug到TAPD。触发词：/ai-test、/aitest、智能测试、AI测试执行。
metadata:
  audience: testers
  workflow: tapd
---

# AI Test Executor — AI 智能测试执行器

## 功能概述

用户通过自然语言描述测试路径和操作，AI 自动完成全流程：

```
用户说："进入营销系统SIT-基础数据-客户管理-机构（全功能），新增，关联需求1025359"
  ↓
AI：启动浏览器 → 登录系统 → 导航到菜单 → 分析表单字段
  → 生成测试用例清单 → 展示给用户勾选 → 逐条执行
  → 生成HTML报告 + 写入TAPD用例 → 失败项用户确认后自动提Bug
```

## 工作流（12步）

### 第1步：启动浏览器

使用 `playwright-mind/node_modules/playwright`（standalone模式，独立于MCP）。

模式：`headless: false`（有头模式，用户可见操作过程）

### 第2步：登录目标系统

复用 `dom-recorder/scripts/perform-login-lite.ts` 的登录逻辑：
- 从 `.env` 读取 `LOGIN_URL` / `LOGIN_USERNAME` / `LOGIN_PASSWORD`
- 支持滑块验证码自动处理（Python OpenCV）
- 登录成功后保持浏览器会话

### 第3步：解析用户指令

解析格式：

```
进入[路径]，[操作]，关联需求[story_id]
```

示例：
```
进入营销系统SIT-基础数据-客户管理-机构（全功能），新增，关联需求1025359
→ path: ["营销系统SIT", "基础数据", "客户管理", "机构（全功能）"]
→ action: "新增" (或 "修改")
→ story_id: "1025359"
```

### 第4步：菜单导航

逐级查找并点击菜单项：
1. 先查找侧边栏/导航栏中的顶层菜单
2. 点击展开子菜单（如有）
3. 逐级下钻直到找到目标页面
4. 等待目标页面加载完成

匹配策略：
- 精确匹配 → 模糊包含匹配 → AI语义匹配

### 第5步：表单字段分析

定位到目标页面后，扫描表单区域：

```javascript
// 核心检测逻辑
fields = [];
formArea = document.querySelector('form') || 
          document.querySelector('[class*="form"]') ||
          document.querySelector('.ant-form');

// 递归查找所有可交互控件
inputs = formArea.querySelectorAll('input, select, textarea');

for each input:
  label = 获取关联标签（preceding label/span 或 aria-label）
  required = 标签旁有红色 * 或 required 属性或红色字体
  type = 根据 tag/type 判断（text/number/date/select/textarea）
  constraints = { maxlength, min, max, pattern }
  if select: options = 获取所有 option 的 text/value
```

输出字段清单：
```json
[
  { "label": "机构编码", "type": "text", "required": true, "constraints": { "maxlength": 20 } },
  { "label": "机构名称", "type": "text", "required": true, "constraints": { "maxlength": 100 } },
  { "label": "机构类型", "type": "select", "required": true, "options": ["总部", "分部", "门店"] },
  { "label": "联系电话", "type": "text", "required": false },
  { "label": "启用日期", "type": "date", "required": true }
]
```

### 第6步：测试数据生成

按字段类型生成测试数据：

| 字段类型 | 策略 | 用例数 |
|---------|------|--------|
| 必填校验 | 每个必填字段依次留空，其他填正常值，验证toast提示 | N |
| 全字段正常 | 所有字段填正常值，保存验证成功 | 1 |
| 下拉框 | 不选 + 每个选项独立测试（其他字段默认值） | N+1 |
| 文本框(文本) | 正常值 / 边界值(maxlength-1) / 超长(maxlength+10) / 特殊字符 | 4 |
| 文本框(数值) | 正常值 / min-1 / max+1 / 0 / 负数 | 4 |
| 日期 | 正常日期 / 边界日期 / 空值(必填) | 2-3 |
| 文本域 | 正常 / 超长(500+) / XSS注入 | 3 |

生成所有用例后，展示给用户勾选（默认全选）。

### 第7步：用户确认用例清单

展示格式：
```
📋 待执行用例（共 XX 条），请勾选要执行的用例：

☑ [#1] 必填校验-机构编码（留空）
☑ [#2] 必填校验-机构名称（留空）
☑ [#3] 全字段正常保存
☑ [#4] 下拉框-机构类型=总部
☑ [#5] 下拉框-机构类型=分部
...
```

用户确认后开始执行。

### 第8步：测试执行

对每条用例：
1. **重置页面**：刷新或返回后重新导航
2. **填值**：按用例数据填充各字段
3. **提交**：点击保存/提交按钮
4. **等待响应**：等待 toast / 页面跳转 / 错误提示
5. **截图**：保存当前页面截图
6. **判定**：
   - **通过**：toast"保存成功"、页面跳转到列表、无错误提示
   - **失败**：toast"请完善必填项"、校验错误提示、系统报错
   - **异常**：白屏、按钮loading卡死、超时

### 第9步：HTML报告生成

生成包含以下内容的报告：
- 执行汇总（总计/通过/失败/异常）
- 每条用例的详情（名称、步骤、截图、判定结果）
- 失败用例的错误信息

### 第10步：写入TAPD测试用例

调用 TAPD `/tcases` API，将每条测试用例写入 TAPD 用例库：
- 标题 = 用例名称
- 步骤 = 填充的字段值
- 预期 = 预期的验证结果
- 关联需求 = story_id

### 第11步：用户确认缺陷

对失败的用例，逐一展示给用户确认：
```
❌ [#4] 下拉框-机构类型=总部
  步骤：选择机构类型=总部 → 点击保存
  截图：[截图]
  期望：保存成功
  实际：页面报错 "XXX字段不能为空"

  这是缺陷吗？(Y/N) [默认 N]
```

### 第12步：自动提Bug

用户确认是缺陷后：
1. 查询需求关联的开发任务 → 取任务 `owner` 作为Bug处理人
2. 用户确认关联需求
3. 计算预期修复时间 = 当前日期 + 2工作日（跳过周末）
4. 提交Bug到TAPD：
   - 标题、步骤、期望vs实际
   - 截图
   - 处理人 = 开发任务owner
   - 关联需求 = story_id
   - 预期修复时间

## TAPD API 参考

### 获取开发任务处理人

```bash
curl.exe -H "Authorization: Bearer {token}" \
  "https://api.tapd.cn/tasks?workspace_id={ws}&story_id={story_id}&fields=id,name,owner"
```

### 写入测试用例

```bash
curl.exe -H "Authorization: Bearer {token}" \
  --data-urlencode "workspace_id={ws}" \
  --data-urlencode "title={用例名称}" \
  --data-urlencode "precondition={前置条件}" \
  --data-urlencode "steps={操作步骤}" \
  --data-urlencode "expectation={预期结果}" \
  --data-urlencode "story_id={story_id}" \
  "https://api.tapd.cn/tcases"
```

### Bug提交 + 关联需求 + 开发任务

见 `tapd-bug/SKILL.md` 的完整API调用方式。

## 配置

`config.json` 通过 `_extends` 引用 `_shared/tapd-config.json`。

## 注意事项

1. 浏览器使用 playwright-mind 的 node_modules 中的 Playwright
2. 登录复用 dom-recorder 的 perform-login-lite.ts 逻辑
3. 滑块验证码需要 Python + OpenCV 环境
4. 每条用例间重置页面，避免状态污染
5. 截图保存在 `screenshots/` 目录，HTML报告引用相对路径
6. Bug提报前必须经用户确认
7. 处理人从 TAPD 开发任务自动获取
8. 预期修复时间跳过周末
