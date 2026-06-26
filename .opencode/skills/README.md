# AI 测试自动化 Skills

基于 OpenCode + Playwright + TAPD 的全自动测试流水线。**一条命令，从需求到 Bug 全流程自动化。**

## 整体架构

```
                        ┌─────────────────────────────────────┐
                        │           两条分析入口               │
                        │                                     │
   设计稿链接 ────→ design-analyze    tapd-analyze ←── TAPD需求│
   (CoDesign/        (设计+需求)     (纯需求分析)             │
    JSDesign)            │                │                   │
                        └───────┬────────┘                   │
                                │ JSON(兼容)                  │
                                ▼                             │
                        ┌──────────────┐                      │
                        │   tapd-gen   │  AI 生成用例         │
                        │  (写入TAPD)  │  正面/反面/交互      │
                        └──────┬───────┘                      │
                               │ 标签化用例 + story_id        │
                ┌──────────────┼──────────────┐              │
                ▼              ▼              ▼              │
        ┌─────────────┐ ┌─────────────┐ ┌───────────┐        │
        │template-engine│ │nl-test-gen  │ │ 手动创建  │        │
        │(模板匹配组装) │ │(NL→Midscene)│ │  .spec.ts │        │
        └──────┬──────┘ └──────┬──────┘ └─────┬─────┘        │
               │               │              │              │
               └───────────────┼──────────────┘              │
                               │ .spec.ts                    │
                               ▼                             │
                    ┌────────────────────┐                    │
                    │ auto-test-runner   │  测试执行           │
                    │ (Playwright引擎)   │                     │
                    └────────┬───────────┘                    │
                             │ 测试结果                       │
                    ┌────────┴───────────┐                   │
                    ▼                    ▼                   │
            ┌─────────────┐    ┌─────────────┐               │
            │  tapd-sync   │    │ tapd-notify │               │
            │ 状态回写+Bug │    │ 企微推送    │               │
            └─────────────┘    └─────────────┘               │
                                                             │
   ┌─────────────────────────────────────────────────────┐   │
   │                   tapd-executor                      │   │
   │   analyze → gen → template → run → sync → notify    │   │
   │   --full(全流程) / --design(设计稿入口) / --assemble │   │
   └─────────────────────────────────────────────────────┘   │
                                                             │
   ┌──────────────┐  ┌──────────────┐  ┌────────────────┐   │
   │ dom-recorder │  │  tapd-bug    │  │  tapd-test      │   │
   │ (录制→模板库) │  │ (手动提Bug)  │  │ (旧版VLM流程)   │   │
   └──────┬───────┘  └──────────────┘  └────────────────┘   │
          │ 录制模板                                         │
          ▼                                                 │
   ┌──────────────────┐                                     │
   │ template-library │  模板库(页面+操作)                    │
   └──────────────────┘                                     │
```

## Skills 清单

### 核心流程 Skill（串联可用）

| # | Skill | 功能 | 输入 | 输出 | 写TAPD |
|---|-------|------|------|------|--------|
| 1 | **design-analyze** | 从CoDesign/JSDesign设计稿提取规格→AI分析→回写TAPD，可选衔接playwright-mind生成XMind | story_id / 设计链接 | JSON + HTML追加到TAPD + 可选XMind | ✅ |
| 2 | **tapd-analyze** | 从TAPD拉取需求→AI分析功能点/风险/验收标准 | story_id | JSON分析报告 | ❌ (只读) |
| 3 | **tapd-gen** | AI生成测试用例→创建测试计划→写入TAPD→关联需求 | story_id / 分析JSON | Plan ID + Case IDs | ✅ |
| 4 | **template-engine** | 模板库管理+四级匹配+组装生成Playwright脚本 | 标签化用例JSON | .spec.ts文件 | ❌ |
| 5 | **auto-test-runner** | Playwright+Midscene测试执行引擎 | .spec.ts文件 | 测试结果JSON+HTML | ❌ |
| 6 | **tapd-sync** | 读取测试结果→回写TAPD用例状态→失败自动提Bug | 测试结果目录 | 用例状态 + Bug ID | ✅ |
| 7 | **tapd-notify** | 企微Webhook推送测试报告(5种通知类型) | 分析/计划/结果/Bug数据 | 企微消息 | ❌ |

### 编排 Skill

| # | Skill | 功能 | 模式 |
|---|-------|------|------|
| 8 | **tapd-executor** | 全流程编排器(纯Playwright Selector模式)，串联 Skills 1-7 | `--full` / `--design` / `--assemble` / `--execute` |
| 9 | **tapd-test** | 全流程编排器(Midscene VLM模式，旧版)，串联 Skills 2-7 | `--full` / 单步模式 |

