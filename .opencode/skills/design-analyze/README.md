# Design Analyze — 独立使用说明

## 是什么

`design-analyze` 是一个 OpenCode Skill，可**独立**使用 CoDesign/JSDesign 设计链接，自动提取设计稿的 UI 规格数据，通过 AI 分析生成结构化测试需求报告，并**追加回写**到 TAPD 需求的 `description` 字段中。

即：**给一个设计链接 → 分析设计稿 → 回写 TAPD 需求详情**。

---

## 前置依赖

### 1. CoDesign MCP 插件

CoDesign 模式需要 `codesign-mcp` MCP 服务器。确认配置后首次使用时会弹出浏览器让你扫码登录 CoDesign，之后登录态自动持久化。

#### 在 opencode.json 或 opencode.jsonc 中添加

```jsonc
{
  "mcp": {
    "codesign-mcp": {
      "type": "local",
      "command": ["npx", "-y", "codesign-mcp@latest"],
      "environment": {
        "CODESIGN_WORKSPACE_DIR": "E:/006Skills"
      },
      "enabled": true
    }
  }
}
```

| 环境变量 | 默认值 | 说明 |
|---------|--------|------|
| `CODESIGN_WORKSPACE_DIR` | 自动检测 | 工作空间根目录（建议显式指定） |
| `CODESIGN_DATA_DIR` | `<workspace>/.codesign-mcp` | 数据存储目录 |
| `CODESIGN_PROFILE_DIR` | `<dataDir>/profile` | Chromium 登录态持久化目录 |

> JSDesign 模式需要 `jishi-design` MCP 服务器（端口 19999），需要先在 JSDesign 编辑器中启动插件。本文档以 CoDesign 模式为主。

---

## 配置说明

### config.json

设计分析 Skill 的配置文件位于 `E:\006Skills\.opencode\skills\design-analyze\config.json`：

```json
{
    "_extends": "../_shared/tapd-config.json",
    "output_dir": "design-analysis",
    "analysis_depth": "detailed",
    "max_screens": 20,
    "auto_update_tapd": false,
    "auto_gen_cases": false
}
```

### 方式一：使用共享配置（`_extends` 机制）

配置通过 `_extends` 指向 `../_shared/tapd-config.json`，共享的 TAPD 配置文件需包含：

```json
{
    "workspace_id": "33671402",
    "api_user": "你的TAPD API账号",
    "api_password": "你的TAPD API密码",
    "api_url": "https://api.tapd.cn",
    "real_user": "你的真实用户名（如：刘晓康）",
    "defaults": {
        "priority_label": "中",
        "severity": "一般",
        "testtype": "功能测试",
        "testphase": "功能测试阶段"
    },
    "modules": ["登录", "注册", "首页", "订单管理", "用户中心", "设置", "报表", "其他"],
    "owner_list": ["你的用户名"],
    "default_story_id": "",
    "default_reviewer": ""
}
```

> 共享文件路径：`E:\006Skills\.opencode\skills\_shared\tapd-config.json`

### 方式二：不使用 `_extends`（内联配置）

如果不需要共享配置，删除 `_extends` 字段，将所有 TAPD 字段直接写在 `design-analyze/config.json` 中：

```json
{
    "workspace_id": "33671402",
    "api_user": "你的TAPD API账号",
    "api_password": "你的TAPD API密码",
    "api_url": "https://api.tapd.cn",
    "real_user": "你的真实用户名",
    "defaults": {
        "priority_label": "中",
        "severity": "一般",
        "testtype": "功能测试",
        "testphase": "功能测试阶段"
    },
    "modules": ["登录", "注册", "首页", "订单管理", "用户中心", "设置", "报表", "其他"],
    "owner_list": ["你的用户名"],
    "default_story_id": "",
    "default_reviewer": "",
    "output_dir": "design-analysis",
    "analysis_depth": "detailed",
    "max_screens": 20,
    "auto_update_tapd": false,
    "auto_gen_cases": false
}
```

### 配置项说明

