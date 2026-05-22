# TAPD API 参考文档

> 本文档供所有 TAPD Skills 共享，涵盖需求、测试用例、测试计划、Bug、关系等核心 API。
> 环境要求：Windows 下使用 `curl.exe`（非 PowerShell 别名 `curl`），或 Git Bash / WSL 下使用 `curl`。

---

## 1. 通用约定

### 1.1 认证方式

所有 TAPD API 使用 HTTP Basic Auth：

```bash
curl.exe -u 'api_user:api_password' ...
```

- `api_user` 和 `api_password` 从各 Skill 目录下的 `config.json` 读取
- `api_url` 默认为 `https://api.tapd.cn`，私有化部署项目需在 `config.json` 中修改

### 1.2 请求格式

| 操作 | HTTP 方法 | Content-Type |
|------|-----------|-------------|
| 查询 | GET | - |
| 创建 | POST | `application/x-www-form-urlencoded` |
| 更新 | POST | `application/x-www-form-urlencoded` |

### 1.3 响应格式

```json
{
  "status": 1,
  "data": { ... },
  "info": "success"
}
```

- `status`: 1=成功，其他=失败
- `data`: 返回数据
- `info`: 状态描述

### 1.4 分页

列表接口支持分页参数：

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `limit` | 每页条数 | 30 |
| `page` | 页码 | 1 |

### 1.5 限流

TAPD API 限流规则：每个 workspace 每秒最多 5 次请求。建议每次调用后间隔 200ms。

---

## 2. Stories 需求 API

### 2.1 获取需求列表

```
GET {api_url}/stories?workspace_id={workspace_id}
```

**常用过滤参数**：

| 参数 | 说明 | 示例 |
|------|------|------|
| `id` | 需求ID | `1120003271001000123` |
| `name` | 标题（模糊匹配） | `登录功能` |
| `status` | 状态 | `new`, `in_progress`, `resolved`, `closed` |
| `priority` | 优先级 | `1=紧急`, `2=高`, `3=中`, `4=低` |
| `owner` | 处理人 | `zhangsan` |
| `created` | 创建时间 | `2025-01-01` 或 `2025-01-01..2025-01-31` |
| `category_id` | 分类ID | - |

### 2.2 获取单个需求

```
GET {api_url}/stories/{story_id}?workspace_id={workspace_id}
```

**返回字段**：

| 字段 | 说明 |
|------|------|
| `id` | 需求ID |
| `name` | 标题 |
| `description` | 详细描述（HTML） |
| `status` | 状态 |
| `priority` | 优先级 |
| `owner` | 处理人 |
| `category_id` | 分类 |
| `created` | 创建时间 |
| `modified` | 修改时间 |

### 2.3 获取需求自定义字段

```
GET {api_url}/workspaces/custom_fields_config?workspace_id={workspace_id}&type=story
```

---

## 3. Test Cases 测试用例 API

### 3.1 获取测试用例列表

```
GET {api_url}/tcases?workspace_id={workspace_id}
```

**常用过滤参数**：

| 参数 | 说明 | 示例 |
|------|------|------|
| `id` | 用例ID | - |
| `name` | 用例名称 | - |
| `status` | 状态 | `normal`, `obsoleted` |
| `priority` | 优先级 | `1=紧急`, `2=高`, `3=中`, `4=低` |
| `category_id` | 分类ID | - |
| `module` | 模块 | - |

### 3.2 创建测试用例

```
POST {api_url}/tcases
```

**必填参数**：

| 参数 | 说明 | 示例 |
|------|------|------|
| `workspace_id` | 项目ID | - |
| `name` | 用例名称 | `登录-正常登录验证` |
| `category_id` | 分类ID | - |

**可选参数**：

| 参数 | 说明 | 示例 |
|------|------|------|
| `description` | 步骤描述 | - |
| `priority` | 优先级 | `1/2/3/4` |
| `status` | 状态 | `normal`（默认） |
| `module` | 模块 | `登录` |
| `owner` | 处理人 | - |

### 3.3 批量创建测试用例