### 辅助 Skill

| # | Skill | 功能 | 与核心流程关系 |
|---|-------|------|--------------|
| 10 | **dom-recorder** | 纯Playwright Selector录制+用例边界标记+模板自动拆解 | 为 template-engine 提供模板库数据源 |
| 11 | **tapd-bug** | 浏览器功能测试手动提Bug | tapd-sync 内部调用，也可手动使用 |
| 12 | **playwright-mind** | 从TAPD需求/测试用例自动生成结构化XMind思维导图文件，含需求关联(TAPD story URL) | design-analyze 第九步引用；全流程归档用 |

### 内部 Skill（不改动）

| Skill | 功能 |
|-------|------|
| **auto-record-replay** | VLM视觉模式录制和回放 |
| **nl-test-generator** | 自然语言→MidsceneJS .spec.ts |

### 新增 Skill：playwright-mind（XMind 思维导图生成）

| 属性 | 说明 |
|------|------|
| 目录 | `.opencode/skills/playwright-mind/` |
| 核心脚本 | `gen_xmind_v5.js` |
| 依赖 | `xmind` npm包 + `adm-zip`（均已安装） |
| 输出目录 | `test_pool/` |
| XMind结构 | Root → 需求节点(含TAPD href) → 模块 → 测试点 → 用例(前置/步骤/预期) |

## 全流程详解

### 流程 A：TAPD需求驱动（默认）

```
/tapd-executor S-xxx --full

tapd-analyze ──→ tapd-gen ──→ template-engine ──→ auto-test-runner ──→ tapd-sync ──→ tapd-notify
 (需求分析)      (用例生成)     (脚本组装)          (测试执行)         (结果回写)      (企微通知)
```

### 流程 B：设计稿驱动

```
/tapd-executor S-xxx --full --design

design-analyze ──→ tapd-gen ──→ template-engine ──→ auto-test-runner ──→ tapd-sync ──→ tapd-notify
 (设计+需求)       (用例生成)     (脚本组装)          (测试执行)         (结果回写)      (企微通知)
```

**design-analyze 的优势**：
- 从 CoDesign/JSDesign 设计稿自动提取 UI 组件、颜色、字体、交互行为
- 8 个分析维度（tapd-analyze 的 6 个 + 设计规格映射 + 跨画板一致性检查）
- 分析报告追加回写到 TAPD 需求 description
- 输出 JSON 兼容 tapd-gen，`design_specs` 字段辅助 template-engine 更精准匹配模板

### 流程 C：录制驱动（模板积累）

```
dom-recorder ──→ template-extractor ──→ template-library ──→ template-engine ──→ auto-test-runner
 (录制操作)       (模板拆解导入)          (模板库)            (匹配组装)          (执行验证)
```

录制产出位于 `test_record/<timestamp>/`，包含 .spec.ts、manifest.yaml 和 templates/。

## 两种执行模式对比

| 维度 | tapd-executor (Selector) | tapd-test (VLM/Midscene) |
|------|-------------------------|--------------------------|
| 脚本方式 | 纯 Playwright Selector | Midscene VLM (aiTap/aiInput) |
| 单步耗时 | <1ms | 200-500ms |
| 准确率 | 95%+ | 70-85% |
| CI 可用性 | 稳定 | 不稳定 |
| 依赖 | 模板库 | VLM API Key |
| 模板复用 | 有 | 无 |
| Selector 降级 | 多级 fallback | 不支持 |

## 共享配置机制

所有 TAPD Skill 通过 `_extends` 机制共享凭证：

```
.opencode/skills/
  _shared/
    tapd-config.json          ← 唯一凭证源（workspace_id/api_user/api_password/real_user）
  tapd-analyze/config.json    ← { "_extends": "../_shared/tapd-config.json", "analyze_fields": [] }
  tapd-gen/config.json        ← { "_extends": "../_shared/tapd-config.json", "auto_upload": false }
  tapd-bug/config.json        ← { "_extends": "../_shared/tapd-config.json" }
  ... (8个TAPD Skill均通过 _extends 引用)
  dom-recorder/config.json    ← 独立配置（无TAPD凭证）
  template-engine/config.json ← 独立配置（无TAPD凭证）
```

**优势**：修改凭证只需改一处（`_shared/tapd-config.json`），8 个 Skill 自动同步。

> `_shared/tapd-config.json` 已在 `.gitignore` 中排除，首次使用需自行创建。

## 关键文件