| 字段 | 必填 | 说明 |
|------|------|------|
| `workspace_id` | 是 | TAPD 项目 ID |
| `api_user` | 是 | TAPD API 账号 |
| `api_password` | 是 | TAPD API 密码 |
| `api_url` | 是 | TAPD API 地址（公有云：`https://api.tapd.cn`） |
| `real_user` | 是 | TAPD 登录用户名（用于记录操作人，非 API 账号） |
| `output_dir` | 否 | 分析结果 JSON 保存目录，默认 `design-analysis` |
| `analysis_depth` | 否 | 分析深度：`detailed`（详细）/ `simple`（简单） |
| `max_screens` | 否 | 最大分析画板数，默认 20 |
| `auto_update_tapd` | 否 | 是否自动回写 TAPD（false 需用户确认） |
| `auto_gen_cases` | 否 | 是否自动衔接 tapd-gen 生成用例（false 需用户确认） |

---

## 使用方式

### 命令式调用

```
/design-analyze <CoDesign分享链接> --story-id S-xxx
```

示例：

```
/design-analyze https://codesign.qq.com/s/abc123456 --story-id S-1133671402001000033
```

### 支持的参数格式

| 格式 | 说明 |
|------|------|
| `/design-analyze <URL> --story-id S-xxx` | 分析设计链接，关联到指定 TAPD 需求 |
| `/design-analyze S-xxx` | 自动从 TAPD 需求描述中提取设计链接，分析并回写 |
| `/design-analyze S-xxx --no-update` | 只分析不回写 TAPD |
| `/design-analyze S-xxx --auto` | 全自动：分析 + 回写 + 生成用例 |

### 支持的 CoDesign URL 格式

| URL 格式 | 示例 |
|---------|------|
| 分享链接（推荐） | `https://codesign.qq.com/s/abc123` |
| 分享链接（带 app） | `https://codesign.qq.com/app/s/abc123` |
| 纯数字分享 ID | `681061312299654` |

> **不支持** 设计链接格式 `https://codesign.qq.com/app/design/...`，需在 CoDesign 中先创建**分享链接**。

---

## 工作流程（8 步）

```
┌──────────────────────────────────────────────────────┐
│ Step 1: 获取 TAPD 需求                                  │
│   ├─ story_id 模式: 调用 TAPD API 拉取需求详情            │
│   └─ URL 模式: 跳过，直接分析设计链接                      │
├──────────────────────────────────────────────────────┤
│ Step 2: 提取设计链接                                      │
│   └─ 从需求 description 的 HTML 中正则提取 CoDesign URL    │
├──────────────────────────────────────────────────────┤
│ Step 3: 平台检测与登录                                     │
│   ├─ codesign_status: 检查登录状态                       │
│   └─ codesign_login: 未登录则弹出浏览器扫码                 │
├──────────────────────────────────────────────────────┤
│ Step 4: 提取设计规格                                      │
│   ├─ list_artboards: 获取所有画板列表                     │
│   └─ get_artboard_spec: 逐画板提取图层/文字/颜色/CSS       │
├──────────────────────────────────────────────────────┤
│ Step 5: 数据标准化                                        │
│   └─ 将 CoDesign/JSDesign 数据映射为统一 Schema           │
├──────────────────────────────────────────────────────┤
│ Step 6: AI 结构化分析                                      │
│   ├─ 功能点拆解（从设计稿图层、文字、交互推断）               │
│   ├─ 测试范围界定（IN SCOPE / OUT OF SCOPE）               │
│   ├─ 风险等级评估（高/中/低）                                 │
│   ├─ 测试重点标注（P0/P1/P2/P3）                             │
│   ├─ 验收标准输出                                            │
│   └─ 设计规格映射（UI组件/文字/颜色 → 功能点）                │
├──────────────────────────────────────────────────────┤
│ Step 7: 回写 TAPD 需求详情                                  │
│   ├─ 获取原需求 description（HTML）                         │
│   ├─ 追加分析报告 HTML 到末尾                               │
│   └─ POST 回写 TAPD Stories API                            │
├──────────────────────────────────────────────────────┤
│ Step 8: 可选衔接 tapd-gen                                    │
│   └─ auto_gen_cases=true 或用户确认时自动生成测试用例        │
└──────────────────────────────────────────────────────┘
```

### 核心 MCP 工具一览（CoDesign）

