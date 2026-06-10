# TAPD Story 更新 API 参考

> 本文档供 design-analyze Skill 使用，重点说明需求详情的读取和更新 API。

---

## 1. 获取需求详情

### 1.1 获取单个需求

```
GET {api_url}/stories/{story_id}?workspace_id={workspace_id}
```

**返回关键字段**：

| 字段 | 说明 | 格式 |
|------|------|------|
| `id` | 需求ID | 数字字符串 |
| `name` | 标题 | 纯文本 |
| `description` | 详细描述 | **HTML 格式** |
| `status` | 状态 | 英文枚举值 |
| `priority` | 优先级 | `1=紧急, 2=高, 3=中, 4=低` |
| `owner` | 处理人 | 英文用户名 |
| `category_id` | 分类ID | 数字字符串 |
| `created` | 创建时间 | `YYYY-MM-DD HH:mm:ss` |
| `modified` | 修改时间 | `YYYY-MM-DD HH:mm:ss` |

> **重要**：`description` 字段返回的是 HTML 格式内容，其中可能包含设计链接（`<a>` 标签的 `href` 属性）。

### 1.2 提取设计链接的正则

从 `description` HTML 中提取设计链接：

**CoDesign 链接**：

```powershell
# PowerShell 正则匹配
$regex_codesign = 'https?://codesign\.qq\.com/(?:app/s|s|app/design)/[\w/]+[^\s"'<>]*'
```

具体格式：
- 分享链接：`https://codesign.qq.com/app/s/<id>` 或 `https://codesign.qq.com/s/<id>`
- 设计链接：`https://codesign.qq.com/app/design/<id>/<pageId>/inspect`

**JSDesign 链接**：

```powershell
# PowerShell 正则匹配
$regex_jsdesign = 'https?://js\.design/f/\w+(?:\?p=\w+)?[^\s"'<>]*'
```

具体格式：
- 文件链接：`https://js.design/f/<fileKey>?p=<pageId>`

---

## 2. 更新需求详情

### 2.1 更新需求描述（追加分析报告）

```
POST {api_url}/stories/{story_id}
```

**关键参数**：

| 参数 | 说明 | 必填 |
|------|------|------|
| `workspace_id` | 项目ID | 是 |
| `description` | 需求描述（HTML） | 是 |

> ⚠️ **最关键**：更新 description 时会**整体替换**原内容，因此必须先获取原 description，将分析报告**追加到末尾**，然后用合并后的内容提交。

### 2.2 追加回写流程

```
1. GET /stories/{story_id}           → 获取原 description
2. 本地拼接：new_description = original_description + append_html
3. POST /stories/{story_id}          → 更新为 new_description
```

### 2.3 PowerShell 示例

```powershell
# 1. 获取原需求详情
$storyJson = curl.exe -u "${api_user}:${api_password}" `
  "${api_url}/stories/${story_id}?workspace_id=${workspace_id}"

$story = $storyJson | ConvertFrom-Json
$originalDesc = $story.data.Story.description

# 2. 构造追加 HTML
$appendHtml = @"
<hr/>
<h3>📋 设计稿分析报告</h3>
<p><strong>来源平台</strong>：CoDesign</p>
<p><strong>设计链接</strong>：<a href="${sharingUrl}">${sharingUrl}</a></p>
<p><strong>画板数量</strong>：${screenCount}</p>
<h4>🎯 功能点</h4>
<table border="1" cellpadding="4" cellspacing="0">
  <tr><th>功能点</th><th>描述</th><th>风险</th><th>优先级</th></tr>
  ${featureRows}
</table>
"@

# 3. 合并并更新
$newDesc = $originalDesc + $appendHtml
$escapedDesc = $newDesc -replace "'", "''"

curl.exe -u "${api_user}:${api_password}" `
  --data-urlencode "workspace_id=${workspace_id}" `
  --data-urlencode "description=${escapedDesc}" `
  "${api_url}/stories/${story_id}"
```

> **注意**：
> - `description` 内容为 HTML，中文字段必须通过 `--data-urlencode` 传入
> - 原始 description 中的 HTML 标签和属性必须完整保留
> - 追加内容使用 `<hr/>` 分隔符与原内容区分
> - Windows 下使用 `curl.exe` 而非 `curl`

---

## 3. 其他常用 Stories API

### 3.1 获取需求列表

```
GET {api_url}/stories?workspace_id={workspace_id}
```

**常用过滤参数**：

