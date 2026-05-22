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

本 Skill 依赖同级目录下的 `config.json`，需包含以下字段：

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
  "modules": ["登录", "注册", "首页", "订单管理"],
  "owner_list": []
}
```

> **注意**：`config.json` 中的 `api_user` 和 `api_password` 为明文，建议加入 `.gitignore` 避免泄露。
> 若使用浏览器扩展，扩展已迁移至 AES-GCM 加密方案（`credentials.enc.js`），不受此 config.json 影响。

## 工作流

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
2. 读取 `config.json` 获取 TAPD 凭证和项目ID
3. 如果缺少必要字段（严重程度、优先级、模块、处理人），向用户追问
4. 组装最终的 Bug 内容，向用户展示预览
5. 用户确认后，通过 curl 调用 TAPD API 提交
6. （可选）如果用户提供了 story_id（需求ID），自动将 Bug 关联到对应需求（见「需求关联」章节）

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
4. （可选）如果用户提供了 story_id，在 Bug 创建成功后自动关联 Bug 到需求（同场景A 步骤 6）

## 需求关联（story_id）

story_id 是可选参数，用于将 Bug 关联到对应的需求（Story），实现全链路追溯。

### 获取 story_id

- 用户可通过 `/tapd-bug S-xxx` 明确指定需求ID
- 也可在对话中提供："提bug 登录按钮无响应，关联需求 S-1120003271001000123"
- 如果不提供 story_id，Bug 正常创建，只是不关联需求
- 默认值从 config.json 的 `default_story_id` 读取（如为空则不关联）

### 关联方式

Bug 创建成功后，调用 Relations API 关联 Bug 到需求：

**方法一（推荐）：专用接口**

```bash
curl.exe -u 'api_user:api_password' \
  -X POST \
  -d "workspace_id={workspace_id}&bug_id={BUG_ID}&story_id={STORY_ID}" \
  '{api_url}/bugs/linked_stories'
```

**方法二：通用接口**

```bash
curl.exe -u 'api_user:api_password' \
  -X POST \
  -d "workspace_id={workspace_id}&source_type=bug&source_id={BUG_ID}&target_type=story&target_id={STORY_ID}" \
  '{api_url}/relations'
```

关联成功后，TAPD 中 Bug 详情页会显示「关联需求」链接，点击可跳转到对应需求页面。

## TAPD API 调用

### 提交 Bug

```bash
curl.exe -u 'api_user:api_password' \
  -d 'title=BUG标题&workspace_id=项目ID&priority_label=中&severity=一般&module=模块&current_owner=处理人&description=描述内容' \
  '$API_URL/bugs'
```

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