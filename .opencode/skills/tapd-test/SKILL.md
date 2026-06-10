---
name: tapd-test
description: 全流程 TAPD 测试自动化编排，串联需求分析→用例生成→测试执行→结果同步→通知推送。触发词：/tapd-test、全流程测试、tapd测试。当用户提到"开始测试流程"、"全流程跑一遍"、"tapd自动化测试"等涉及全流程测试的请求时，必须使用此 Skill。
metadata:
  audience: testers
  workflow: tapd
---

## 功能概述

本 Skill 是 TAPD 测试全流程的编排器，串联以下 5 个子 Skill：

1. **tapd-analyze** — 需求分析：从 TAPD 拉取需求，AI 分析功能点和测试重点
2. **tapd-gen** — 用例生成：AI 生成测试用例并写入 TAPD，关联到需求
3. **auto-test-runner** — 测试执行：运行 .spec.ts 测试文件（外部触发）
4. **tapd-sync** — 结果同步：回写测试结果到 TAPD，失败用例自动创建 Bug
5. **tapd-notify** — 通知推送：推送测试报告到企业微信

数据流以 **story_id** 为锚点，贯穿全链路：Story → TestPlan → Tcase → Bug

## 触发方式

### 全流程模式

```
/tapd-test S-xxx --full          # 全流程：分析→生成→（手动执行）→同步→通知
/tapd-test S-xxx --full --auto    # 全流程自动模式（跳过用例审核）
```

### 单步模式

```
/tapd-test analyze S-xxx          # 只执行需求分析
/tapd-test gen S-xxx              # 只执行用例生成
/tapd-test run                    # 提示执行测试（手动运行 auto-test-runner）
/tapd-test sync --plan=xxx        # 只执行结果同步
/tapd-test notify --type=result   # 只推送通知
```

## 配置文件

本 Skill 依赖 `config.json`，通过 `_extends` 引用共享凭证，自身包含所有子 Skill 的融合字段：

```json
{
  "_extends": "../_shared/tapd-config.json",
  "wechat_webhook_url": "",
  "wechat_mentioned_list": [],
  "wechat_mentioned_mobile_list": [],
  "auto_upload": false,
  "test_results_dir": "",
  "case_map_file": ".tapd-case-map.json"
}
```

> **共享凭证**：所有 TAPD Skill 的共用字段统一在 `_shared/tapd-config.json` 管理。此配置是所有子 Skill 配置的合集，各子 Skill 只读取自己需要的字段。

## 全流程工作流

### 第一步：需求分析（tapd-analyze）

1. 读取 config.json 获取 TAPD 凭证
2. 验证 TAPD API 连通性
3. 根据 story_id 拉取需求详情
4. AI 分析需求，输出结构化报告
5. 报告包含：功能点列表、测试范围、风险等级、验收标准
6. 保存分析结果到状态文件

### 第二步：用例生成（tapd-gen）

1. 接收 tapd-analyze 的 JSON 输出
2. AI 为每个功能点生成测试用例（正面 + 反面 + 交互）
3. 默认模式下展示用例列表供用户审核
4. `--auto` 模式跳过审核直接上传
5. 创建测试计划（命名格式：`TP_S{story_id}_{序号}`）→ 逐个创建用例 → 关联到计划 → 关联到需求
6. 保存用例 ID 列表到状态文件

### 第三步：测试执行（auto-test-runner）

> **注意**：测试执行需要用户手动触发，本 Skill 只提供指引。

1. 提示用户运行 auto-test-runner 执行 .spec.ts 测试文件
2. 提供运行命令：`npx tsx scripts/run-tests.ts`
3. 等待用户确认执行完成
4. 用户确认后继续下一步

### 第四步：结果同步（tapd-sync）

1. 读取 Playwright 测试结果
2. 通过 .tapd-case-map.json 映射测试文件到 TAPD 用例
3. 回写用例执行状态到 TAPD（pass/no_pass/block）
4. 失败用例自动创建 Bug 并关联到需求
5. 保存同步结果和 Bug ID 列表到状态文件

### 第五步：通知推送（tapd-notify）

