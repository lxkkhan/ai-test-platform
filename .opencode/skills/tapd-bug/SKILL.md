---
name: tapd-bug
description: 浏览器功能测试提Bug工具 - 记录操作步骤并一键提交到TAPD。触发词：提bug、提交bug、tapd提bug、关联需求、story_id。支持从浏览器扩展复制的内容直接提交，支持通过story_id关联需求。
metadata:
  audience: testers
  workflow: tapd
---

## 功能概述

本 Skill 用于在功能测试过程中快速向 TAPD 提交 Bug 缺陷。支持两种来源：
1. **浏览器扩展传入**：测试人员在浏览器中通过扩展面板填写后，复制内容粘贴到 OpenCode，由本 Skill 提交
2. **直接交互创建**：在 OpenCode 对话中直接描述 Bug，由本 Skill 引导填写后提交

## 配置文件

本 Skill 依赖同级目录下的 `config.json`，通过 `_extends` 引用共享凭证 `_shared/tapd-config.json`：

```json
{
  "_extends": "../_shared/tapd-config.json"
}
```

> **共享凭证**：所有 TAPD Skill 的 `api_user`、`api_password`、`workspace_id` 等共用字段统一在 `_shared/tapd-config.json` 管理。

## 工作流

> **认证方式**：所有 TAPD API 调用使用 Bearer Token。先通过 `client_credentials` 换取 `access_token`：
> ```bash
> curl.exe -u "api_user:api_password" -d "grant_type=client_credentials" "{api_url}/tokens/request_token"
> ```
> 后续统一使用 `-H "Authorization: Bearer {access_token}"`。
>
> ---

### 场景A：用户粘贴浏览器扩展输出的 Bug 内容

当用户从浏览器扩展"复制到剪贴板"后粘贴内容，格式通常为：

```
【Bug 标题】登录按钮点击无响应
【测试页面】
https://xxx.com/login
【测试环境】浏览器功能测试
【操作步骤】
1. 打开页面：「XXX系统」
2. 点击：「登录按钮」
3. 输入：「admin@test.com」
...
【预期结果】
登录成功跳转首页
【实际结果】
按钮点击无任何响应
```

1. 解析用户粘贴的内容，提取标题、操作步骤、预期结果、实际结果等
2. 读取 `config.json` 获取 TAPD 凭证和项目ID（需递归解析 `_extends` 引用）
3. 如果缺少必要字段（严重程度、优先级、模块、处理人），向用户追问
4. 组装最终的 Bug 内容，向用户展示预览
5. 用户确认后，通过 curl 调用 TAPD API 提交 Bug。**从响应中提取 Bug ID**，格式如 `data.Bug.id`
6. **必须执行需求关联**：检查是否需要关联需求（条件见「获取 story_id」），如需关联则立即调用 Relations API（见「关联方式」）

### 场景B：用户口头描述 Bug

用户说类似："提bug 登录页密码错误时不提示错误信息"

1. 引导用户补充完整信息：
   - Bug 标题（已提取）
   - 严重程度（致命/严重/一般/轻微）
   - 优先级（高/中/低）
   - 模块（从 config 的 modules 列表中选择）
   - 处理人
   - 复现步骤
   - 预期结果 vs 实际结果
2. 组装 Bug 内容并展示预览
3. 确认后提交到 TAPD
4. **必须执行需求关联**：检查是否需要关联需求（条件见「获取 story_id」），如需关联则调用 Relations API（同场景A 步骤 6）

## 需求关联（story_id）

story_id 用于将 Bug 关联到对应的需求（Story），实现全链路追溯。

### 获取 story_id（确定是否需要关联）

按以下优先级确定 story_id：

1. **用户显式提供** — 用户在对话中说"关联需求 S-xxx"或通过 `/tapd-bug S-xxx` 指定
2. **config.json 的 default_story_id** — 若用户未提供，检查 config 中的 `default_story_id`（空字符串表示不关联）
3. 如果两者均为空，则不进行关联

> **注意**：只要任一来源有值（非空字符串），**必须**执行关联步骤。

### 关联方式

Bug 创建成功后，**必须**立即执行以下步骤：

**步骤 A：从提交响应中提取 Bug ID**

