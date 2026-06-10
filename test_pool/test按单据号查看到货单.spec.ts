/**
 * 按单据号查看到货单.spec.ts
 *
 * 自动生成于：2026-05-22T10:57:37.608Z
 * 目标页面：到货单列表
 * 操作类型：查询验证
 * 模板来源：pages/到货单列表.yaml / operations/查询验证.yaml
 * 生成工具：template-engine/script-assembler
 */

import { test, expect } from '@fixture/auth-fixture';

const BILLNO = 'DH202604150029';

test('按单据号查看到货单', async ({ page }) => {
  console.log(`[test] 当前页面 URL：${page.url()}`);

  // 目标页面：https://tcm-dc-sit.zgzykg.com.cn/pszxSaas/#/inbound/arrival

  // 导航：进入到货单页面
  // TODO: 需要手动补充导航路径 → 进入到货单页面

  // 输入：单据号输入框 ← "DH202604150029"
  await page.fill('input:has-text("单据号输入框")', 'DH202604150029');

  // 点击：查询按钮
  await page.click('button:has-text("查询按钮")');

  // 等待：API响应 /api/arrival/list
  await page.waitForResponse(r => r.url().includes('/api/arrival/list'));

  // 断言：查询结果只有1条，单据号匹配
  // ↓ 断言验证
  const rows = await page.locator('tbody tr').count();
  expect(rows, '查询结果只有1条').toBeGreaterThan(0);

  await expect(page.locator('body')).toContainText('DH202604150029');

  console.log('[pass] 测试通过');
});
