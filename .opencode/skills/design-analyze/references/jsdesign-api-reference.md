# JSDesign Playwright 提取参考

> 本文档供 design-analyze Skill 使用，记录通过 Playwright 浏览器自动化从 JSDesign 提取设计数据的方法。

---

## 1. 核心原则

**零插件设计**：JSDesign 的数据提取完全通过 Playwright 浏览器自动化完成，无需安装任何 JSDesign 插件或 MCP 服务器。用户只需在浏览器中登录一次，之后自动复用登录态。

---

## 2. Playwright MCP 工具清单

| 工具 | 用途 |
|------|------|
| `browser_navigate` | 导航到 JSDesign URL |
| `browser_snapshot` | 获取页面无障碍树（节点层级、文字、角色） |
| `browser_evaluate` | 执行 JS 代码提取设计数据 |
| `browser_click` | 点击切换画板/页面 |
| `browser_take_screenshot` | 截取画板截图 |
| `browser_wait_for` | 等待页面加载/元素出现 |
| `browser_type` | 在输入框中输入文字（如搜索） |

---

## 3. 提取流程

### 3.1 导航与登录

```
1. browser_navigate → 打开设计链接
2. browser_snapshot → 检测页面状态
3. 如果在登录页 → 等待用户扫码/输入账号密码
4. browser_snapshot → 确认已进入设计页面
```

### 3.2 获取画板列表

```
1. browser_navigate → 导航到设计文件首页（不带 ?p= 参数）
2. browser_snapshot → 获取左侧画板列表
3. browser_evaluate → 提取画板名称和 ID
```

### 3.3 逐画板提取规格

```
对每个画板：
1. browser_click → 点击目标画板（在左侧列表中）
2. browser_wait_for → 等待画板内容加载完成
3. browser_snapshot → 获取画板的无障碍树（节点层级、文字内容）
4. browser_evaluate → 执行 JS 提取详细信息：
   - 节点位置和尺寸
   - 文字内容和字体
   - 颜色和样式
   - 组件类型
5. browser_take_screenshot → 截取画板截图（可选）
```

### 3.4 多页面处理

```
对每个页面（?p= 参数）：
1. browser_navigate → 导航到带 ?p= 参数的 URL
2. browser_wait_for → 等待页面加载
3. 重复 3.2-3.3 的画板提取流程
```

---

## 4. JS 代码片段

### 4.1 获取画板列表

```javascript
// 从左侧面板获取所有画板
() => {
  // 尝试多种可能的选择器策略
  const selectors = [
    '[class*="screen_list__item"]',
    '[class*="page_list__item"]',
    '[class*="artboard"]'
  ];
  
  for (const sel of selectors) {
    const items = document.querySelectorAll(sel);
    if (items.length > 0) {
      return Array.from(items).map(item => ({
        id: item.id || item.dataset.id || '',
        name: item.textContent?.trim() || '',
        element: item.tagName
      }));
    }
  }
  
  return { fallback: true, message: '无法识别画板列表，使用 snapshot 模式' };
}
```

### 4.2 获取选中画板的节点信息

```javascript
// 从画板视图中提取节点信息
() => {
  const result = {
    nodes: [],
    textCount: 0,
    imageCount: 0
  };
  
  // 遍历所有可见文本节点
  const textNodes = document.querySelectorAll(
    '[class*="text"], [class*="Text"], [data-type="text"]'
  );
  textNodes.forEach(node => {
    result.nodes.push({
      type: 'text',
      content: node.textContent?.trim(),
      fontSize: getComputedStyle(node).fontSize,
      fontFamily: getComputedStyle(node).fontFamily,
      color: getComputedStyle(node).color,
      bounds: node.getBoundingClientRect()
    });
    result.textCount++;
  });
  
  // 遍历所有图片节点
  const imageNodes = document.querySelectorAll(
    '[class*="image"], [class*="Image"], img, svg'
  );
  imageNodes.forEach(node => {
    result.nodes.push({
      type: 'image',
      src: node.src || node.dataset?.src || '',
      bounds: node.getBoundingClientRect()
    });
    result.imageCount++;
  });
  
  return result;
}
```

### 4.3 获取页面标题和尺寸

```javascript
() => {
  const title = document.title;
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight
  };
  // 尝试获取画板尺寸
  const canvas = document.querySelector('[class*="canvas"], [class*="Canvas"], canvas');
  const canvasSize = canvas ? {
    width: parseInt(canvas.style?.width) || canvas.width,
    height: parseInt(canvas.style?.height) || canvas.height
  } : null;
  
  return { title, viewport, canvasSize };
}
```

---

## 5. 降级策略

由于 JSDesign 是 SPA 应用，DOM 结构可能随版本更新变化，因此采用**多级降级策略**：

| 优先级 | 策略 | 说明 |
|--------|------|------|
| 1 | browser_evaluate 精确提取 | 使用 JS 代码直接访问 DOM，提取精确数据 |
| 2 | browser_snapshot 无障碍树 | 使用 Playwright 的无障碍快照获取节点层级和文字 |
| 3 | browser_take_screenshot 截图 | 最后手段，截图供 AI 视觉分析 |

### 降级流程

```
尝试 browser_evaluate 提取精确数据
  ↓ 失败（DOM 结构变化）
尝试 browser_snapshot 获取无障碍树
  ↓ 失败（页面未完全加载）
尝试 browser_take_screenshot 截图 + AI 分析
```

---

## 6. 登录态管理

Playwright MCP 使用持久化浏览器 Profile，登录态自动保存：

- **CoDesign**：通过 `codesign-mcp` 的 `codesign_login` 工具管理，Profile 保存在 `.codesign-mcp/profile/`
- **JSDesign**：通过 Playwright 浏览器直接访问，登录态保存在浏览器 Profile 中

首次使用时用户需要在浏览器中扫码或输入账号密码，之后自动复用。

---

## 7. 与 CoDesign 提取的对比

| 维度 | CoDesign (codesign-mcp) | JSDesign (playwright) |
|------|-------------------------|----------------------|
| **提取方式** | API + CDN JSON | 浏览器自动化 |
| **数据完整度** | 完整（图层/文字/颜色/CSS/切图） | 部分（DOM 结构 + 文字 + 截图 + CSS 属性） |
| **登录** | 扫码一次，自动复用 | 浏览器登录，自动复用 |
| **是否需要插件** | 不需要 | 不需要 |
| **稳定性** | 高（基于官方 API） | 中（依赖 DOM 结构，可能随版本变化） |
| **降级策略** | 无需降级 | 多级降级（evaluate → snapshot → screenshot） |

---

## 8. 注意事项

1. JSDesign 的 DOM 结构没有官方文档，提取逻辑依赖无障碍树和常见选择器模式
2. `browser_evaluate` 中的 JS 代码应以**容错优先**：先尝试精确选择器，失败则降级到通用选择器
3. 截图模式是最后的降级手段，依赖 AI 视觉分析能力
4. 多页面设计文件需要逐页导航提取（`?p=` 参数）
5. Playwright 浏览器保持登录态，同一会话内无需重复登录