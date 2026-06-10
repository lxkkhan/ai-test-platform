/**
 * 人员-组织.spec.ts
 *
 * 录制时间：2026-05-25T03:30:56.831Z
 * 目标页面：人员-组织
 * 操作类型：查询验证
 * 生成工具：dom-recorder (Selector 模式)
 */

import { test, expect } from '@fixture/auth-fixture';

test('人员-组织', async ({ page }) => {
  console.log(`[test] 当前页面 URL：${page.url()}`);

  // [11:32:44] 输入 → input#form_item_name_62e4527dc0d644f19cef3b875ee25060.ant-input.css-dev-only-do-
  try {
      await page.fill('#form_item_name_62e4527dc0d644f19cef3b875ee25060', '2', { timeout: 3000 });
    } catch {
      try {
        await page.fill('input[placeholder*="请输入"]', '2', { timeout: 3000 });
    } catch {
      try {
        await page.fill('input:has-text("2")', '2', { timeout: 3000 });
      }
      }
    }

  // [11:32:45] 输入 → input#form_item_name_62e4527dc0d644f19cef3b875ee25060.ant-input.ant-input-status
  try {
      await page.fill('#form_item_name_62e4527dc0d644f19cef3b875ee25060', '22', { timeout: 3000 });
    } catch {
      try {
        await page.fill('input[placeholder*="请输入"]', '22', { timeout: 3000 });
    } catch {
      try {
        await page.fill('input:has-text("22")', '22', { timeout: 3000 });
      }
      }
    }

  // [11:32:45] 输入 → input#form_item_name_62e4527dc0d644f19cef3b875ee25060.ant-input.ant-input-status
  try {
      await page.fill('#form_item_name_62e4527dc0d644f19cef3b875ee25060', '222', { timeout: 3000 });
    } catch {
      try {
        await page.fill('input[placeholder*="请输入"]', '222', { timeout: 3000 });
    } catch {
      try {
        await page.fill('input:has-text("222")', '222', { timeout: 3000 });
      }
      }
    }

  // [11:32:46] 单击 → span["查询"]
  await page.click('span:has-text("查询")');

  // [11:32:47] 单击 → path
  await page.click('path');

  // [11:32:48] 单击 → span["查询"]
  await page.click('span:has-text("查询")');

  // [11:32:50] 输入 → input#form_item_name_1b350ee61e714742941b0dd466110a0b.ant-input.css-dev-only-do-
  try {
      await page.fill('#form_item_name_1b350ee61e714742941b0dd466110a0b', '2', { timeout: 3000 });
    } catch {
      try {
        await page.fill('input[placeholder*="请输入"]', '2', { timeout: 3000 });
    } catch {
      try {
        await page.fill('input:has-text("2")', '2', { timeout: 3000 });
      }
      }
    }

  // [11:32:50] 输入 → input#form_item_name_1b350ee61e714742941b0dd466110a0b.ant-input.ant-input-status
  try {
      await page.fill('#form_item_name_1b350ee61e714742941b0dd466110a0b', '22', { timeout: 3000 });
    } catch {
      try {
        await page.fill('input[placeholder*="请输入"]', '22', { timeout: 3000 });
    } catch {
      try {
        await page.fill('input:has-text("22")', '22', { timeout: 3000 });
      }
      }
    }

  // [11:32:50] 输入 → input#form_item_name_1b350ee61e714742941b0dd466110a0b.ant-input.ant-input-status
  try {
      await page.fill('#form_item_name_1b350ee61e714742941b0dd466110a0b', '222', { timeout: 3000 });
    } catch {
      try {
        await page.fill('input[placeholder*="请输入"]', '222', { timeout: 3000 });
    } catch {
      try {
        await page.fill('input:has-text("222")', '222', { timeout: 3000 });
      }
      }
    }

  // [11:32:51] 单击 → span["查询"]
  await page.click('span:has-text("查询")');

  // [11:32:52] 单击 → path
  await page.click('path');

  // [11:32:52] 输入 → input.ant-input-number-input["2"]
  try {
      await page.fill('input[placeholder*="请输入"]', '2', { timeout: 3000 });
    } catch {
      try {
        await page.fill('input:has-text("2")', '2', { timeout: 3000 });
    } catch {
      try {
        await page.fill('[role="spinbutton"]', '2', { timeout: 3000 });
      }
      }
    }

  // [11:32:53] 输入 → input.ant-input-number-input["22"]
  try {
      await page.fill('input[placeholder*="请输入"]', '22', { timeout: 3000 });
    } catch {
      try {
        await page.fill('input:has-text("22")', '22', { timeout: 3000 });
    } catch {
      try {
        await page.fill('[role="spinbutton"]', '22', { timeout: 3000 });
      }
      }
    }

  // [11:32:53] 输入 → input.ant-input-number-input["222"]
  try {
      await page.fill('input[placeholder*="请输入"]', '222', { timeout: 3000 });
    } catch {
      try {
        await page.fill('input:has-text("222")', '222', { timeout: 3000 });
    } catch {
      try {
        await page.fill('[role="spinbutton"]', '222', { timeout: 3000 });
      }
      }
    }

  // [11:32:54] 单击 → span["查询"]
  await page.click('span:has-text("查询")');

  // [11:32:56] 单击 → div.ant-row.ant-form-item-row["手机号码 包含 等于"]
  await page.click('div:has-text("手机号码 包含 等于")');

  // [11:32:57] 按键 → Backspace
  await page.press('input[placeholder*="请输入"]', 'Backspace');

  // [11:32:57] 输入 → input.ant-input-number-input
  try {
      await page.fill('input[placeholder*="请输入"]', '', { timeout: 3000 });
    } catch {
      try {
        await page.fill('[role="spinbutton"]', '', { timeout: 3000 });
      }
    }

  // [11:32:59] 按键 → F2
  await page.press('input[placeholder*="请输入"]', 'F2');

  // [11:33:06] 单击 → div["### Error querying database. Cause: org.postgresql"]
  await page.click('div:has-text("### Error querying database. C")');

  // [11:34:11] 单击 → span["查询"]
  await page.click('span:has-text("查询")');

  // [11:34:12] 单击 → div.surely-table-cell-content.surely-table-cell-text-ellipsis["11153"]
  await page.click('div:has-text("11153")');

  // [11:34:13] 单击 → div.surely-table.surely-table-support-sticky["序号 编码 姓名 状态 NC编码 性别 身份证;自动识别 在职状态 
  await page.click('div:has-text("序号 编码 姓名 状态 NC编码 性别 身份证;自动识别 在")');

  // [11:34:13] 单击 → div.surely-table-cell.surely-table-body-cell
  await page.click('div');

  // [11:34:14] 单击 → div#tag-content["配送中心: 佛山配送中心，国药集团冯了性（佛山）药材饮片有限公司，全局"]
  try {
      await page.click('#tag-content', { timeout: 3000 });
    } catch {
      try {
        await page.click('div:has-text("配送中心: 佛山配送中心，国药集团冯了性（佛山）药材饮片有限")', { timeout: 3000 });
      }
    }

  // [11:34:15] 单击 → a["业务类型-公司"]
  await page.click('a:has-text("业务类型-公司")');

  console.log('[pass] 测试通过');
});