Bug 创建 API 返回如下响应，需提取 `data.Bug.id`：
```json
{
  "status": 1,
  "data": {
    "Bug": {
      "id": "1120003271001000123",
      ...
    }
  }
}
```

**步骤 B：调用 Relations API 关联**

> `bugs/linked_stories` 专用接口在部分 TAPD 版本可能返回空响应导致关联静默失败，**必须先尝试通用 Relations API**。

**方法一（首选）：通用 Relations API**

```bash
curl.exe -s -H "Authorization: Bearer {access_token}" \
  -X POST \
  -d "workspace_id={workspace_id}&source_type=bug&source_id={BUG_ID}&target_type=story&target_id={STORY_ID}" \
  "{api_url}/relations"
```

检查返回的 JSON 状态码。如果 `status` 为 1 表示成功；如果请求失败（HTTP 非 2xx 或 status 非 1），执行方法二。

**方法二（备选）：专用接口**

```bash
curl.exe -s -H "Authorization: Bearer {access_token}" \
  -X POST \
  -d "workspace_id={workspace_id}&bug_id={BUG_ID}&story_id={STORY_ID}" \
  "{api_url}/bugs/linked_stories"
```

**步骤 C：验证关联结果**

- 调用 `/relations` 返回 `{"status": 1}` 表示关联成功
- 如果两种方法均失败，告知用户：**"Bug #{BUG_ID} 已创建，但需求关联失败，请手动在 TAPD 中关联"**

## TAPD API 调用

### 提交 Bug

Bug 描述支持 HTML 格式，可使用表格、标题、列表等标签让详情页更美观：

```bash
curl.exe -H "Authorization: Bearer {access_token}" \
  --data-urlencode "workspace_id={workspace_id}" \
  --data-urlencode "title=[自动] {Bug标题}" \
  --data-urlencode "severity=一般" \
  --data-urlencode "priority_label=中" \
  --data-urlencode "module={模块}" \
  --data-urlencode "current_owner={real_user}" \
  --data-urlencode "description=<p><strong>【自动提交】</strong>...</p><hr/>..." \
  --data-urlencode "testtype=功能测试" \
  --data-urlencode "testphase=功能测试阶段" \
  '{api_url}/bugs'
```

> **重要**：
> - 中文字段必须使用 `--data-urlencode` 传入，避免 PowerShell/curl 编码乱码
> - `current_owner`（处理人）使用 `config.json` 中的 `real_user`（TAPD 真实用户名），而非 API 账号
> - `creator`/`reporter` 由 API 自动设置为 API 账号名，无法覆盖
> - Bug 描述推荐使用 HTML 格式，包含表格、分区标题和标签

默认 API 地址为 `https://api.tapd.cn`。如企业微信集成 TAPD 使用私有化部署或有独立 API 网关，修改 `config.json` 中的 `api_url` 字段。

### 成功返回

```json
{
  "status": 1,
  "data": {
    "Bug": {
      "id": "1120003271001000123",
      "title": "BUG标题",
      "status": "new",
      ...
    }
  },
  "info": "success"
}
```

返回 Bug ID 后，告知用户 TAPD 链接：`https://www.tapd.cn/项目ID/bugtrace/bugs/view?bug_id=BUG_ID`

### 错误处理

- 如果 config.json 不存在或凭证未配置，引导用户修改 config.json
- 如果 API 返回非 1 的 status，检查 info 字段显示错误原因
- 网络错误时提示用户检查网络和 API 地址连通性

## 注意事项

1. 提交前必须让用户确认 Bug 内容预览
2. 密码等敏感信息不会出现在提交内容中（扩展端已脱敏）
3. config.json 建议加入 `.gitignore`，避免泄露 API 凭证
4. 如果用户没有浏览器扩展，可通过本 Skill 交互创建 Bug
5. 中文字段通过 `curl.exe --data-urlencode` 传入避免乱码
6. **creator/reporter 字段说明**：TAPD 中 Bug 的 `reporter`（报告人）和 `creator` 由 API 认证身份决定，始终显示 API 账号名（如 `CiOzjwRC`）。要让其显示真实用户名（如 `刘晓康`），需要登录 TAPD 界面为该用户生成专属 API Token，然后替换 `config.json` 凭据。`current_owner`（处理人）已设置为 `real_user`，可正常显示。