/**
 * 默认用例.spec.ts
 *
 * 录制时间：2026-05-25T03:30:56.831Z
 * 目标页面：
 * 操作类型：其他
 * 生成工具：dom-recorder (Selector 模式)
 */

import { test, expect } from '@fixture/auth-fixture';

test('默认用例', async ({ page }) => {
  console.log(`[test] 当前页面 URL：${page.url()}`);

  // [11:32:21] 单击 → span.ant-menu-title-content["系统配置"]
  await page.click('span:has-text("系统配置")');

  // [11:32:23] 单击 → span.ant-menu-title-content["元数据"]
  await page.click('span:has-text("元数据")');

  // [11:32:28] 单击 → span.ant-menu-title-content["基础数据"]
  await page.click('span:has-text("基础数据")');

  // [11:32:29] 单击 → span.ant-menu-title-content["组织管理"]
  await page.click('span:has-text("组织管理")');

  // [11:32:32] 单击 → a["人员-组织"]
  await page.click('a:has-text("人员-组织")');

  console.log('[pass] 测试通过');
});
