---
name: tapd-gen
description: >
  AI 生成测试用例并写入 TAPD（含 story_id 关联），支持批量生成、分类标记和用户审核。
  触发词：/tapd-gen、生成用例、写测试用例、tapd生成用例。
  当用户提到"生成测试用例"、"为需求写用例"、"测试用例设计"等涉及用例生成的请求时，必须使用此 Skill。
---

## 功能概述

本 Skill 根据需求分析结果，AI 生成测试用例并写入 TAPD。支持正面用例、反面用例、交互用例三种类型，所有用例通过 story_id 关联到对应需求。

支持两种审核模式：
1. **默认模式**：生成后展示所有用例，用户确认后再上传到 TAPD
2. **自动模式**：`--auto` 标记，跳过审核直接上传（建议仅在准确度 ≥ 90% 时使用）

## 触发方式

### 命令式

```
/tapd-gen S-xxx                    # 分析需求并生成用例（需用户确认）
/tapd-gen S-xxx --auto             # 自动模式，跳过审核直接上传
```

### 对话式

用户说类似："帮我为 S-xxx 生成测试用例"、"给这个需求写用例"。

## 配置文件

本 Skill 依赖 `config.json`，需包含以下字段：

```json
{
  "workspace_id": "你的TAPD项目ID",
  "api_user": "你的API账号",
  "api_password": "你的API密码",
  "api_url": "https://api.tapd.cn",
  "defaults": {
    "priority_label": "中",
    "severity": "一般",
    "testtype": "功能测试",
    "testphase": "功能测试阶段"
  },
  "modules": ["登录", "注册", "首页", "订单管理", "用户中心", "设置", "报表", "其他"],
  "owner_list": [],
  "default_story_id": "",
  "auto_upload": false,
  "default_reviewer": ""
}
```

> **注意**：`auto_upload` 默认为 `false`，即默认需要用户确认后上传。`default_reviewer` 为默认评审人，可选。
> `api_url` 默认为 `https://api.tapd.cn`，私有化部署需修改为实际 API 地址。

## 工作流

### 第一步：接收需求分析结果

接收 tapd-analyze 的 JSON 输出，或直接根据 story_id 拉取需求信息。输入格式：

```json
{
  "story_id": "S-xxx",
  "story_name": "需求标题",
  "analysis_result": {
    "features": [...],
    "test_scope": { "in_scope": [...], "out_of_scope": [...] },
    "test_focus": [...]
  }
}
```

如果没有分析结果，自动拉取需求并分析。

### 第二步：AI 生成测试用例

基于需求分析结果，AI 为每个功能点生成测试用例。用例分为三类：

1. **正面用例**：验证功能正常工作的路径
2. **反面用例**：验证异常输入和边界条件
3. **交互用例**：验证与其他功能的交互场景

每个用例包含以下字段：

| 字段 | 说明 | 示例 |
|------|------|------|
| 编号 | 用例编号 | TC-001 |
| 标题 | 用例标题 | 登录-正常登录验证 |
| 前置条件 | 执行前提 | 用户已注册，账户状态正常 |
| 步骤 | 操作步骤 | 1. 打开登录页 2. 输入正确账号密码 3. 点击登录 |
| 预期结果 | 期望行为 | 登录成功，跳转到首页 |
| 优先级 | P0/P1/P2/P3 | P1 |
| 测试类型 | 功能/性能/安全 | 功能测试 |
| 执行方式 | auto/manual | 自动/手动 |

### 第三步：用户审核

**默认模式**（auto_upload=false）：
1. 展示所有生成的用例列表，按功能点分组
2. 用户可以：确认全部、确认部分（取消勾选不需要的）、修改后确认、取消
3. 用户确认后继续下一步

**自动模式**（auto_upload=true 或 --auto 标记）：
1. 跳过审核，直接进入下一步
2. 建议仅在 AI 用例生成准确度 ≥ 90% 时使用自动模式

### 第四步：创建测试计划

在 TAPD 中创建测试计划：

```bash
curl.exe -u 'api_user:api_password' \
  -X POST \
  -d "workspace_id={workspace_id}&name={story_name}-测试计划&description=需求ID: {story_id}" \
  "{api_url}/test_plans"
```

