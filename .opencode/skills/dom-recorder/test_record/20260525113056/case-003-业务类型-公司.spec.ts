/**
 * 业务类型-公司.spec.ts
 *
 * 录制时间：2026-05-25T03:30:56.831Z
 * 目标页面：业务类型-公司
 * 操作类型：查询验证
 * 生成工具：dom-recorder (Selector 模式)
 */

import { test, expect } from '@fixture/auth-fixture';

test('业务类型-公司', async ({ page }) => {
  console.log(`[test] 当前页面 URL：${page.url()}`);

  // [11:34:17] 单击 → span.surely-table-header-cell-title-inner.surely-table-cell-text-ellipsis["主键"]
  await page.click('span:has-text("主键")');

  // [11:34:18] 单击 → span.surely-table-header-cell-title-inner.surely-table-cell-text-ellipsis["状态"]
  await page.click('span:has-text("状态")');

  // [11:34:18] 单击 → div.surely-table-cell.surely-table-header-cell["协定方备货"]
  try {
      await page.click('[role="cell"]:has-text("协定方备货")', { timeout: 3000 });
    } catch {
      try {
        await page.click('[role="cell"]', { timeout: 3000 });
      }
    }

  // [11:34:19] 单击 → span.surely-table-header-cell-title-inner.surely-table-cell-text-ellipsis["协定方备货
  await page.click('span:has-text("协定方备货")');

  // [11:34:19] 单击 → div.css-dev-only-do-not-override-1p3hq3p.ant-spin
  await page.click('div');

  // [11:34:19] 双击 → div.css-dev-only-do-not-override-1p3hq3p.ant-spin
  await page.dblclick('div');

  // [11:34:19] 单击 → span.surely-table-header-cell-title-inner.surely-table-cell-text-ellipsis["协定方备货
  await page.click('span:has-text("协定方备货")');

  // [11:34:19] 单击 → div.css-dev-only-do-not-override-1p3hq3p.ant-spin
  await page.click('div');

  // [11:34:20] 单击 → div.surely-table-cell.surely-table-header-cell["公司"]
  try {
      await page.click('[role="cell"]:has-text("公司")', { timeout: 3000 });
    } catch {
      try {
        await page.click('[role="cell"]', { timeout: 3000 });
      }
    }

  // [11:34:20] 单击 → div.css-dev-only-do-not-override-1p3hq3p.ant-spin
  await page.click('div');

  // [11:34:20] 双击 → div.css-dev-only-do-not-override-1p3hq3p.ant-spin
  await page.dblclick('div');

  // [11:34:20] 单击 → div.surely-table-cell.surely-table-header-cell["公司"]
  try {
      await page.click('[role="cell"]:has-text("公司")', { timeout: 3000 });
    } catch {
      try {
        await page.click('[role="cell"]', { timeout: 3000 });
      }
    }

  // [11:34:21] 单击 → span.surely-table-drag-placeholder
  await page.click('span');

  // [11:34:22] 单击 → span.surely-table-header-cell-title-inner.surely-table-cell-text-ellipsis["NC编码"
  await page.click('span:has-text("NC编码")');

  // [11:34:22] 单击 → span.surely-table-header-cell-title-inner.surely-table-cell-text-ellipsis["配送中心"
  await page.click('span:has-text("配送中心")');

  // [11:34:23] 单击 → span.surely-table-header-cell-title-inner.surely-table-cell-text-ellipsis["备注"]
  await page.click('span:has-text("备注")');

  // [11:34:23] 单击 → span.surely-table-header-cell-title-inner.surely-table-cell-text-ellipsis["创建人"]
  await page.click('span:has-text("创建人")');

  // [11:34:24] 单击 → span.surely-table-header-cell-title-inner.surely-table-cell-text-ellipsis["NC编码"
  await page.click('span:has-text("NC编码")');

  // [11:34:25] 单击 → div.surely-table-header-cell-title.surely-table-header-cell-filter-title["配送中心"]
  await page.click('div:has-text("配送中心")');

  // [11:34:25] 单击 → span.surely-table-header-cell-title-inner.surely-table-cell-text-ellipsis["配送中心"
  await page.click('span:has-text("配送中心")');

  // [11:34:26] 单击 → span.surely-table-header-cell-title-inner.surely-table-cell-text-ellipsis["公司"]
  await page.click('span:has-text("公司")');

  // [11:34:27] 单击 → div.surely-table-cell-inner["国药集团冯了性（佛山）药材饮片有限公司"]
  await page.click('div:has-text("国药集团冯了性（佛山）药材饮片有限公司")');

  // [11:34:27] 单击 → div.surely-table-center-container["2026-03-04 16:28:58 2029111850020503552 集团 国药
  await page.click('div:has-text("2026-03-04 16:28:58 2029111850")');

  // [11:34:27] 单击 → div.surely-table-cell-content.surely-table-cell-text-ellipsis["国药集团冯了性（佛山）药材饮片有限
  await page.click('div:has-text("国药集团冯了性（佛山）药材饮片有限公司")');

  // [11:34:28] 单击 → div.surely-table-cell-content.surely-table-cell-text-ellipsis["国药集团冯了性（佛山）药材饮片有限
  await page.click('div:has-text("国药集团冯了性（佛山）药材饮片有限公司")');

  // [11:34:28] 单击 → div.surely-table-cell-content.surely-table-cell-text-ellipsis["国药集团冯了性（佛山）药材饮片有限
  await page.click('div:has-text("国药集团冯了性（佛山）药材饮片有限公司")');

  // [11:34:28] 双击 → div.surely-table-cell-content.surely-table-cell-text-ellipsis["国药集团冯了性（佛山）药材饮片有限
  await page.dblclick('div:has-text("国药集团冯了性（佛山）药材饮片有限公司")');

  // [11:34:29] 单击 → div.tcm-form-button-warpper["返回列表 刷新 新增 修改 删除 启用 停用 4/30"]
  await page.click('div:has-text("返回列表 刷新 新增 修改 删除 启用 停用 4/30")');

  // [11:34:30] 单击 → span["返回列表"]
  await page.click('span:has-text("返回列表")');

  // [11:34:32] 单击 → div.tcm-handle-buttons-warpper["新增 修改 删除 启用 停用 当前导出 全部导出 下载模板 导入excel"]
  await page.click('div:has-text("新增 修改 删除 启用 停用 当前导出 全部导出 下载模板 ")');

  console.log('[pass] 测试通过');
});
