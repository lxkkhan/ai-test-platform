# AI 测试自动化 Skills

基于 OpenCode + Playwright + TAPD 的全自动测试流水线。

## 架构概览

```
录制(dom-recorder) → 模板库(template-engine) → 组装脚本 → 执行 → TAPD同步
       ↑                                              ↑
  Ctrl+Shift+N                                  tapd-executor
  标记用例边界                                   全流程编排
```

## Skills 清单

### 新 Skill（纯 Playwright Selector 模式）

| Skill | 功能 | 状态 |
|-------|------|------|
| **dom-recorder** | 纯 Playwright Selector 录制 + 用例边界标记 + 模板自动拆解 | ✅ |
| **template-engine** | 模板库管理 + 四级匹配 + 脚本组装 | ✅ |
| **tapd-executor** | 全流程编排：分析 → 生成 → 组装 → 执行 → 同步 → 通知 | ✅ |

### 已有 Skill（TAPD 流程）

| Skill | 功能 | 状态 |
|-------|------|------|
| **tapd-analyze** | TAPD 需求拉取 + AI 分析 | ✅ |
| **tapd-gen** | AI 生成测试用例（已增强：支持标签化输�? | ✅ |
| **tapd-bug** | 提交 Bug 到 TAPD | ✅ |
| **tapd-sync** | 测试结果回写 TAPD + 自动创建 Bug | ✅ |
| **tapd-notify** | 企业微信推送测试报告 | ✅ |
| **tapd-test** | Midscene VLM 模式全流程（旧版） | ✅ |

### 已有 Skill（不改动）

| Skill | 功能 |
|-------|------|
| **auto-test-runner** | Playwright + Midscene 测试执行引擎 |
| **auto-record-replay** | VLM 视觉模式录制和回放 |
| **nl-test-generator** | 自然语言 → MidsceneJS .spec.ts |

## 全流程说明

### 第一步：录制操作模板（一次性）

```
/dom-recorder → 启动 Chrome → 登录 → 录制操作 → Ctrl+Shift+N 标记用例 → 结束
```

产出的 `test_record/<timestamp>/` 目录包含：
- `case-001-xxx.spec.ts` — 纯 Playwright 可执行脚本
- `manifest.yaml` — 用例清单
- `templates/` — 自动拆解的模板

### 第二步：导入模板库

```bash
npx tsx .opencode/skills/dom-recorder/scripts/template-extractor.ts test_record/<sessionDir>
```

模板自动入库（四级去重：精确→增强→页面合并→相似提�?。

### 第三步：全流程自动化

```
/tapd-executor S-xxx --full
```

串联 6 个环节：
1. tapd-analyze — 需求分析
2. tapd-gen — 生成标签化用例（含 [导航][输入][断言] 动作标签�?
3. template-engine — 匹配模板 + 组装纯 Playwright 脚本
4. auto-test-runner — 执行测试（毫秒级）
5. tapd-sync — 结果回写 TAPD
6. tapd-notify — 企微通知

## 核心架构决策

### 为什么不用 Midscene VLM

| 维度 | Midscene VLM | 纯 Playwright Selector |
|------|-------------|----------------------|
| 单步耗时 | 200-500ms | <1ms |
| 准确率 | 70-85% | 95%+ |
| CI 可用性 | 不稳定 | 稳定 |

### Selector 优先级策略

```
data-testid > stable-id > aria-label > name+placeholder > class+text > tag+text > tag-only
```

动态 ID（如 `form_item_name_xxx`）自动降级跳过。

### 用例边界识别

| 方式 | 准确度 | 触发 |
|------|--------|------|
| 手动标记 | 100% | Ctrl+Shift+N 弹出对话框 |
| URL 变�?| 80% | 浏览器自动检测并提示 |
| AI 拆分 | 60-70% | 录制结束后自动分析 |

### 模板去重

不是"拒绝重复"，而是"越重复越鲁棒"——新选择器更精确则升为主，旧选择器降为备�?

## 关键文件

```
.opencode/skills/
  dom-recorder/scripts/selector-builder.ts     # 选择器构建引擎
  dom-recorder/scripts/selector-recorder.ts    # 录制引擎(CDP+登录+注入)
  dom-recorder/scripts/template-extractor.ts   # 模板自动拆解
  template-engine/scripts/template-matcher.ts  # 四级匹配引擎
  template-engine/scripts/script-assembler.ts  # 脚本组装引擎
  template-engine/template-library/index.yaml  # 模板库索引
  template-engine/template-library/pages/      # 页面元素映射
  template-engine/template-library/operations/ # 操作模板
  tapd-executor/SKILL.md                       # 全流程编排

.omo/drafts/pure-playwright-architecture.md     # 完整架�?文档
```

## 约束

- **禁止修改** `auto-record-replay`、`auto-test-runner`、`nl-test-generator`
- **禁止修改** 浏览器扩展
- 所有用例和 Bug 必须通过 `story_id` 关联到需求
- 测试计划命名 `TP` 前缀不变
- API 凭证需保密

## 待完成

- [ ] 用 dom-recorder 在真实系统中录制核心页面（5-10 个）
- [ ] 积累模板库后跑 `/tapd-executor S-xxx --full` 全流程
- [ ] 为真实用户生成个人 TAPD API Token（解决 creator 显示问题�?
- [ ] 完善 URL 自动提示和 AI 拆分功能

## 触发的提问式

当用户问"录制用例""根据模板生成脚本""全流程测试"时，自动匹配对应的 Skill：
- 录制 → `/dom-recorder`
- 模板匹配/生成脚本 → `/template-engine`
- 全流程 → `/tapd-executor`