1. 根据流程进度推送对应类型的通知到企业微信
2. 分析完成 → ANALYSIS_COMPLETE
3. 计划创建 → TEST_PLAN_CREATED
4. 执行完成 → TEST_EXECUTION_COMPLETE
5. 新 Bug → NEW_BUG
6. 严重 Bug → CRITICAL_BUG

## 数据流

```
story_id
   │
   ├─→ tapd-analyze
   │     └─→ analyze_result (JSON)
   │           │
   ├─→ tapd-gen
   │     ├─→ test_plan_id
   │     ├─→ case_ids[]
   │     └─→ analyze_result.story_id → 每个用例关联
   │           │
   ├─→ auto-test-runner (手动)
   │     └─→ test_results/
   │           │
   ├─→ tapd-sync
   │     ├─→ execution_results (pass/no_pass/block)
   │     └─→ bug_ids[] (每个Bug关联story_id)
   │           │
   └─→ tapd-notify
         └─→ 企业微信通知
```

**全链路追溯**：Story → TestPlan → Tcase → Bug，每个环节都通过 story_id 串联。

## 状态管理

全流程使用状态文件 `.tapd-test-state.json` 保存进度，支持中断后恢复：

```json
{
  "story_id": "S-1120003271001000123",
  "current_step": "sync",
  "analyze_result": { ... },
  "plan_id": "1120003271001002001",
  "case_ids": ["1120003271001005001", "1120003271001005002"],
  "bug_ids": ["1120003271001003001"],
  "sync_summary": { ... },
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-15T15:45:00Z"
}
```

### 恢复机制

如果流程中断（网络错误、用户中断、API 限流等）：

1. 读取 `.tapd-test-state.json` 获取当前步骤和数据
2. 如果 `current_step` 为 `gen`，从用例生成步骤恢复
3. 如果 `current_step` 为 `sync`，从结果同步步骤恢复
4. 已完成的步骤不会重复执行

### 恢复命令

```
/tapd-test S-xxx --resume    # 从中断处恢复
/tapd-test S-xxx --restart   # 从头开始（清除状态）
```

## 子 Skill 引用

| 子 Skill | 触发词 | 输入 | 输出 |
|---------|--------|------|------|
| tapd-analyze | /tapd-analyze S-xxx | story_id | analyze_result JSON |
| tapd-gen | /tapd-gen S-xxx | analyze_result JSON | plan_id, case_ids |
| auto-test-runner | 外部触发 | .spec.ts 文件 | test_results/ |
| tapd-sync | /tapd-sync --plan=xxx | test_results, plan_id | execution_results, bug_ids |
| tapd-notify | /tapd-notify --type=xxx | 通知数据 | 企业微信消息 |

## 错误处理

| 场景 | 处理方式 |
|------|---------|
| 分析步骤失败 | 保存状态，提示用户检查 story_id 和 API 连通性 |
| 用例生成失败 | 保存状态，提示用户重试或调整分析结果 |
| 测试执行超时 | 提示用户手动执行 auto-test-runner |
| 同步步骤失败 | 保存状态，记录已同步的用例，支持部分恢复 |
| 通知推送失败 | 记录失败原因，不影响主流程 |
| API 限流 | 等待 200ms 后重试 |
| state 文件损坏 | 提示用户使用 --restart 重新开始 |

## 与其他 Skill 的协作

本 Skill 是全流程编排器，串联以下子 Skill：

- **tapd-analyze** — 需求分析（第一步）
- **tapd-gen** — 用例生成（第二步）
- **auto-test-runner** — 测试执行（第三步，外部触发）
- **tapd-sync** — 结果同步（第四步）
- **tapd-notify** — 通知推送（第五步）
- **tapd-bug** — Bug 提交（tapd-sync 内部调用）

## 注意事项

1. 全流程以 story_id 为锚点，每个环节都通过 story_id 关联
2. state 文件 `.tapd-test-state.json` 保存进度，支持中断恢复
3. 测试执行需要用户手动触发，本 Skill 只提供指引
4. 默认模式需要用户确认每个步骤，`--auto` 模式自动执行
5. 所有子 Skill 读取同一个 config.json
6. Windows 环境下使用 `curl.exe` 而非 `curl`（PowerShell 别名）