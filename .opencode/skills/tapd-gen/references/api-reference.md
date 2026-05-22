# TAPD 测试用例与测试计划 API 参考

> 本文档为 tapd-gen Skill 专用，重点覆盖测试用例和测试计划相关 API。
> 完整 API 参考请查阅 `../tapd-analyze/references/api-reference.md`。

---

## 1. 测试用例 API

### 1.1 获取测试用例列表

```
GET {api_url}/tcases?workspace_id={workspace_id}
```

**常用参数**：

| 参数 | 说明 | 示例 |
|------|------|------|
| `id` | 用例ID | - |
| `name` | 用例名称（模糊匹配） | `登录` |
| `status` | 状态 | `normal`, `obsoleted` |
| `priority` | 优先级 | `1=紧急/2=高/3=中/4=低` |
| `category_id` | 分类ID | - |
| `module` | 模块 | `登录` |
| `limit` | 每页条数 | 200 |
| `page` | 页码 | 1 |

### 1.2 创建单个测试用例

```
POST {api_url}/tcases
```

**必填参数**：

| 参数 | 说明 |
|------|------|
| `workspace_id` | 项目ID |
| `name` | 用例名称（中文需用 --data-urlencode） |
| `category_id` | 分类ID |

**可选参数**：

| 参数 | 说明 | 示例 |
|------|------|------|
| `description` | 步骤描述（支持 `&#10;` 换行） | `前置条件：...&#10;步骤：1. ... 2. ...` |
| `priority` | 优先级 | `1/2/3/4` |
| `status` | 状态 | `normal`（默认） |
| `module` | 模块 | `接口测试` |
| `owner` | 处理人（使用 real_user） | `刘晓康` |

> **重要**：`owner` 设置为 `config.json` 中的 `real_user`（TAPD 真实用户名）。`creator` 由 API 自动设为 API 账号名，无法覆盖。中文字段通过 `--data-urlencode` 传入。

**示例**：

```bash
curl.exe -u 'api_user:api_password' \
  --data-urlencode "workspace_id={workspace_id}" \
  --data-urlencode "name=TC_S{story_id}_001_接口抓取正常验证" \
  --data-urlencode "category_id=1" \
  --data-urlencode "priority=1" \
  --data-urlencode "owner=刘晓康" \
  --data-urlencode "module=接口测试" \
  --data-urlencode "description=前置条件：系统已打开浏览器F12面板&#10;步骤：1. 打开系统页面 2. 开启Network面板 3. 执行业务操作" \
  "{api_url}/tcases"
```

### 1.3 批量创建测试用例

```
POST {api_url}/tcases/batch_save
```

**参数**：
- `workspace_id`：项目ID
- `data`：JSON 数组字符串，每项包含用例字段

**示例**：

```bash
curl.exe -u 'api_user:api_password' \
  -X POST \
  -d "workspace_id={workspace_id}" \
  --data-urlencode "data=[{\"name\":\"登录-正常登录验证\",\"description\":\"1. 打开登录页\n2. 输入正确账号密码\n3. 点击登录\",\"priority\":\"2\",\"category_id\":\"1\",\"module\":\"登录\"},{\"name\":\"登录-密码错误提示\",\"description\":\"1. 打开登录页\n2. 输入错误密码\n3. 点击登录\",\"priority\":\"2\",\"category_id\":\"1\",\"module\":\"登录\"}]" \
  "{api_url}/tcases/batch_save"
```

> **注意**：batch_save 单次最多 100 条用例，超过需分批上传。

### 1.4 获取用例自定义字段

```
GET {api_url}/workspaces/custom_fields_config?workspace_id={workspace_id}&type=tcase
```

---

## 2. 测试计划 API

### 2.1 获取测试计划列表

```
GET {api_url}/test_plans?workspace_id={workspace_id}
```

**常用参数**：

| 参数 | 说明 |
|------|------|
| `id` | 计划ID |
| `name` | 计划名称 |
| `status` | 状态（`open`, `closed`） |
| `owner` | 处理人 |

### 2.2 创建测试计划

```
POST {api_url}/test_plans
```

**必填参数**：

| 参数 | 说明 |
|------|------|
| `workspace_id` | 项目ID |
| `name` | 计划名称 |

**可选参数**：

| 参数 | 说明 | 示例 |
|------|------|------|
| `description` | 描述 | `需求ID: S-xxx` |
| `owner` | 负责人 | `zhangsan` |
| `begin_date` | 开始日期 | `2025-01-01` |
| `due_date` | 截止日期 | `2025-01-31` |

**示例**：

```bash
curl.exe -u 'api_user:api_password' \
  -X POST \
  -d "workspace_id={workspace_id}&name=TP_S1133671402001000032_202606010001&owner={real_user}&description=story_id:S-1133671402001000032" \
  "{api_url}/test_plans"
```

> **命名规范**：测试计划名称使用 `TP_S{story_id}_{序号}` 格式（如 `TP_S1133671402001000032_202606010001`），TP 为 Test Plan 缩写。
> **重要**：`owner` 必须设置为 TAPD 真实用户名（`real_user`），`creator` 由 API 自动设置为 API 账号名。

### 2.3 获取测试计划进展

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

### 2.4 关联用例到测试计划

```
POST {api_url}/test_plans/create_tcase_relation
```

**参数**：

| 参数 | 说明 | 注意 |
|------|------|------|
| `workspace_id` | 项目ID | 必填 |
| `test_plan_id` | 测试计划ID | 必填，注意是 `test_plan_id` 非非 `plan_id` |
| `tcase_ids` | 用例ID（多个用逗号分隔） | 必填，注意是 `tcase_ids`（复数，非 `tcase_id`） |
| `creator` | 创建人 | 必填，使用 `real_user`（TAPD 真实用户名） |

### 2.5 关联需求到测试计划

```
POST {api_url}/test_plans/create_story_plan_relation
```

**参数**：

| 参数 | 说明 |
|------|------|
| `workspace_id` | 项目ID |
| `plan_id` | 测试计划ID |
| `story_id` | 需求ID |

---

## 3. 关联 API

### 3.1 关联用例到需求

**推荐方式**：使用通用 Relations API（`stories/create_story_tcase` 在公有云版本可能返回 302）：

```
POST {api_url}/relations
```

**参数**：

| 参数 | 说明 | 示例 |
|------|------|------|
| `workspace_id` | 项目ID | - |
| `source_type` | 源类型 | `tcase` |
| `source_id` | 用例ID | - |
| `target_type` | 目标类型 | `story` |
| `target_id` | 需求ID | - |

**备选方式**（可能返回 302 重定向）：

```
POST {api_url}/stories/create_story_tcase
```

| 参数 | 说明 |
|------|------|
| `workspace_id` | 项目ID |
| `story_id` | 需求ID |
| `tcase_id` | 测试用例ID |

### 3.2 删除用例与需求的关联

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

## 4. 优先级映射

| TAPD Priority | 含义 | 对应用例级别 |
|---------------|------|------------|
| 1 | 紧急 | P0 - 冒烟测试 |
| 2 | 高 | P1 - 核心功能 |
| 3 | 中 | P2 - 常规功能 |
| 4 | 低 | P3 - 边缘场景 |