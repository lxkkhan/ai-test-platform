# 企业微信 Webhook API 参考

> 本文档为 tapd-notify Skill 专用，涵盖企业微信群机器人 Webhook 全部接口。

---

## 1. 概述

企业微信群机器人是通过 Webhook 协议将数据推送到群聊的一种方式。每个机器人对应一个 Webhook URL，格式：

```
https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxx
```

> **关键参数**：`key` 为机器人的 Webhook key，在群机器人设置页面获取。配置在 `config.json` 的 `wechat_webhook_url` 字段中。

---

## 2. 消息类型

### 2.1 文本消息

```json
{
  "msgtype": "text",
  "text": {
    "content": "测试通知文本",
    "mentioned_list": ["zhangsan", "lisi"],
    "mentioned_mobile_list": ["13800138000"]
  }
}
```

- `mentioned_list`：@成员的 userid 列表（`@all` 表示所有人）
- `mentioned_mobile_list`：@成员的手机号列表

### 2.2 Markdown 消息（推荐）

**重要格式限制**：
- **不支持** HTML 表格（`|---|` 会显示成纯文本，非常难看）→ 使用**列表格式**
- **不支持** 三级及以下标题（`###` 不渲染）→ 使用 `##` 或**加粗行**
- **部分 emoji 渲染异常**（可能显示为 `?`）→ 不使用 emoji

```json
{
  "msgtype": "markdown",
  "markdown": {
    "content": "## 测试执行完成\n\n**关联需求**: S-1133671402001000032\n**处理人**: 刘晓康\n\n**通过率: 80%** (20/25)\n\n**执行结果:**\n- 通过: 20\n- 失败: 3\n- 阻塞: 2\n\n> 详细结果请在 TAPD 中查看",
    "mentioned_list": ["zhangsan", "lisi"],
    "mentioned_mobile_list": ["13800138000"]
  }
}
```

**限制**：
- Markdown 内容最大 **4096 字节**
- 支持的 Markdown 语法：标题、加粗、引用、链接、列表、表格
- 不支持图片

### 2.3 模板卡片消息

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
    "main_desc": "需求: 登录功能\n通过率: 80%",
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

---

## 3. 发送消息

**重要**：Windows PowerShell 5.1 中 `curl.exe -d` 传递中文 JSON 会导致编码乱码（中文显示为问号或乱码）。必须使用**文件方式**发送。

### 方式一：文件方式（推荐，避免编码问题）

```bash
# 1. 将 JSON 消息写入临时文件（UTF-8 无 BOM 编码）
# 2. 用 --data-binary @file 方式发送

curl.exe -s -X POST "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxx" \
  -H "Content-Type: application/json" \
  --data-binary "@$TEMP/opencode/wechat_notify.json"
```

### 方式二：PowerShell 方式

```powershell
# 构建消息对象并转为 JSON，写入 UTF-8 无 BOM 文件
$notifyJson = @{
    msgtype = "markdown"
    markdown = @{
        content = "## 测试执行完成`n`n**通过率: 80%** (20/25)"
    }
} | ConvertTo-Json -Depth 5 -Compress

# 注意：PowerShell 5.1 的 ConvertTo-Json 对中文处理有编码问题
# 推荐使用 Write 工具或 [System.IO.File]::WriteAllBytes 写入 UTF-8 文件
$jsonBytes = [System.Text.Encoding]::UTF8.GetBytes($notifyJson)
[System.IO.File]::WriteAllBytes("$env:TEMP\opencode\wechat_notify.json", $jsonBytes)

# 用 curl.exe --data-binary 发送
curl.exe -s -X POST "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxx" `
  -H "Content-Type: application/json" `
  --data-binary "@$env:TEMP\opencode\wechat_notify.json"
```

### 绝对不要使用的方式

```bash
# 错误！PowerShell 5.1 会将中文按 GBK 编码传递给 curl.exe，导致乱码
curl.exe -d '{"msgtype":"markdown","markdown":{"content":"测试通知"}}' ...
# 错误！单引号中的中文在 PowerShell 中会被错误解析
curl.exe -d '中文字符' ...
```

---

## 4. 响应格式

### 成功

```json
{
  "errcode": 0,
  "errmsg": "ok"
}
```

### 失败

```json
{
  "errcode": 40001,
  "errmsg": "invalid webhook url"
}
```

### 常见错误码

| errcode | errmsg | 说明 | 处理 |
|---------|--------|------|------|
| 0 | ok | 成功 | - |
| 40001 | invalid webhook url | Webhook URL 无效 | 检查 config.json 中的 wechat_webhook_url |
| 40002 | content is empty | 消息内容为空 | 检查消息格式 |
| 40003 | invalid msgtype | 消息类型不支持 | 仅支持 text/markdown/template_card |
| 40004 | content is too long | Markdown 内容超过 4096 字节 | 自动截断 |
| 45001 | api minute-quota reached | 超过频率限制 | 等待 60 秒后重试 |

---

## 5. 限流规则

- 每个机器人 **20 条/分钟**
- 超过限流返回 `errcode: 45001`
- 建议多条通知间隔 3 秒以上

---

## 6. @指定人

通过 `mentioned_list` 和 `mentioned_mobile_list` 实现 @指定人：

- `mentioned_list`：企业微信 userid 列表，`@all` 表示所有人
- `mentioned_mobile_list`：手机号列表（非企业微信成员也可）

**配置方式**：在 `config.json` 的 `wechat_mentioned_list` 和 `wechat_mentioned_mobile_list` 中配置。

---

## 7. 内容截断

当 Markdown 内容超过 4096 字节时：

1. 自动截断到 3900 字节（保留 96 字节用于截断标记）
2. 末尾添加 `...(内容过长已截断)`
3. 保留标题和关键信息（优先截断详情部分）