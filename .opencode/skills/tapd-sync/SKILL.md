---
name: tapd-sync
description: >
  读取 Playwright 测试结果，回写 TAPD 用例状态，失败用例自动提 Bug 并关联 story_id。
  触发词：/tapd-sync、同步结果、回写测试结果、tapd同步。
  当用户提到"同步测试结果"、"回写用例状态"、"测试结果上传到tapd"等涉及结果同步的请求时，必须使用此 Skill。
---

## 功能概述

本 Skill 读取 Playwright（auto-test-runner）的测试结果，将结果映射到 TAPD 测试用例，回写用例执行状态（通过/不通过/阻塞），并为失败用例自动创建 Bug 并关联到对应需求（story_id）。

## 触发方式

### 命令式

```
/tapd-sync --plan=xxx             # 指定测试计划ID同步结果
/tapd-sync --plan=xxx --story=yyy # 指定计划ID和需求ID
```

### 对话式

用户说类似："帮我同步测试结果"、"回写用例状态到TAPD"、"把测试结果上传"。

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
  "test_results_dir": "",
  "case_map_file": ".tapd-case-map.json"
}
```

> **注意**：`test_results_dir` 为测试结果目录路径（默认为 auto-test-runner 的 test-results 目录）。`case_map_file` 为用例映射文件名，用于测试文件名到 TAPD 用例 ID 的映射。

## 工作流

### 第一步：读取测试结果

1. 读取配置中的 `test_results_dir` 目录下的测试结果文件
2. auto-test-runner 的结果格式：`test-results/report/` 目录下的 HTML 报告和 JSON 结果
3. 解析每个测试用例的执行结果：pass / fail / skip / timeout
4. 统计汇总：总计、通过、失败、跳过、超时

### 第二步：映射用例到 TAPD

使用三级映射策略将测试结果映射到 TAPD 用例：

#### 优先级 1：映射文件（.tapd-case-map.json）

映射文件格式：

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

精确匹配，可靠性最高。

#### 优先级 2：用例名称模糊匹配

如果映射文件中没有对应条目，使用测试名称与 TAPD 用例标题进行模糊匹配：

```bash
curl.exe -u 'api_user:api_password' "{api_url}/tcases?workspace_id={workspace_id}&name=登录-正常登录验证"
```

匹配规则：
- 测试文件名中的关键部分与 TAPD 用例标题相似度 ≥ 80%
- 优先匹配同一模块下的用例

#### 优先级 3：跳过并记录

如果以上两种方式都无法匹配，记录到日志并跳过：

```
⚠️ 无法映射测试用例: login-timeout.spec.ts → 未找到匹配的 TAPD 用例
   建议手动在 .tapd-case-map.json 中添加映射
```

### 第三步：回写用例执行状态

对每个已映射的用例，调用 TAPD API 回写执行结果：

```bash
curl.exe -u 'api_user:api_password' \
  -X POST \
  -d "workspace_id={workspace_id}&case_id={case_id}&plan_id={plan_id}&result={result}&runner={runner}" \
  "{api_url}/test_plans/run_case"
```

result 映射表：

| 测试结果 | TAPD result | 说明 |
|---------|------------|------|
| pass | `pass` | 测试通过 |
| fail | `no_pass` | 测试失败 |
| skip | `block` | 测试阻塞 |
| timeout | `block` | 测试超时 |

### 第四步：失败用例自动创建 Bug

对每个失败（fail）的用例，自动创建 Bug：

```bash
curl.exe -u 'api_user:api_password' \
  -X POST \
  -d "workspace_id={workspace_id}&title=[自动] {test_name} 测试失败&severity=一般&priority_label=中&module={module}&description={失败详情}&testtype=功能测试&testphase=功能测试阶段" \
  "{api_url}/bugs"
```

Bug 标题格式：`[自动] {用例名称} 测试失败`

Bug 描述包含：
- 测试用例名称和 ID
- 失败的错误信息
- 测试执行时间
- TAPD 用例链接

### 第五步：关联 Bug 到需求和用例

Bug 创建成功后，进行两个关联：

1. **Bug 关联需求**（如果 story_id 已知）：

```bash
curl.exe -u 'api_user:api_password' \
  -X POST \
  -d "workspace_id={workspace_id}&bug_id={bug_id}&story_id={story_id}" \
  "{api_url}/bugs/linked_stories"
```

2. **Bug 关联用例**：

```bash
curl.exe -u 'api_user:api_password' \
  -X POST \
  -d "workspace_id={workspace_id}&source_type=bug&source_id={bug_id}&target_type=tcase&target_id={case_id}" \
  "{api_url}/relations"
```

**关键**：每个 Bug 都必须通过 story_id 关联到需求，确保全链路追溯。

### 第六步：生成同步汇总报告

```
📊 测试结果同步报告
━━━━━━━━━━━━━━━━━━━━
📋 测试计划: {plan_name} ({plan_id})
📐 关联需求: S-{story_id}

✅ 通过: 20 条
❌ 失败: 3 条
⚠️ 阻塞: 2 条
⏭️ 跳过: 1 条（未找到映射）

🔗 已回写 TAPD 用例状态: 25 条
📝 已创建 Bug: 3 条
  - BUG-{id1}: [自动] 登录-密码错误提示 测试失败
  - BUG-{id2}: [自动] 首页-数据加载超时 测试失败
  - BUG-{id3}: [自动] 订单-列表分页异常 测试失败
📎 已关联需求: 3 条 Bug → S-{story_id}

⚠️ 未映射: 1 条
  - login-timeout.spec.ts → 建议手动添加映射
```

## 错误处理

| 场景 | 处理方式 |
|------|---------|
| 映射文件不存在 | 使用优先级 2（模糊匹配）和优先级 3（跳过） |
| TAPD 用例 ID 无效 | 跳过该用例，记录到日志 |
| Bug 创建失败 | 记录失败原因，提供手动创建指引 |
| 关联失败 | 记录关联失败的 Bug/用例 ID，提供手动关联指引 |
| 计划 ID 缺失 | 提示用户指定 --plan 参数或创建新计划 |

## TAPD API 参考

详细 API 文档请参考 `references/api-reference.md`，重点包含：
- POST /test_plans/run_case — 回写用例执行结果
- POST /bugs — 创建 Bug
- POST /bugs/linked_stories — Bug 关联需求
- POST /relations — Bug 关联用例

## 用例映射文件 (.tapd-case-map.json)

映射文件用于精确定位测试文件与 TAPD 用例的对应关系。当新增测试用例时，应在映射文件中添加对应条目。

文件位置：项目根目录下的 `.tapd-case-map.json`（可通过 config.json 的 `case_map_file` 字段自定义）。

## 与其他 Skill 的协作

- **auto-test-runner**：读取其输出的测试结果
- **tapd-gen**：使用其生成的用例 ID 作为映射基础
- **tapd-bug**：失败用例自动调用 Bug 创建流程
- **tapd-notify**：同步完成后可推送通知到企业微信
- **tapd-test**：作为全流程编排的第四个环节

## 注意事项

1. 三级映射策略确保最大覆盖率：精确映射 > 模糊匹配 > 跳过记录
2. 所有自动创建的 Bug 都携带 `[自动]` 前缀标识
3. Bug 关联 story_id 是必须的，确保全链路追溯
4. 映射文件 `.tapd-case-map.json` 建议加入版本控制
5. Windows 环境下使用 `curl.exe` 而非 `curl`（PowerShell 别名）