```
POST {api_url}/tcases/batch_save
```

**参数**：

| 参数 | 说明 |
|------|------|
| `workspace_id` | 项目ID |
| `data` | JSON 数组，每项包含 name、description、priority、category_id 等 |

**示例**：

```bash
curl.exe -u 'api_user:api_password' \
  -X POST \
  -d "workspace_id=xxx" \
  --data-urlencode "data=[{\"name\":\"用例1\",\"description\":\"步骤1\n步骤2\",\"priority\":\"3\",\"category_id\":\"1\"},{\"name\":\"用例2\",\"description\":\"步骤1\",\"priority\":\"3\",\"category_id\":\"1\"}]" \
  "{api_url}/tcases/batch_save"
```

### 3.4 获取用例自定义字段

```
GET {api_url}/workspaces/custom_fields_config?workspace_id={workspace_id}&type=tcase
```

---

## 4. Test Plans 测试计划 API

### 4.1 获取测试计划列表

```
GET {api_url}/test_plans?workspace_id={workspace_id}
```

### 4.2 创建测试计划

```
POST {api_url}/test_plans
```

**必填参数**：

| 参数 | 说明 |
|------|------|
| `workspace_id` | 项目ID |
| `name` | 计划名称 |

**可选参数**：

| 参数 | 说明 |
|------|------|
| `description` | 描述 |
| `owner` | 负责人 |
| `begin_date` | 开始日期 |
| `due_date` | 截止日期 |

### 4.3 获取测试计划进展

```
GET {api_url}/test_plans/progress?workspace_id={workspace_id}&plan_id={plan_id}
```

**返回**：

```json
{
  "status": 1,
  "data": {
    "total": 30,
    "pass": 20,
    "no_pass": 5,
    "block": 3,
    "no_run": 2
  }
}
```

### 4.4 获取测试计划详情

```
GET {api_url}/test_plans/details?workspace_id={workspace_id}&plan_id={plan_id}
```

---

## 5. Test Results 测试执行结果 API

### 5.1 提交测试执行结果

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

### 5.2 获取测试执行结果

```
GET {api_url}/test_plans/run_case?workspace_id={workspace_id}&plan_id={plan_id}&case_id={case_id}
```

---

## 6. Bugs 缺陷 API

### 6.1 获取 Bug 列表

```
GET {api_url}/bugs?workspace_id={workspace_id}
```

**常用过滤参数**：

| 参数 | 说明 |
|------|------|
| `id` | Bug ID |
| `title` | 标题 |
| `status` | 状态 |
| `severity` | 严重程度 |
| `priority_label` | 优先级标签 |

### 6.2 创建 Bug

```
POST {api_url}/bugs
```

**必填参数**：

| 参数 | 说明 | 示例 |
|------|------|------|
| `workspace_id` | 项目ID | - |
| `title` | Bug标题 | `登录按钮点击无响应` |

**可选参数**：

| 参数 | 说明 | 示例 |
|------|------|------|
| `description` | 详细描述 | - |
| `severity` | 严重程度 | `致命/严重/一般/轻微` |
| `priority_label` | 优先级 | `高/中/低` |
| `module` | 模块 | `登录` |
| `current_owner` | 处理人 | - |
| `testtype` | 测试类型 | `功能测试` |
| `testphase` | 测试阶段 | `功能测试阶段` |

### 6.3 获取 Bug 关联的需求

```
GET {api_url}/bugs/linked_stories?workspace_id={workspace_id}&bug_id={bug_id}
```

### 6.4 获取 Bug 关联的用例

```
GET {api_url}/bugs/linked_tcases?workspace_id={workspace_id}&bug_id={bug_id}
```

---

## 7. Relations 关系 API

### 7.1 创建关系

```
POST {api_url}/relations
```

**参数**：

| 参数 | 说明 | 示例 |
|------|------|------|
| `workspace_id` | 项目ID | - |
| `source_type` | 源实体类型 | `story`, `bug`, `tcase` |
| `source_id` | 源实体ID | - |
| `target_type` | 目标实体类型 | `story`, `bug`, `tcase` |
| `target_id` | 目标实体ID | - |

