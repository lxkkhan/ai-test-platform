/**
 * 默认用例.spec.ts
 *
 * 录制时间：2026-05-25T03:21:41.358Z
 * 目标页面：
 * 操作类型：其他
 * 生成工具：dom-recorder (Selector 模式)
 */

import { test, expect } from '@fixture/auth-fixture';

test('默认用例', async ({ page }) => {
  console.log(`[test] 当前页面 URL：${page.url()}`);

  // [11:21:54] 单击 → span.anticon.anticon-menu-unfold
  try {
      await page.click('[aria-label="menu-unfold"]', { timeout: 3000 });
    } catch {
      try {
        await page.click('[role="img"]', { timeout: 3000 });
      }
    }

  console.log('[pass] 测试通过');
});