### 第五步：批量创建测试用例

使用 batch_save 接口批量创建测试用例：

```bash
curl.exe -u 'api_user:api_password' \
  -X POST \
  -d "workspace_id={workspace_id}" \
  --data-urlencode "data=[{用例数组JSON}]" \
  "{api_url}/tcases/batch_save"
```

每个用例数据格式：

```json
{
  "name": "登录-正常登录验证",
  "description": "前置条件：用户已注册\n步骤：1. 打开登录页 2. 输入账号密码 3. 点击登录",
  "priority": "1",
  "category_id": "分类ID",
  "module": "登录"
}
```

> **注意**：TAPD batch_save 单次最多 100 条用例，超过需分批上传。

### 第六步：关联用例到测试计划

```bash
curl.exe -u 'api_user:api_password' \
  -X POST \
  -d "workspace_id={workspace_id}&plan_id={plan_id}&tcase_id={case_id1},{case_id2},{case_id3}" \
  "{api_url}/test_plans/create_tcase_relation"
```

### 第七步：关联用例到需求

将每个测试用例关联到需求（story_id）：

```bash
curl.exe -u 'api_user:api_password' \
  -X POST \
  -d "workspace_id={workspace_id}&story_id={story_id}&tcase_id={case_id}" \
  "{api_url}/stories/create_story_tcase"
```

**关键**：所有用例必须通过 story_id 关联到需求，确保全链路追溯：Story → TestPlan → Tcase

### 第八步：输出汇总

生成汇总报告：

- ✅ 创建测试计划：`{plan_id}`，名称：`{plan_name}`
- ✅ 创建测试用例：`{count}` 条（正面 `{pos}` 条，反面 `{neg}` 条，交互 `{int}` 条）
- ✅ 关联用例到计划：`{plan_id}`
- ✅ 关联用例到需求：`{story_id}`（`{count}` 条用例）
- 📊 用例列表：
  - TC-001: 登录-正常登录验证 [P1, 正面] → `{case_id_1}`
  - TC-002: 登录-密码错误提示 [P1, 反面] → `{case_id_2}`
  - ...

## 错误处理

| 场景 | 处理方式 |
|------|---------|
| 分类 ID 不存在 | 提示用户先在 TAPD 中创建对应分类，或使用已有分类 |
| API 创建失败 | 展示失败原因（info 字段），提供重试选项 |
| 关联失败 | 记录关联失败的用例 ID，提供手动关联指引 |
| 用例数量超过限制 | TAPD batch_save 单次最多 100 条，自动分批上传 |
| story_id 无效 | 提示用户检查需求 ID，用例已创建但未关联 |

## TAPD API 参考

详细 API 文档请参考 `references/api-reference.md`，重点包含：
- POST /tcases — 创建单个测试用例
- POST /tcases/batch_save — 批量创建测试用例
- POST /test_plans — 创建测试计划
- POST /test_plans/create_tcase_relation — 关联用例到计划
- POST /stories/create_story_tcase — 关联用例到需求
- GET /workspaces/custom_fields_config — 获取用例自定义字段

## 与其他 Skill 的协作

- **tapd-analyze**：接收其 JSON 输出作为输入
- **nl-test-generator**：生成的用例可由 nl-test-generator 转为 .spec.ts 测试文件
- **auto-test-runner**：执行 .spec.ts 测试文件
- **tapd-sync**：同步执行结果并回写到 TAPD 用例状态
- **tapd-notify**：用例创建完成后可推送通知到企业微信
- **tapd-test**：作为全流程编排的第二个环节

## 注意事项

1. 默认必须用户确认后才上传用例到 TAPD（`auto_upload=false`）
2. 所有创建的用例都通过 story_id 关联到需求，确保全链路追溯
3. 用例优先级与需求优先级对齐：P0 需求生成 P0 用例，P1 生成 P1/P2 用例
4. 生成的 .spec.ts 测试文件由 nl-test-generator Skill 负责，本 Skill 只负责 TAPD 用例管理
5. Windows 环境下使用 `curl.exe` 而非 `curl`（PowerShell 别名）