| 参数 | 说明 | 示例 |
|------|------|------|
| `id` | 需求ID | `1120003271001000123` |
| `name` | 标题（模糊匹配） | `登录功能` |
| `status` | 状态 | `new`, `in_progress`, `resolved`, `closed` |
| `priority` | 优先级 | `1=紧急`, `2=高`, `3=中`, `4=低` |
| `owner` | 处理人 | `zhangsan` |

### 3.2 需求状态值映射

| 状态值 | 中文 | 说明 |
|--------|------|------|
| `new` | 新建 | 刚创建 |
| `in_progress` | 开发中 | 正在处理 |
| `resolved` | 已解决 | 开发完成 |
| `closed` | 已关闭 | 已上线 |
| `reopened` | 重新打开 | 需要返工 |
| `rejected` | 已拒绝 | 不做 |
| `planning` | 规划中 | 需求规划 |

### 3.3 优先级值映射

| 值 | 中文 |
|----|------|
| `1` | 紧急 |
| `2` | 高 |
| `3` | 中 |
| `4` | 低 |

---

## 4. HTML 追加模板详细说明

### 4.1 完整追加模板

```html
<hr/>
<h3>📋 设计稿分析报告</h3>
<p><strong>来源平台</strong>：{platform}（CoDesign / JSDesign）</p>
<p><strong>设计链接</strong>：<a href="{source_url}">{source_url}</a></p>
<p><strong>画板数量</strong>：{screen_count} 个</p>
<p><strong>分析时间</strong>：{timestamp}</p>

<h4>🎯 功能点</h4>
<table border="1" cellpadding="4" cellspacing="0">
  <tr style="background-color:#f0f0f0">
    <th>功能点</th>
    <th>描述</th>
    <th>来源画板</th>
    <th>风险等级</th>
    <th>优先级</th>
    <th>测试类型</th>
  </tr>
  <!-- 循环每个 feature -->
  <tr>
    <td>{feature_name}</td>
    <td>{feature_description}</td>
    <td>{source_screens}</td>
    <td>{risk_level}</td>
    <td>{priority}</td>
    <td>{test_type}</td>
  </tr>
</table>

<h4>📐 测试范围</h4>
<p><strong>IN SCOPE</strong>：{in_scope_items}</p>
<p><strong>OUT OF SCOPE</strong>：{out_of_scope_items}</p>

<h4>🔑 测试重点</h4>
<ul>
  <!-- 循环每个测试重点 -->
  <li>{test_focus_item}</li>
</ul>

<h4>✅ 验收标准</h4>
<ul>
  <!-- 循环每个功能点的验收标准 -->
  <li><strong>{feature_name}</strong>：{criteria}</li>
</ul>

<h4>🎨 设计规格摘要</h4>
<p><strong>UI组件</strong>：{ui_components}</p>
<p><strong>交互行为</strong>：{interactions}</p>
<p><strong>主色调</strong>：{colors}</p>
<p><strong>字体规格</strong>：{typography}</p>
```

### 4.2 多画板摘要模板

```html
<h4>📱 画板概览</h4>
<table border="1" cellpadding="4" cellspacing="0">
  <tr style="background-color:#f0f0f0">
    <th>画板名称</th>
    <th>尺寸</th>
    <th>图层数</th>
    <th>切图数</th>
  </tr>
  <!-- 循环每个 screen -->
  <tr>
    <td>{screen_name}</td>
    <td>{width}×{height}</td>
    <td>{layer_count}</td>
    <td>{slice_count}</td>
  </tr>
</table>
```

---

## 5. 错误处理

| 场景 | 处理方式 |
|------|---------|
| story_id 无效或不存在 | 提示用户检查 ID，支持纯数字和 S- 前缀格式 |
| description 为空 | 直接写入分析报告，无需追加 |
| description 更新失败 | 保存本地 JSON 备份，提供 curl 命令供用户手动执行 |
| API 限流（429） | 等待 200ms 后重试 |
| 中文字段乱码 | 确保使用 `--data-urlencode` 传入 |
| 原需求被并发修改 | 重新获取最新 description 后追加，避免覆盖 |

---

## 6. PowerShell 环境注意事项

1. 使用 `curl.exe` 而非 `curl`（PowerShell 别名）
2. description 中的 HTML 特殊字符需要正确转义
3. 大量 HTML 内容建议写入临时文件后使用 `--data-binary @file` 传入
4. TAPD API 返回的 HTML 中 `&#10;` 表示换行，`&amp;` 表示 `&`
5. 中文字段必须通过 `curl.exe --data-urlencode` 传入，避免编码乱码