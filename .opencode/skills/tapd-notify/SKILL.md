---
name: tapd-notify
description: >
  企业微信 Webhook 推送测试报告和通知，支持需求分析、测试计划、执行结果、Bug告警等5种通知类型。
  触发词：/tapd-notify、推送通知、企业微信通知、测试报告推送。
  当用户提到"通知团队"、"推送报告"、"发企微消息"等涉及通知推送的请求时，必须使用此 Skill。
---

## 功能概述

本 Skill 通过企业微信 Webhook 推送测试相关的通知，支持 5 种通知类型，帮助团队及时了解测试进展。

## 触发方式

### 命令式

```
/tapd-notify analysis                          # 推送需求分析完成通知
/tapd-notify plan --plan=xxx --story=yyy       # 推送测试计划创建通知
/tapd-notify result --plan=xxx --story=yyy     # 推送测试执行结果通知
/tapd-notify bug --bug=xxx --story=yyy          # 推送新 Bug 通知
/tapd-notify critical --bug=xxx --story=yyy    # 推送严重 Bug 告警
```

### 对话式

用户说类似："通知团队测试完成了"、"推个报告到企微"、"发个 Bug 通知"。

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
  "wechat_webhook_url": "",
  "wechat_mentioned_list": [],
  "wechat_mentioned_mobile_list": []
}
```

> **注意**：`wechat_webhook_url` 为企业微信机器人 Webhook 地址，格式：`https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxx`。
> `wechat_mentioned_list` 为 @成员的 userid 列表，`wechat_mentioned_mobile_list` 为 @成员的手机号列表。

## 通知类型

### 1. ANALYSIS_COMPLETE — 需求分析完成通知

推送需求分析完成的消息，包含需求基本信息和分析摘要。

### 2. TEST_PLAN_CREATED — 测试计划创建通知

推送测试计划创建的消息，包含计划名称、用例数量、关联需求。

### 3. TEST_EXECUTION_COMPLETE — 测试执行完成通知

推送测试执行结果的消息，包含通过率、失败用例列表。

### 4. NEW_BUG — 新 Bug 提醒

推送新创建 Bug 的通知，包含 Bug 标题、严重程度、关联需求。

### 5. CRITICAL_BUG — 严重 Bug 告警

推送严重/致命 Bug 的告警，需要特别关注，会 @指定人。

## 消息格式

### Markdown 格式（推荐）

```json
{
  "msgtype": "markdown",
  "markdown": {
    "content": "## 测试报告通知\n> 需求: **{story_name}**\n> 计划: **{plan_name}**\n\n### 执行结果\n| 状态 | 数量 |\n|------|------|\n| ✅ 通过 | 20 |\n| ❌ 失败 | 3 |\n| ⚠️ 阻塞 | 2 |\n\n**通过率: 80%**",
    "mentioned_list": ["zhangsan", "lisi"],
    "mentioned_mobile_list": ["13800138000"]
  }
}
```

**限制**：
- Markdown 内容最大 4096 字节
- 超长内容自动截断，末尾添加 `...(内容过长已截断)`
- 支持 @指定人（通过 mentioned_list 和 mentioned_mobile_list）

### Template Card 格式

```json
{
  "msgtype": "template_card",
  "template_card": {
    "card_type": "text_notice",
    "source": {
      "desc": "TAPD测试通知"
    },
    "main_title": {
      "desc": "测试执行完成"
    },
    "main_desc": "需求: {story_name}\n通过率: 80%",
    "emphasis_content": {
      "desc": "80%",
      "title": "通过率"
    },
    "sub_title": {
      "desc": "查看详情"
    },
    "sub_desc": "点击查看TAPD测试报告",
    "horizontal_content_list": [
      { "keyname": "通过", "value": "20" },
      { "keyname": "失败", "value": "3" },
      { "keyname": "阻塞", "value": "2" }
    ],
    "card_action": {
      "type": 1,
      "url": "https://www.tapd.cn/xxx"
    }
  }
}
```

## API 调用

### 发送通知

```bash
curl.exe -X POST "{wechat_webhook_url}" \
  -H "Content-Type: application/json" \
  -d '{消息JSON}'
```

### 限流规则

- 企业微信 Webhook 限流：每个机器人 **20 条/分钟**
- 如果超过限流，自动等待 60 秒后重试
- Markdown 内容最大 **4096 字节**，超长自动截断

## 通知模板

每种通知类型都有对应的 markdown 模板文件，存放在 `templates/` 目录下。模板中使用 `{{变量名}}` 格式的占位符，发送前替换为实际值。

| 模板文件 | 通知类型 | 占位符 |
|---------|---------|--------|
| `analysis-complete.md` | 需求分析完成 | `{{story_name}}`, `{{story_id}}`, `{{feature_count}}`, `{{risk_summary}}` |
| `test-plan-created.md` | 测试计划创建 | `{{plan_name}}`, `{{plan_id}}`, `{{case_count}}`, `{{story_id}}` |
| `test-execution-complete.md` | 测试执行完成 | `{{total}}`, `{{passed}}`, `{{failed}}`, `{{blocked}}`, `{{pass_rate}}`, `{{story_id}}` |
| `new-bug.md` | 新 Bug 提醒 | `{{bug_title}}`, `{{bug_id}}`, `{{severity}}`, `{{story_id}}` |
| `critical-bug.md` | 严重 Bug 告警 | `{{bug_title}}`, `{{bug_id}}`, `{{severity}}`, `{{story_id}}`, `{{description}}` |

## 错误处理

| 场景 | 处理方式 |
|------|---------|
| webhook URL 未配置 | 提示用户在 config.json 中填写 wechat_webhook_url |
| webhook URL 格式错误 | 提示正确的 URL 格式：`https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxx` |
| 发送失败（非 200） | 检查 URL 和网络，自动重试 1 次 |
| 限流（429） | 等待 60 秒后重试 |
| 消息超过 4096 字节 | 自动截断内容，末尾添加截断标记 |

## 企业微信 Webhook API 参考

详细 API 文档请参考 `references/wechat-webhook-api.md`。

## 与其他 Skill 的协作

- **tapd-analyze**：分析完成后推送通知（ANALYSIS_COMPLETE）
- **tapd-gen**：用例创建完成后推送通知（TEST_PLAN_CREATED）
- **tapd-sync**：同步完成后推送通知（TEST_EXECUTION_COMPLETE）
- **tapd-bug**：Bug 创建后推送通知（NEW_BUG / CRITICAL_BUG）
- **tapd-test**：作为全流程编排的最后环节

## 注意事项

1. `wechat_webhook_url` 必须在 config.json 中配置，否则无法发送通知
2. Markdown 内容限制 4096 字节，超长内容自动截断
3. 企业微信限流 20 条/分钟，连续发送多条通知时注意间隔
4. CRITICAL_BUG 类型会自动 @ config.json 中配置的相关人员
5. Windows 环境下使用 `curl.exe` 而非 `curl`（PowerShell 别名）