| 工具 | 用途 | 必传参数 |
|------|------|---------|
| `codesign_status` | 检查登录状态和浏览器运行状态 | 无 |
| `codesign_login` | 打开浏览器扫码登录 | `waitMs`(选) |
| `list_artboards` | 获取分享链接下所有画板列表 | `sharingUrl` |
| `get_artboard_spec` | 获取单个画板的完整设计规格 | `sharingUrl` + `screenId/screenName` |
| `get_artboard_image` | 获取画板截图 | `sharingUrl` + `screenId/screenName` |
| `download_slice` | 下载切图资源 | `sharingUrl` + `layerObjectId` |
| `codesign_logout` | 退出登录 | `confirm: true` |

---

## 输出示例

### JSON 分析结果（保存到 `design-analysis/` 目录）

```json
{
  "story_id": "S-1133671402001000033",
  "story_name": "【数字员工】相关技能开发",
  "source": "codesign",
  "source_url": "https://codesign.qq.com/s/abc123",
  "analysis_result": {
    "features": [{
      "name": "事务管理-全局配置",
      "description": "全局级别的事务类型配置页面",
      "source_screens": ["事务管理-全局"],
      "risk_level": "高",
      "test_type": "功能测试",
      "priority": "P0",
      "acceptance_criteria": [
        "可正确创建、编辑、删除全局事务类型",
        "表单校验规则正确"
      ]
    }],
    "test_scope": {
      "in_scope": ["事务管理CRUD", "作业流程配置"],
      "out_of_scope": ["后端API性能", "跨系统集成"]
    },
    "summary": "本需求涉及作业中心配置模块..."
  }
}
```

### TAPD 回写效果

分析报告以 HTML 格式**追加**到原需求 description 末尾：

```html
（原有需求描述保持不变）
<hr/>
<h3>📋 设计稿分析报告</h3>
<p><strong>来源平台</strong>：CoDesign</p>
<p><strong>设计链接</strong>：<a href="...">...</a></p>
<p><strong>画板数量</strong>：8</p>

<h4>🎯 功能点</h4>
<table border="1">
  <tr><th>功能点</th><th>描述</th><th>风险</th><th>优先级</th></tr>
  <tr><td>事务管理</td><td>...</td><td>高</td><td>P0</td></tr>
</table>
<!-- ... -->
```

---

## 错误处理

| 场景 | 处理方式 |
|------|---------|
| CoDesign 链接是设计链接（非分享链接） | 提示用户在 CoDesign 中点击"分享"按钮创建分享链接 |
| 分享链接需密码 | 传入 `password` 参数 |
| 未登录 CoDesign | 调用 `codesign_login`，用户扫码登录后自动继续 |
| 登录超时（10分钟） | 重新运行 `codesign_login` |
| MCP 插件未启动 | 检查 `opencode.jsonc` 中 `codesign-mcp` 配置 |
| 画板数量 > max_screens | 只分析前 N 个，提示用户调整限制 |
| TAPD 回写失败 | 分析结果 JSON 已保存到本地 `design-analysis/` 目录 |
| 需求描述中无设计链接 | 提供手动粘贴设计链接的方式 |

---

## 初始化 Checklist

首次使用前按顺序检查：

- [ ] **1. TAPD 配置**: `_shared/tapd-config.json`（或 `design-analyze/config.json`）中 `workspace_id`、`api_user`、`api_password`、`real_user` 已填写
- [ ] **2. MCP 插件**: `opencode.jsonc` 中 `codesign-mcp` 已添加并 `enabled: true`
- [ ] **3. CoDesign 登录**: 首次运行时通过 `codesign_login` 扫码登录（会自动弹出浏览器）
- [ ] **4. 设计链接**: CoDesign 中的设计稿已创建**分享链接**（不是设计链接）
- [ ] **5. TAPD 需求**: 目标需求的 story_id 已知并存在

---

## 与其他 Skill 的协作

| Skill | 关系 |
|-------|------|
| **tapd-analyze** | `design-analyze` 第一步可调用 tapd-analyze 获取需求详情 |
| **tapd-gen** | 分析结果 JSON 可直接传入 tapd-gen 生成测试用例 |
| **tapd-notify** | 回写完成后可推送企微通知 |
| **template-engine** | 设计规格中的 UI 组件可辅助模板匹配 |
| **tapd-executor** | 可替代其中的 tapd-analyze 环节，形成新的全流程路线 |
