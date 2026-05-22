---
name: tapd-executor
description: 全流程 TAPD + 纯 Playwright 测试自动化编排器。串联需求分析(tapd-analyze) → 用例生成(tapd-gen) → 脚本组装(template-engine) → 测试执行(auto-test-runner) → 结果同步(tapd-sync) → 企微通知(tapd-notify)六个环节。触发词：/tapd-executor、全流程执行、自动化测试。当用户提到"全自动测试""端到端执行""一键测试"等涉及全流程自动化执行的请求时，必须使用此 Skill。
metadata:
  audience: testers
  workflow: test-automation
---

# TAPD Executor — 全流程自动化执行器

## 功能概述

本 Skill 是纯 Playwright 模式全流程编排器，串联 6 个子 Skill：

1. **tapd-analyze** — 需求分析：拉取 TAPD 需求，AI 分析功能点和测试重点
2. **tapd-gen** — 用例生成：生成标签化测试用例（含动作标签 `[导航]` `[点击]` `[断言]` 等）
3. **template-engine** — 脚本组装：匹配操作模板库，组装生成纯 Playwright .spec.ts
4. **auto-test-runner** — 测试执行：执行纯 Playwright 脚本（快 + 准）
5. **tapd-sync** — 结果同步：回写用例执行状态，失败自动提 Bug
6. **tapd-notify** — 企微通知：推送测试执行报告

## 与 tapd-test 的区别

| 特性 | tapd-test（旧） | tapd-executor（新） |
|------|----------------|-------------------|
| 脚本方式 | Midscene VLM（aiTap/aiInput） | 纯 Playwright Selector |
| 执行速度 | 慢（每步 200-500ms VLM 调用） | 快（毫秒级 DOM 操作） |
| 准确率 | 70-85% | 95%+ |
| 依赖 | VLM API Key + 截图 | 仅需操作模板库 |
| 模板复用 | 无 | 有，跨用例复用 |

## 触发方式

```
/tapd-executor S-xxx --full      # 全流程（分析→生成→组装→执行→同步→通知）
/tapd-executor S-xxx --assemble   # 只执行组装步骤（已有用例，生成脚本并执行）
/tapd-executor S-xxx --execute    # 只执行已有脚本
```

## 配置文件

```json
{
  "workspace_id": "33671402",
  "api_user": "CiOzjwRC",
  "api_password": "xxx",
  "api_url": "https://api.tapd.cn",
  "real_user": "刘晓康",
  "defaults": {
    "priority_label": "中",
    "severity": "一般"
  }
}
```

## 全流程工作流

### 第一步：需求分析（tapd-analyze）

1. 读取 config.json 获取 TAPD 凭证
2. 根据 story_id 拉取需求详情
3. AI 分析需求，输出结构化报告

### 第二步：用例生成（tapd-gen 增强版）

标签化用例输出格式，每个用例含动作标签：

```markdown
### TC-001: 按单据号查看到货单
目标页面: 到货单列表
操作类型: 查询验证
步骤:
  - [导航] 进入库存中心 → 到货单
  - [输入] 单据号输入框: DH202604150029
  - [点击] 查询按钮
  - [等待] API响应 /api/arrival/list
  - [断言] 查询结果条数 = 1
```

### 第三步：脚本组装（template-engine）

1. 解析标签化用例，提取 targetPage + operationType
2. 在模板库中匹配最佳模板
3. 组装生成纯 Playwright .spec.ts 文件
4. 输出到 test_pool/ 目录

### 第四步：测试执行（auto-test-runner）

```bash
npx tsx scripts/run-tests.ts test_pool/<生成的spec文件>
```

### 第五步：结果同步 + 通知（tapd-sync + tapd-notify）

与现有流程相同，回写结果和 Bug，推送企业微信通知。

## 状态管理

全流程使用状态文件 `.tapd-executor-state.json` 保存进度：

```json
{
  "story_id": "S-xxx",
  "current_step": "assemble",
  "analyze_result": { ... },
  "generated_cases": [ ... ],
  "assembled_scripts": [ ... ],
  "execution_results": [ ... ]
}
```

## 错误处理

| 场景 | 处理方式 |
|------|---------|
| 模板库无匹配 | 提示用户先使用 dom-recorder 录制 + 导入模板 |
| 脚本组装失败 | 降级到 nl-test-generator（Midscene 模式） |
| 执行失败 | 保存结果，tapd-sync 自动创建 Bug |
| 模板选择器全未命中 | 截图保存证据，提示更新录制 |

## 与其他 Skill 的协作

- **tapd-analyze** — 需求分析（第一步）
- **tapd-gen** — 标签化用例生成（第二步）
- **template-engine** — 脚本组装（第三步）
- **auto-test-runner** — 测试执行（第四步）
- **tapd-sync** — 结果同步（第五步）
- **tapd-notify** — 企微通知（第六步）
- **dom-recorder** — 模板录制源头（前置依赖）

## 注意事项

1. 首次使用前必须用 dom-recorder 录制并导入模板库（至少覆盖核心页面）
2. 模板库为空时无法生成脚本，会提示先录制
3. 执行引擎使用纯 Playwright，不依赖 VLM API
4. 生成的选择器带多级 fallback，执行时自动降级
5. 与 tapd-test（Midscene 模式）可同时存在，互补使用
