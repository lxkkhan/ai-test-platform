# TAPD Bug Reporter

浏览器扩展，在页面上录制操作步骤，一键提交 Bug 到 TAPD。

---

## 安装扩展

1. 打开 Chrome，进入 `chrome://extensions/`
2. 开启右上角「开发者模式」
3. 点击「加载已解压的扩展程序」
4. 选择本目录

---

## 配置 API 凭证

> 凭证以加密形式存储在 `credentials.enc.js` 中，不会上传到任何第三方。

### 步骤一：运行加密脚本

**首次配置需要创建快捷方式（一次搞定，之后双击快捷方式即可）：**

1. 右键 `encrypt-credentials.ps1` → **创建快捷方式**
2. 右键新建的快捷方式 → **属性**
3. 在「目标」最前面添加 `-ExecutionPolicy Bypass `（留空格），变成：
   ```
   powershell.exe -ExecutionPolicy Bypass -File "E:\006Skills\browser-extension\encrypt-credentials.ps1"
   ```
4. 点击确定保存，之后直接双击这个**快捷方式**运行

按提示输入：
- API 账号
- API 密码（TAPD 平台 → 个人设置 → API Token）

脚本会自动将加密后的凭证写入 `credentials.enc.js`。

### 步骤二：刷新扩展

回到 `chrome://extensions/`，点击 TAPD Bug Reporter 的刷新按钮。

### 步骤三：验证连接

在任意页面点击扩展图标或按 `Alt+Q`，打开面板后点击「测试连接」，显示成功即可开始使用。

---

## 使用方法

### 方式一：右键菜单

在任意页面**右键 → 在此提交Bug到TAPD**

### 方式二：快捷键

`Alt+Q` 打开/关闭面板

### 方式三：点击扩展图标

点击浏览器工具栏的扩展图标

---

## 面板功能说明

| 字段 | 说明 |
|------|------|
| 项目 ID | 必填，TAPD 项目 ID（可以从项目 URL 中找到，如 `https://www.tapd.cn/10158231/...`） |
| 需求 ID | 选填，关联的需求 |
| 创建人 | 自动保存，下次打开自动填充 |
| 标题 | Bug 标题 |
| 严重程度 / 优先级 | 下拉选择 |
| 模块 / 负责人 | 下拉选择（从项目中动态获取） |
| 操作步骤 | 自动录制页面上的点击、输入等操作，支持增删改 |
| 截图 / 录屏 | 支持截取当前页面或录制操作过程 |

---

## 加密方案说明

### 为什么需要加密？

`credentials.enc.js` 会包含你的 TAPD API 密钥。如果直接明文存储，任何能看到扩展源码的人都能拿到你的凭证。

### 工作原理

```
明文密码
    ↓  管理员运行 encrypt-credentials.ps1（AES-256-GCM 加密）
加密凭证（存储在 credentials.enc.js）
    ↓  扩展启动时（Service Worker）
    ↓  PBKDF2 密钥派生 + AES-GCM 解密
真实密码 → 内存中使用 → 扩展关闭后释放
```

- **算法**：AES-256-CBC + HMAC-SHA256（PowerShell 5.1 兼容，浏览器端 `crypto.subtle` 解密）
- **密钥派生**：PBKDF2，100000 次迭代，SHA-256
- **IV**：每次加密随机生成，存储在 `credentials.enc.js` 的 `iv` 字段
- **口令**：硬编码在 `background.js` 中（`ENC_PASSPHRASE`），与脚本中一致

### 安全边界

- 口令 + salt + IV 都在代码中，理论上仍可被逆向
- 但 AES-GCM 比 XOR / Base64 多了验证标签（Authentication Tag），无法篡改密文
- 适合的场景：团队内部分发扩展，不希望成员直接看到 API 密钥

---

## OpenCode Skill 集成

本扩展可以通过 OpenCode 的 `tapd-bug` skill 提 Bug。

触发方式：
- 输入「提bug」「提交bug」「tapd提bug」等关键词
- skill 会自动记录你的操作步骤，生成格式化描述

---

## 目录结构

```
browser-extension/
├── background.js          # Service Worker，API 调用、凭证解密
├── content.js             # 面板 UI、操作录制、提交逻辑
├── content.css            # 样式
├── credentials.enc.js     # 加密后的凭证（由脚本生成，不提交到 git）
├── encrypt-credentials.ps1  # 管理员加密工具
├── manifest.json          # 扩展配置
├── icons/                 # 扩展图标
└── .gitignore             # 忽略 credentials.enc.js 和 *.bak
```

---

## 常见问题

**Q: 测试连接显示「管理员尚未配置 API 凭证」**

A: 运行 `encrypt-credentials.ps1` 生成凭证后，刷新扩展。

**Q: 忘记运行脚本，直接把凭证写在 background.js 里可以吗？**

A: 可以，但请勿将扩展分发给其他人。明文凭证会被别人看到。

**Q: 多台机器如何配置？**

A: 每台机器单独运行 `encrypt-credentials.ps1`，生成的密文不同（因为 IV 随机），但都能用同一套 passphrase 解密。