# CoDesign MCP API 参考

> 本文档供 design-analyze Skill 使用，涵盖 `codesign-mcp` MCP 服务器提供的所有工具。

---

## 1. MCP 服务器配置

### 安装

```bash
npx -y codesign-mcp@latest
```

### opencode.jsonc 配置

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

### 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `CODESIGN_WORKSPACE_DIR` | 自动检测 | 工作空间根目录 |
| `CODESIGN_DATA_DIR` | `<workspace>/.codesign-mcp` | 数据存储目录 |
| `CODESIGN_PROFILE_DIR` | `<dataDir>/profile` | Chromium 持久化 Profile |
| `CODESIGN_ARTIFACTS_DIR` | `<dataDir>/artifacts` | 下载资源目录 |
| `CODESIGN_LOG_FILE` | `<dataDir>/codesign-mcp.log` | 日志文件路径 |
| `CODESIGN_IDLE_MS` | `600000`（10分钟） | 浏览器空闲关闭超时 |
| `CODESIGN_KEEP_BROWSER` | `false` | 设为 `1`/`true` 保持浏览器常驻 |

---

## 2. 工具清单

### 2.1 codesign_status — 检查运行状态

**用途**：检查 MCP 服务器路径、浏览器状态、登录状态。**每次使用前先调用此工具。**

**输入**：无参数

**输出**：

```json
{
  "version": "0.1.8",
  "config": {
    "workspaceRoot": "E:/006Skills",
    "dataDir": "E:/006Skills/.codesign-mcp",
    "profileDir": "E:/006Skills/.codesign-mcp/profile"
  },
  "profile": { "exists": true, "byteSize": 12345678 },
  "browser": { "running": true, "mode": "headless" }
}
```

---

### 2.2 codesign_login — 登录 CoDesign

**用途**：打开 Chromium 浏览器让用户扫码登录。如已登录则立即返回。

**输入**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `waitMs` | integer | 否 | 最长等待时间（毫秒），默认 600000（10分钟） |

**输出（已登录）**：

```json
{
  "ok": true,
  "stage": "already-logged-in",
  "user": { "id": 123456, "uuid": "xxx", "has_password": true }
}
```

**输出（刚登录）**：

```json
{
  "ok": true,
  "stage": "just-logged-in",
  "user": { "id": 123456, "uuid": "xxx", "has_password": true }
}
```

**输出（超时）**：

```json
{
  "ok": false,
  "stage": "timeout-or-cancelled",
  "lastStatus": 401,
  "hint": "Re-run codesign_login"
}
```

---

### 2.3 codesign_logout — 退出登录

**输入**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `confirm` | boolean | 是 | 必须为 `true`，清除持久化 Profile |

---

### 2.4 list_artboards — 获取画板列表

**用途**：解析分享链接，返回所有设计和画板信息。**这是 CoDesign 流程的入口工具。**

**输入**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `sharingUrl` | string | 是 | CoDesign 分享链接或分享 ID |
| `password` | string | 否 | 分享链接密码（如果有） |

**URL 格式支持**：

| URL 格式 | 示例 |
|---------|------|
| 分享链接（推荐） | `https://codesign.qq.com/s/abc123` |
| 分享链接（带 app 前缀） | `https://codesign.qq.com/app/s/abc123` |
| 纯数字 ID | `681061312299654` |

> ⚠️ **不支持**设计链接格式 `https://codesign.qq.com/app/design/681061312299654/`，需引导用户创建分享链接。

**输出**：

```json
{
  "ok": true,
  "sharingId": "681061312299654",
  "title": "设计项目名称",
  "designCount": 2,
  "screenCount": 8,
  "designs": [
    {
      "id": 1001,
      "name": "移动端设计",
      "screens": [
        {
          "id": 2001,
          "objectId": "abc123def456",
          "name": "首页",
          "width": 375,
          "height": 812,
          "metaUrl": "https://cdn4.codesign.qq.com/meta/...",
          "slicesUrl": "https://cdn4.codesign.qq.com/screen-slices/...",
          "image": {
            "url": "https://cdn4.codesign.qq.com/screens/...",
            "coverUrl": "https://cdn4.codesign.qq.com/screens/...cover...",
            "width": 375,
            "height": 812,
            "mime": "image/png",
            "size": 123456
          }
        }
      ]
    }
  ]
}
```

---

### 2.5 get_artboard_spec — 获取画板规格数据

**用途**：获取画板的完整设计规格（图层、文字、颜色、CSS、切图等）。**核心数据提取工具。**

