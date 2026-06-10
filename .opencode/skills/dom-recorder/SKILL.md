---
name: dom-recorder
description: 纯 Playwright Selector 模式的浏览器操作录制工具。通过采集 DOM 属性（tag/id/class/text/placeholder/ariaLabel）自动生成 page.click/page.fill 等纯 Playwright 代码，支持用例边界标记（键盘快捷键 Ctrl+Shift+N），一次录制产出多个独立用例和结构化模板。触发词：录制、录制用例、Selector录制、DOM录制、录制操作。当用户提到"录制测试""录制用例""录制页面操作""新功能需要录制"等涉及录制需求时，必须使用此 Skill。
metadata:
  audience: testers
  workflow: test-automation
---

# DOM Recorder — 纯 Playwright Selector 录制器

## 功能概述

本 Skill 是纯 Playwright 测试用例录制工具，与 auto-record-replay（VLM 视觉模式）互补：

| 特性 | dom-recorder（本 Skill） | auto-record-replay |
|------|-------------------------|-------------------|
| 选择器来源 | DOM 属性（id/class/text/placeholder） | VLM 视觉识别 |
| 生成代码 | `page.click('button:has-text("查询")')` | `aiTap('查询按钮')` |
| 执行速度 | 毫秒级 | 200-500ms/步 |
| 准确率 | 95%+ | 70-85% |
| 用例边界 | 支持（Ctrl+Shift+N 新建用例） | 不支持 |
| 模板输出 | 自动拆解（页面模板 + 操作模板） | 不支持 |

## 配置文件

本 Skill 依赖 `config.json`，需包含以下字段：

```json
{
  "record_port": 9301,
  "output_dir": "test_record",
  "enable_vlm_fallback": false,
  "defaults": {
    "operation_type": "查询验证",
    "timeout": 3000
  }
}
```

## 工作流

### 第一步：环境检查

确保以下依赖可用：
- Chrome 浏览器已安装
- Node.js 已安装，依赖已配置
- `.env` 文件已配置 LOGIN_URL/LOGIN_USERNAME/LOGIN_PASSWORD

### 第二步：启动录制

```bash
cd <项目根目录>
npx tsx .opencode/skills/dom-recorder/scripts/selector-recorder.ts
```

录制器将：
1. 启动 Chrome（CDP 模式，端口默认 9301）
2. 自动登录目标系统
3. 注入事件监听器（DOM 属性采集）
4. 创建默认第一个用例

### 第三步：操作浏览器

录制器登录后会自动扫描左侧菜单，为每个叶子菜单预建用例结构。

在浏览器中执行测试操作：

- **点击叶子菜单** → 自动追加到同名用例（或新建）
- **Ctrl+Alt+N** → 弹出新建用例对话框
- **Ctrl+Alt+E** → 关闭对话框/工具栏
- **点击右上角 REC 指示器** → 显示/隐藏工具栏
- **关闭浏览器** → 结束录制

### 第四步：结束录制

- 关闭浏览器窗口
- 或按 `Ctrl+Shift+E`
- 或终端按 `Ctrl+C`

录制器自动完成：
1. 为每个用例生成独立 `.spec.ts` 文件
2. 生成 `manifest.yaml`（用例清单）
3. 生成初始模板（页面模板 + 操作模板）

### 第五步：导入模板库

```bash
npx tsx .opencode/skills/dom-recorder/scripts/template-extractor.ts test_record/<sessionDir>
```

将录制产出的模板导入 `template-engine` 的模板库。自动处理去重和增强。

## 输出结构

```
test_record/20260522143015/
  ├── manifest.yaml              # 用例清单
  ├── raw-actions.json           # 原始操作序列
  ├── case-001-查看到货单.spec.ts
  ├── case-002-新增到货单.spec.ts
  └── templates/                 # 初始模板
      ├── 到货单列表.yaml
      └── 查询验证.yaml
```

## 键盘快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+Alt+N` | 弹出新建用例对话框 |
| `Ctrl+Alt+E` | 关闭对话框/工具栏 |
| 点击 REC 指示器 | 显示/隐藏工具栏 |

## 注意事项

1. 录制前确认已配置好 `.env` 中的登录信息（与 auto-record-replay 共用 `.env`）
2. 用例边界：点击叶子菜单自动追加到同名用例；Ctrl+Alt+N 手动新建用例（跨菜单场景）
3. 录制结束后可点击 Stop 按钮或关闭浏览器窗口
4. 录制端口默认 9301（避免与 auto-record-replay 的 9300 冲突）
5. 生成的选择器含多级 fallback，执行时按优先级逐个尝试
6. 录制结束后运行 template-extractor 将模板导入模板库
7. 快捷键已改为 Ctrl+Alt+N/E（避免与浏览器快捷键冲突）
8. 工具栏默认隐藏，Ctrl+Alt+N 调出，Ctrl+Alt+E 关闭
9. 登录后自动扫描左侧菜单结构并保存到 menu-structure.json
