---
name: template-engine
description: 模板管理引擎。管理操作模板库（页面模板 + 操作模板），将标签化测试用例通过模板匹配和组装生成纯 Playwright 可执行脚本。支持模板索引、四级匹配（精确/模糊页面/模糊类型/降级）、多级选择器 fallback。触发词：模板引擎、模板匹配、组装脚本、生成脚本。当用户提到"根据模板生成脚本""匹配模板""组装测试脚本"等涉及模板匹配和脚本生成的请求时，必须使用此 Skill。
metadata:
  audience: testers
  workflow: test-automation
---

# Template Engine — 模板管理引擎

## 功能概述

本 Skill 管理操作模板库，接收标签化测试用例后通过模板匹配和组装，生成纯 Playwright 可执行脚本。

核心能力：
- **模板匹配**：四级策略（精确 → 模糊页面 → 模糊类型 → 降级）
- **模板组装**：页面导航 + 操作步骤 + 测试数据注入 + 断言追加
- **多级 fallback**：生成的选择器带 2-3 级备选，执行时自动降级

## 模板库结构

```
.opencode/skills/template-engine/template-library/
  ├── index.yaml              # 全局索引（页面+操作类型 → 模板文件）
  ├── pages/                  # 页面元素映射
  │   ├── 到货单列表.yaml
  │   └── 采购订单列表.yaml
  └── operations/             # 操作模板（步骤序列）
      ├── 查询验证.yaml
      └── 新增提交.yaml
```

## 工作流

### 第一步：用例准备（标签化格式）

将测试用例格式化为标签化 JSON/YAML：

```json
{
  "caseName": "按单据号查看到货单",
  "targetPage": "到货单列表",
  "operationType": "查询验证",
  "steps": [
    { "action": "导航", "target": "进入到货单页面" },
    { "action": "输入", "target": "单据号输入框", "value": "DH202604150029" },
    { "action": "点击", "target": "查询按钮" },
    { "action": "等待", "target": "API响应 /api/arrival/list" }
  ],
  "testData": { "billNo": "DH202604150029" },
  "assertions": [
    { "type": "count", "expected": "1", "description": "查询结果只有1条" }
  ]
}
```

### 第二步：模板匹配

```bash
npx tsx .opencode/skills/template-engine/scripts/template-matcher.ts "到货单列表" "查询验证"
```

### 第三步：脚本组装

```bash
npx tsx .opencode/skills/template-engine/scripts/script-assembler.ts --file case-input.json
```

生成的 .spec.ts 文件输出到 `test_pool/` 目录，可直接由 auto-test-runner 执行。

## 标签化步骤格式

| action | 说明 | target 示例 | value 示例 |
|--------|------|-------------|------------|
| `导航` | 页面导航 | "进入到货单页面" | - |
| `输入` | 填充输入框 | "单据号输入框" | "DH202604150029" |
| `点击` | 点击按钮/元素 | "查询按钮" | - |
| `双击` | 双击元素 | "编辑按钮" | - |
| `等待` | 等待条件 | "API响应 /api/arrival/list" | - |
| `按键` | 键盘按键 | "搜索输入框" | "Enter" |
| `断言` | 验证结果 | "查询结果只有1条" | "1" |

## 断言类型

| type | 说明 | expected 示例 |
|------|------|--------------|
| `count` | 验证行数 | "1" |
| `text` | 验证文本包含 | "保存成功" |
| `visible` | 验证元素可见 | "成功提示" |
| `url` | 验证 URL 匹配 | ".*/home" |
| `custom` | 自定义断言（需手动实现） | - |

## 多级匹配策略

| 级别 | 策略 | 置信度 | 条件 |
|------|------|--------|------|
| 1 | 精确匹配 | 100% | 页面名 + 操作类型完全一致 |
| 2 | 模糊页面 | 75% | 操作类型一致，页面名部分匹配 |
| 3 | 模糊类型 | 60% | 页面一致，操作类型近似 |
| 4 | 降级 | 40% | 同页面任何操作类型 |

## 注意事项

1. 模板库由 dom-recorder 录制后导入，初始为空
2. 模板库越丰富，匹配命中率越高
3. 生成的脚本带多级 fallback 选择器，执行时自动降级
4. 不匹配的用例会提示使用 dom-recorder 补充录制
5. 生成的 .spec.ts 使用 auth-fixture，需要项目已部署 auto-test-runner 环境