**常用关系类型**：

| 关系 | source_type | target_type | 说明 |
|------|------------|-------------|------|
| 用例关联需求 | `tcase` | `story` | 测试用例关联到需求 |
| Bug关联需求 | `bug` | `story` | Bug关联到需求 |
| Bug关联用例 | `bug` | `tcase` | Bug关联到测试用例 |

### 7.2 Story 关联 Test Case（专用接口）

```
POST {api_url}/stories/create_story_tcase
```

**参数**：

| 参数 | 说明 |
|------|------|
| `workspace_id` | 项目ID |
| `story_id` | 需求ID |
| `tcase_id` | 测试用例ID |

### 7.3 Test Plan 关联 Test Case

```
POST {api_url}/test_plans/create_tcase_relation
```

**参数**：

| 参数 | 说明 |
|------|------|
| `workspace_id` | 项目ID |
| `plan_id` | 测试计划ID |
| `tcase_id` | 测试用例ID（多个用逗号分隔） |

### 7.4 Test Plan 关联 Story

```
POST {api_url}/test_plans/create_story_plan_relation
```

**参数**：

| 参数 | 说明 |
|------|------|
| `workspace_id` | 项目ID |
| `plan_id` | 测试计划ID |
| `story_id` | 需求ID |

### 7.5 Bug 关联 Story（专用接口）

```
POST {api_url}/bugs/linked_stories
```

**参数**：

| 参数 | 说明 |
|------|------|
| `workspace_id` | 项目ID |
| `bug_id` | Bug ID |
| `story_id` | 需求ID |

### 7.6 删除用例与需求的关联

```
POST {api_url}/tcases/delete_tcase_story_relation
```

**参数**：

| 参数 | 说明 |
|------|------|
| `workspace_id` | 项目ID |
| `tcase_id` | 用例ID |
| `story_id` | 需求ID |

---

## 8. Custom Fields 自定义字段 API

### 8.1 获取自定义字段配置

```
GET {api_url}/workspaces/custom_fields_config?workspace_id={workspace_id}&type={entity_type}
```

**entity_type 可选值**：`story`, `tcase`, `bug`, `task`

**返回示例**：

```json
{
  "status": 1,
  "data": [
    {
      "custom_field": "custom_field_one",
      "name": "测试级别",
      "type": "select",
      "options": ["P0-冒烟", "P1-核心", "P2-常规"]
    }
  ]
}
```

---

## 9. 连接测试

验证 TAPD API 连通性：

```bash
curl.exe -u 'api_user:api_password' "{api_url}/workspaces/projects?id={workspace_id}"
```

成功返回：

```json
{
  "status": 1,
  "data": [{ "id": "xxx", "name": "项目名称" }]
}
```

---

## 10. 常见错误码

| status | info | 说明 |
|--------|------|------|
| 1 | success | 成功 |
| -1 | Authentication failed | 认证失败，检查 api_user/api_password |
| -1 | Workspace not found | 项目不存在，检查 workspace_id |
| -1 | Rate limit exceeded | 限流，稍后重试 |
| -1 | Required field missing | 必填字段缺失 |
| -1 | Invalid field value | 字段值不合法 |

---

## 11. PowerShell 环境注意事项

Windows PowerShell 中 `curl` 是 `Invoke-WebRequest` 的别名，**不是真正的 curl**。

### 方法一：使用 `curl.exe`（推荐）

```powershell
curl.exe -u "api_user:api_password" -d "workspace_id=xxx&title=xxx" "{api_url}/bugs"
```

### 方法二：使用 `Invoke-RestMethod`

```powershell
$cred = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${api_user}:${api_password}"))
$headers = @{ Authorization = "Basic $cred" }
Invoke-RestMethod -Uri "{api_url}/bugs" -Method Post -Headers $headers -Body @{workspace_id="xxx";title="xxx"} -ContentType "application/x-www-form-urlencoded"
```

**推荐使用 `curl.exe`**，与 Bash 环境兼容且更直观。