# TAPD 测试执行结果与 Bug API 参考

> 本文档为 tapd-sync Skill 专用，重点覆盖测试执行结果回写和 Bug 创建相关 API。
> 完整 API 参考请查阅 `../tapd-analyze/references/api-reference.md`。

---

## 1. 测试执行结果 API

### 1.1 回写用例执行结果

```
POST {api_url}/test_plans/run_case
```

**必填参数**：

| 参数 | 说明 | 可选值 |
|------|------|--------|
| `workspace_id` | 项目ID | - |
| `case_id` | 测试用例ID | - |
| `plan_id` | 测试计划ID | - |
| `result` | 执行结果 | `pass`, `no_pass`, `block` |

**可选参数**：

| 参数 | 说明 |
|------|------|
| `description` | 执行说明/备注 |
| `runner` | 执行人 |
| `spent_time` | 耗时（小时） |

**示例**：

```bash
# 用例通过
curl.exe -u 'api_user:api_password' \
  -X POST \
  -d "workspace_id={workspace_id}&case_id={case_id}&plan_id={plan_id}&result=pass&runner=zhangsan&spent_time=0.1" \
  "{api_url}/test_plans/run_case"

# 用例失败
curl.exe -u 'api_user:api_password' \
  -X POST \
  -d "workspace_id={workspace_id}&case_id={case_id}&plan_id={plan_id}&result=no_pass&runner=zhangsan&description=断言失败：登录按钮点击无响应" \
  "{api_url}/test_plans/run_case"
```

### 1.2 获取执行结果

```
GET {api_url}/test_plans/run_case?workspace_id={workspace_id}&plan_id={plan_id}&case_id={case_id}
```

### 1.3 测试结果映射

| Playwright 结果 | TAPD result | 说明 |
|-----------------|------------|------|
| passed | `pass` | 测试通过 |
| failed | `no_pass` | 测试失败 |
| skipped | `block` | 测试阻塞 |
| timedOut | `block` | 测试超时 |

---

## 2. Bug 创建 API

### 2.1 创建 Bug

```
POST {api_url}/bugs
```

**必填参数**：

| 参数 | 说明 | 示例 |
|------|------|------|
| `workspace_id` | 项目ID | - |
| `title` | Bug标题（中文请用 --data-urlencode） | `[自动] 接口抓取正常验证 测试失败` |

**可选参数**：

| 参数 | 说明 | 示例 |
|------|------|------|
| `description` | 详细描述（支持HTML） | HTML格式的结构化描述 |
| `severity` | 严重程度 | `致命/严重/一般/轻微` |
| `priority_label` | 优先级 | `高/中/低` |
| `module` | 模块 | `接口测试` |
| `current_owner` | 处理人（**使用real_user**） | `刘晓康` |
| `reporter` | 报告人（**自动为API账号，不可覆盖**） | - |
| `testtype` | 测试类型 | `功能测试` |
| `testphase` | 测试阶段 | `功能测试阶段` |

> **重要**：
> - `current_owner`（处理人）必须使用 `config.json` 中的 `real_user`，而非 API 账号
> - `reporter`/`creator` 由 API 自动设置为 API 账号名，无法覆盖
> - 中文字段（title、description、module 等）通过 `curl.exe --data-urlencode` 传入避免乱码

**示例**：

```bash
curl.exe -u 'api_user:api_password' \
  --data-urlencode "workspace_id={workspace_id}" \
  --data-urlencode "title=[自动] 接口抓取正常验证 测试失败" \
  --data-urlencode "severity=严重" \
  --data-urlencode "priority_label=高" \
  --data-urlencode "module=接口测试" \
  --data-urlencode "current_owner=刘晓康" \
  --data-urlencode "description=<p>HTML格式的描述</p>" \
  --data-urlencode "testtype=功能测试" \
  --data-urlencode "testphase=功能测试阶段" \
  "{api_url}/bugs"
```

**自动创建 Bug 的描述模板**（HTML 格式，TAPD 支持渲染）：

```html
<p><strong>【自动提交】</strong>由 tapd-sync Skill 根据测试结果自动创建</p>
<hr/>
<table border='1' cellpadding='6' cellspacing='0' style='border-collapse:collapse;width:100%'>
<tr><td style='background:#f0f0f0;width:120px'><b>测试用例</b></td><td>{用例名称} ({用例ID})</td></tr>
<tr><td style='background:#f0f0f0'><b>测试计划</b></td><td>{计划名称} ({计划ID})</td></tr>
<tr><td style='background:#f0f0f0'><b>关联需求</b></td><td><a href='https://www.tapd.cn/{workspace_id}/prong/stories/view/{story_id}'>S-{story_id}</a></td></tr>
</table>
<h3>🔴 失败信息</h3>
<p>{错误信息}</p>
<h3>📋 复现步骤</h3>
<ol>
<li>{步骤1}</li>
<li>{步骤2}</li>
</ol>
<h3>✅ 预期结果</h3>
<p>{预期结果}</p>
<h3>❌ 实际结果</h3>
<p>{实际结果}</p>
<hr/>
<p style='color:#888'>执行时间：{execution_time} | 执行人：{real_user} | 生成工具：tapd-sync Skill</p>
```

> **重要**：Bug 描述使用 HTML 格式可让 TAPD 详情页展示美观的表格和分区。中文字段通过 `curl.exe --data-urlencode` 传入。

---

## 3. 关联 API

### 3.1 Bug 关联需求

```
POST {api_url}/bugs/linked_stories
```

**参数**：

| 参数 | 说明 |
|------|------|
| `workspace_id` | 项目ID |
| `bug_id` | Bug ID |
| `story_id` | 需求ID |

### 3.2 Bug 关联用例

```
POST {api_url}/relations
```

**参数**：

| 参数 | 说明 | 示例 |
|------|------|------|
| `workspace_id` | 项目ID | - |
| `source_type` | 源类型 | `bug` |
| `source_id` | 源ID | Bug ID |
| `target_type` | 目标类型 | `tcase` |
| `target_id` | 目标ID | 用例ID |

---

## 4. 用例映射文件格式

### .tapd-case-map.json

```json
{
  "login.spec.ts": {
    "tapd_case_id": "1120003271001000501",
    "story_id": "1120003271001000123",
    "test_name": "登录-正常登录验证"
  },
  "login-error.spec.ts": {
    "tapd_case_id": "1120003271001000502",
    "story_id": "1120003271001000123",
    "test_name": "登录-密码错误提示"
  }
}
```

**字段说明**：

| 字段 | 说明 | 必填 |
|------|------|------|
| `tapd_case_id` | TAPD 测试用例 ID | 是 |
| `story_id` | 关联的需求 ID | 是 |
| `test_name` | TAPD 用例名称（用于模糊匹配校验） | 否 |