```
.opencode/skills/
  _shared/tapd-config.json                     # 共享凭证(需自行创建)
  
  design-analyze/SKILL.md                      # 设计稿分析+回写
  design-analyze/config.json                   # 配置(_extends引用)
  design-analyze/references/                   # CoDesign/JSDesign/TAPD API参考
  
  tapd-analyze/SKILL.md                        # TAPD需求分析
  tapd-analyze/config.json
  
  tapd-gen/SKILL.md                            # 用例生成+上传TAPD
  tapd-gen/config.json
  
  tapd-executor/SKILL.md                       # 全流程编排
  tapd-executor/config.json
  
  template-engine/SKILL.md                     # 模板引擎
  template-engine/config.json
  template-engine/template-library/            # 模板库
    index.yaml                                 # 全局索引
    pages/                                     # 页面元素映射
    operations/                                # 操作模板
  
  dom-recorder/SKILL.md                        # 录制器
  dom-recorder/config.json
  dom-recorder/scripts/
    selector-recorder.ts                       # 录制引擎(CDP+登录+注入)
    selector-builder.ts                        # 选择器构建
    template-extractor.ts                      # 模板拆解导入
  
  tapd-notify/SKILL.md                         # 企微通知
  tapd-notify/config.json
  tapd-notify/templates/                       # 5种通知模板
  
  tapd-sync/SKILL.md                           # 结果回写
  tapd-sync/config.json
  
  tapd-bug/SKILL.md                            # 手动提Bug
  tapd-bug/config.json
  
  tapd-test/SKILL.md                           # 旧版VLM全流程
  tapd-test/config.json

  playwright-mind/SKILL.md                     # XMind思维导图生成
  playwright-mind/gen_xmind_v5.js              # 标准生成脚本(推荐)
  playwright-mind/node_modules/xmind/          # xmind npm包(已安装)

opencode.jsonc                                 # MCP配置(playwright+codesign-mcp)
```

## 快速开始

### 1. 创建共享凭证

```bash
cp .opencode/skills/_shared/tapd-config.example.json .opencode/skills/_shared/tapd-config.json
# 编辑填入 workspace_id, api_user, api_password, real_user
```

> **认证方式**：OAuth 2.0 `client_credentials`。`api_user`/`api_password` 仅用于换取 `access_token`（有效期 7200s），后续所有 API 调用统一使用 `Authorization: Bearer {access_token}`。

### 2. 安装依赖

```bash
cd .opencode/skills/playwright-mind
npm install                     # 安装 xmind、adm-zip 等依赖
npx playwright install chromium # 安装 Playwright 浏览器
```

### 3. 配置 MCP（opencode.jsonc 已预配）

无需手动操作。`opencode.jsonc` 已配置：
- `playwright` MCP → 浏览器自动化（JSDesign 提取、dom-recorder）
- `codesign-mcp` MCP → CoDesign 设计稿提取

### 4. 录制模板（首次使用）

```bash
npx tsx .opencode/skills/dom-recorder/scripts/selector-recorder.ts
# 操作浏览器 → Ctrl+Alt+N 标记用例 → 关闭浏览器
npx tsx .opencode/skills/dom-recorder/scripts/template-extractor.ts test_record/<sessionDir>
```

### 5. 运行全流程

```bash
# TAPD需求驱动
/tapd-executor S-xxx --full

# 设计稿驱动（需求中包含设计链接时）
/tapd-executor S-xxx --full --design
```

## 全链路追溯

```
Story (story_id)
  ├─→ 需求分析报告 (tapd-analyze / design-analyze)
  ├─→ Test Plan (TP_S{story_id}_{序号})
  │     ├─→ TCase 1 (TC_S{story_id}_001)
  │     ├─→ TCase 2 (TC_S{story_id}_002)
  │     └─→ ...
  ├─→ Bug 1 (关联 story_id)
  ├─→ Bug 2 (关联 story_id)
  └─→ 企微通知
```

所有用例和 Bug 都通过 `relations` API 关联到 `story_id`，实现全链路追溯。

## 约束

- 禁止修改 `auto-record-replay`、`auto-test-runner`、`nl-test-generator`
- 禁止修改浏览器扩展
- 所有用例和 Bug 必须通过 `story_id` 关联到需求
- 测试计划命名格式：`TP_S{story_id}_{序号}`
- 用例命名格式：`TC_S{story_id}_{序号}_{功能描述}`
- `_shared/tapd-config.json` 不得提交到版本控制
- Windows 环境使用 `curl.exe`（非 PowerShell `curl` 别名）
- TAPD API 限流：5 次/秒/workspace，请求间加 200ms 延迟