**输入**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `sharingUrl` | string | 是 | 分享链接 |
| `password` | string | 否 | 分享密码 |
| `screenId` | integer\|string | 否* | 画板 ID（优先级最高） |
| `objectId` | string | 否* | 画板 object_id |
| `screenName` | string | 否* | 画板名称 |
| `layerObjectId` | string | 否 | 只返回指定图层数据 |
| `includeSlices` | boolean | 否 | 是否包含切图数据，默认 true |

> *选择器优先级：`screenId` > `objectId` > `screenName`。如果只有一个画板，可省略选择器。如果有多个画板但未指定，返回 `SCREEN_SELECTOR_REQUIRED` 错误。

**输出关键字段**：

```json
{
  "ok": true,
  "sharingId": "681061312299654",
  "screen": { "id": 2001, "objectId": "abc123", "name": "首页" },
  "spec": {
    "artboard": {
      "objectId": "abc123",
      "name": "首页",
      "pageId": "page_xyz",
      "pageName": "Page 1",
      "width": 375,
      "height": 812,
      "rect": { "x": 0, "y": 0, "width": 375, "height": 812 }
    },
    "layers": [
      {
        "parent_id": "...",
        "object_id": "...",
        "type": "text",
        "name": "标题",
        "rect": { "x": 20, "y": 100, "width": 335, "height": 40 },
        "content": "欢迎使用",
        "fontSize": 28,
        "fontFace": "PingFang SC",
        "fontWeight": "bold",
        "textAlign": "center",
        "letterSpacing": 0,
        "lineHeight": 40,
        "color": { "r": 51, "g": 51, "b": 51, "a": 1 },
        "opacity": 1,
        "css": ["font-size: 28px", "font-weight: bold"],
        "fills": [],
        "borders": [],
        "shadows": [],
        "effects": []
      }
    ],
    "groups": [
      { "parent_id": "...", "object_id": "...", "type": "group", "name": "导航栏", "rect": {...} }
    ],
    "css": ["/* artboard-level CSS */"],
    "slices": [
      {
        "name": "icon-home",
        "object_id": "...",
        "rect": { "x": 10, "y": 10, "width": 24, "height": 24 },
        "exportables": [
          {
            "name": "icon-home",
            "scale": 1,
            "format": "png",
            "screenshot": { "url": "...", "mime": "image/png", "length": 1234 }
          }
        ]
      }
    ]
  }
}
```

---

### 2.6 get_artboard_image — 获取画板图片

**输入**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `sharingUrl` | string | 是 | 分享链接 |
| `screenId` | integer\|string | 否* | 画板 ID |
| `objectId` | string | 否* | 画板 object_id |
| `screenName` | string | 否* | 画板名称 |
| `variant` | string | 否 | `"full"` 或 `"cover"`，默认 `"full"` |
| `download` | boolean | 否 | 是否下载到本地，默认 false |

---

### 2.7 download_slice — 下载切图资源

**输入**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `sharingUrl` | string | 是 | 分享链接 |
| `layerObjectId` | string | 是 | 切图 object_id |
| `screenId` | integer\|string | 否* | 画板 ID |
| `format` | string | 否 | 过滤格式（png/jpg/svg） |
| `scales` | number[] | 否 | 过滤倍图（[1, 2]） |

---

### 2.8 debug_collect_network — 调试网络请求

**输入**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `sharingUrl` | string | 是 | 分享链接 |
| `timeoutMs` | integer | 否 | 超时时间，默认 15000 |
| `includeHeaders` | boolean | 否 | 是否包含请求头，默认 false |

---

## 3. 认证说明

### 登录流程

1. 调用 `codesign_status` 检查是否已登录
2. 如未登录，调用 `codesign_login`
3. 用户在弹出的浏览器中扫码登录
4. 登录态保存在 `<workspace>/.codesign-mcp/profile/` 目录，下次自动复用

### 分享链接认证

| 类型 | 认证方式 |
|------|---------|
| 公开分享 | 无需认证 |
| 密码保护 | 传入 `password` 参数 |
| 私有设计 | 需要登录后使用 |

---

## 4. 错误码

| 错误码 | 说明 |
|--------|------|
| `INVALID_SHARING_URL` | URL 格式无效，不支持 `/app/design/` 格式 |
| `NEED_PASSWORD` | 分享链接需要密码 |
| `NEED_LOGIN` | 需要登录后访问 |
| `SCREEN_SELECTOR_REQUIRED` | 多画板时必须指定 screenId/objectId/screenName |
| `META_FETCH_FAILED` | CDN meta 数据获取失败 |

---

## 5. 运行时文件

| 路径 | 说明 |
|------|------|
| `.codesign-mcp/profile/` | Chromium 持久化 Profile（登录态） |
| `.codesign-mcp/artifacts/` | 下载的切图和资源文件 |
| `.codesign-mcp/codesign-mcp.log` | 运行日志 |