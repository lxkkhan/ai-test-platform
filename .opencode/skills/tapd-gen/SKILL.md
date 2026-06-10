---
name: tapd-gen
description: AI 生成测试用例并写入 TAPD（含 story_id 关联），支持批量生成、分类标记和用户审核。触发词：/tapd-gen、生成用例、写测试用例、tapd生成用例。当用户提到"生成测试用例"、"为需求写用例"、"测试用例设计"等涉及用例生成的请求时，必须使用此 Skill。
metadata:
  audience: testers
  workflow: tapd
---

## 功能概述

本 Skill 根据需求分析结果，AI 生成测试用例并写入 TAPD。支持正面用例、反面用例、交互用例三种类型，所有用例通过 story_id 关联到对应需求。

支持两种审核模式：
1. **默认模式**：生成后展示所有用例，用户确认后再上传到 TAPD
2. **自动模式**：`--auto` 标记，跳过审核直接上传（建议仅在准确度 ≥ 90% 时使用）

## 触发方式

### 命令式

```
/tapd-gen S-xxx                    # 分析需求并生成用例（需用户确认）
/tapd-gen S-xxx --auto             # 自动模式，跳过审核直接上传
```

### 对话式

用户说类似："帮我为 S-xxx 生成测试用例"、"给这个需求写用例"。

## 配置文件

本 Skill 依赖 `config.json`，通过 `_extends` 引用共享凭证 `_shared/tapd-config.json`：

```json
{
  "_extends": "../_shared/tapd-config.json",
  "auto_upload": false
}
```

> **共享凭证**：所有 TAPD Skill 的共用字段统一在 `_shared/tapd-config.json` 管理。
>
> `auto_upload` 默认为 `false`，即默认需要用户确认后上传。

## 工作流

### 第一步：接收需求分析结果

接收 tapd-analyze 的 JSON 输出，或直接根据 story_id 拉取需求信息。输入格式：

```json
{
  "story_id": "S-xxx",
  "story_name": "需求标题",
  "analysis_result": {
    "features": [...],
    "test_scope": { "in_scope": [...], "out_of_scope": [...] },
    "test_focus": [...]
  }
}
```

如果没有分析结果，自动拉取需求并分析。

### 第二步：AI 生成测试用例

基于需求分析结果，AI 为每个功能点生成测试用例。用例分为三类：

1. **正面用例**：验证功能正常工作的路径
2. **反面用例**：验证异常输入和边界条件
3. **交互用例**：验证与其他功能的交互场景

每个用例包含以下字段：

| 字段 | 说明 | 示例 |
|------|------|------|
| 编号 | 用例编号 | TC-001 |
| 标题 | 用例标题 | 登录-正常登录验证 |
| 前置条件 | 执行前提 | 用户已注册，账户状态正常 |
| 步骤 | 操作步骤 | 1. 打开登录页 2. 输入正确账号密码 3. 点击登录 |
| 预期结果 | 期望行为 | 登录成功，跳转到首页 |
| 优先级 | P0/P1/P2/P3 | P1 |
| 测试类型 | 功能/性能/安全 | 功能测试 |
| 执行方式 | auto/manual | 自动/手动 |

#### 增强输出：标签化用例格式（配合 template-engine 使用）

当使用 `--selector` 模式或配合 tapd-executor 全流程时，用例输出增加以下字段以支持自动脚本组装：

| 新增字段 | 说明 | 示例 |
|---------|------|------|
| 目标页面 | 用例操作的页面名称 | 到货单列表 |
| 操作类型 | 用例操作的分类 | 查询验证 / 新增提交 / 编辑修改 / 删除确认 / 导出下载 / 其他 |
| 动作标签步骤 | 带标签的操作步骤 | `[导航]` `[输入]` `[点击]` `[等待]` `[断言]` |

动作标签步骤示例：

```markdown
### TC-001: 按单据号查看到货单
目标页面: 到货单列表
操作类型: 查询验证
前置条件: 用户已登录，具有到货单查看权限
步骤:
  - [导航] 进入库存中心 → 到货单页面
  - [输入] 单据号输入框: DH202604150029
  - [点击] 查询按钮
  - [等待] API响应 /api/arrival/list (表格数据加载完成)
  - [断言] 查询结果至少1条
  - [断言] 结果中单据号 = DH202604150029
预期结果: 列表正确显示匹配单据号的数据
测试数据: { billNo: "DH202604150029" }
```

**动作标签说明**：

| 标签 | 含义 | 对应 Selector | 对应 Playwright API |
|------|------|--------------|-------------------|
| `[导航]` | 页面跳转 | 菜单选择器 | page.click + waitForURL |
| `[输入]` | 填充输入框 | 输入框选择器 | page.fill |
| `[点击]` | 点击元素 | 按钮/链接选择器 | page.click |
| `[双击]` | 双击元素 | 行/按钮选择器 | page.dblclick |
| `[等待]` | 等待条件 | URL模式/API路径 | waitForResponse / waitForURL |
| `[按键]` | 键盘按键 | 焦点元素选择器 | page.keyboard.press |
| `[断言]` | 验证结果 | - | expect |

> **注意**：
> - `--selector` 模式生成的用例必须包含 `目标页面` 和 `操作类型` 字段，这是 template-engine 匹配模板的关键
> - 动作标签中的冒号后面是具体值（如 `[输入] 单据号: DH202604150029`），`:` 左边是目标元素描述，右边是输入值
> - 不提供 `--selector` 时，默认使用传统格式（兼容现有 tapd-test 流程）

### 第三步：用户审核

**默认模式**（auto_upload=false）：
1. 展示所有生成的用例列表，按功能点分组
2. 用户可以：确认全部、确认部分（取消勾选不需要的）、修改后确认、取消
3. 用户确认后继续下一步

**自动模式**（auto_upload=true 或 --auto 标记）：
1. 跳过审核，直接进入下一步
2. 建议仅在 AI 用例生成准确度 ≥ 90% 时使用自动模式

### 获取 access_token

所有 TAPD API 调用前必须先获取 Bearer Token：

```bash
curl.exe -u "api_user:api_password" -d "grant_type=client_credentials" "{api_url}/tokens/request_token"
```

提取返回的 `access_token`（有效期 7200s），后续统一使用 `-H "Authorization: Bearer {access_token}"`。

### 第四步：创建测试计划

在 TAPD 中创建测试计划。**命名规范：`TP_S{story_id}_{序号}`**（序号格式如 `202606010001`）：

```bash
curl.exe -H "Authorization: Bearer {access_token}" \
  --data-urlencode "workspace_id={workspace_id}" \
  --data-urlencode "name=TP_S{story_id}_{序号}" \
  --data-urlencode "owner={real_user}" \
  --data-urlencode "description=story_id:S-{story_id}" \
  "{api_url}/test_plans"
```

> **重要**：
> - 测试计划名称使用 `TP_S{story_id}_{序号}` 格式（如 `TP_S1133671402001000032_202606010001`），TP 为 Test Plan 缩写
> - `owner` 必须设置为 `config.json` 中的 `real_user`（TAPD 真实用户名），而非 API 账号
> - 中文字段通过 `--data-urlencode` 传入避免乱码

### 第五步：批量创建测试用例

> **命名规范**：用例名称使用 `TC_S{story_id}_{序号}_{功能描述}` 格式（如 `TC_S1133671402001000032_001_接口抓取正常验证`），中文字段通过 `--data-urlencode` 传入避免乱码。
> 
> **分类说明**：TAPD API 不支持通过 API 创建用例分类（返回 403）。请使用 TAPD 界面中已有的分类 ID，或先在 TAPD 界面创建 `CD_S{story_id}_{序号}` 格式的分类后再使用。

使用逐个创建方式（`POST /tcases`），单个创建可附带 `owner` 字段：

```bash
curl.exe -H "Authorization: Bearer {access_token}" \
  --data-urlencode "workspace_id={workspace_id}" \
  --data-urlencode "name=TC_S{story_id}_{seq}_{功能描述}" \
  --data-urlencode "category_id={分类ID}" \
  --data-urlencode "priority=1" \
  --data-urlencode "owner={real_user}" \
  --data-urlencode "module={模块}" \
  --data-urlencode "description=前置条件：...&#10;步骤：1. ... 2. ..." \
  "{api_url}/tcases"
```

> **重要**：
> - `owner` 应设置为 `config.json` 中的 `real_user`（TAPD 真实用户名）
> - `creator` 字段由 API 自动设置为 API 账号名，无法覆盖，这是 TAPD API 的限制
> - 中文字段（name、module、description 等）必须通过 `--data-urlencode` 传入，避免编码乱码
> - 分类使用已有分类 ID（可通过 `GET /categories?type=tcase` 查询），API 无法创建新分类

### 第六步：关联用例到测试计划

```bash
curl.exe -H "Authorization: Bearer {access_token}" \
  -X POST \
  -d "workspace_id={workspace_id}&test_plan_id={plan_id}&tcase_ids={case_id1},{case_id2},{case_id3}&creator={real_user}" \
  "{api_url}/test_plans/create_tcase_relation"
```

> **注意**：参数名为 `test_plan_id`（非 `plan_id`）、`tcase_ids`（非 `tcase_id`，复数形式，逗号分隔）和 `creator`（必填，使用 `real_user`）。

### 第七步：关联用例到需求

**推荐方式**：使用通用 Relations API（`stories/create_story_tcase` 在部分 TAPD 版本可能返回 302）：

```bash
curl.exe -H "Authorization: Bearer {access_token}" \
  -X POST \
  -d "workspace_id={workspace_id}&source_type=tcase&source_id={case_id}&target_type=story&target_id={story_id}" \
  "{api_url}/relations"
```

对每个用例逐一关联。也可批量关联需求到测试计划：

```bash
curl.exe -H "Authorization: Bearer {access_token}" \
  -X POST \
  -d "workspace_id={workspace_id}&source_type=story&source_id={story_id}&target_type=test_plan&target_id={plan_id}" \
  "{api_url}/relations"
```

**关键**：所有用例必须通过 story_id 关联到需求，确保全链路追溯：Story → TestPlan → Tcase

### 第八步：输出汇总

生成汇总报告：

- ✅ 创建测试计划：`{plan_id}`，名称：`{plan_name}`
- ✅ 创建测试用例：`{count}` 条（正面 `{pos}` 条，反面 `{neg}` 条，交互 `{int}` 条）
- ✅ 关联用例到计划：`{plan_id}`
- ✅ 关联用例到需求：`{story_id}`（`{count}` 条用例）
- 📊 用例列表：
  - TC-001: 登录-正常登录验证 [P1, 正面] → `{case_id_1}`
  - TC-002: 登录-密码错误提示 [P1, 反面] → `{case_id_2}`
  - ...

## 错误处理

| 场景 | 处理方式 |
|------|---------|
| 分类 ID 不存在 | 提示用户先在 TAPD 界面中创建对应分类（API 不支持创建分类），或使用已有分类 |
| API 创建失败 | 展示失败原因（info 字段），提供重试选项 |
| 关联失败 | 记录关联失败的用例 ID，提供手动关联指引 |
| 用例数量超过限制 | TAPD batch_save 单次最多 100 条，自动分批上传 |
| story_id 无效 | 提示用户检查需求 ID，用例已创建但未关联 |

## TAPD API 参考

详细 API 文档请参考 `references/api-reference.md`，重点包含：
- POST /tcases — 创建单个测试用例
- POST /tcases/batch_save — 批量创建测试用例
- POST /test_plans — 创建测试计划
- POST /test_plans/create_tcase_relation — 关联用例到计划
- POST /stories/create_story_tcase — 关联用例到需求
- GET /workspaces/custom_fields_config — 获取用例自定义字段

## 与其他 Skill 的协作

- **tapd-analyze**：接收其 JSON 输出作为输入
- **nl-test-generator**：生成的用例可由 nl-test-generator 转为 .spec.ts 测试文件
- **auto-test-runner**：执行 .spec.ts 测试文件
- **tapd-sync**：同步执行结果并回写到 TAPD 用例状态
- **tapd-notify**：用例创建完成后可推送通知到企业微信
- **tapd-test**：作为全流程编排的第二个环节

## 注意事项

1. 默认必须用户确认后才上传用例到 TAPD（`auto_upload=false`）
2. 所有创建的用例都通过 story_id 关联到需求，确保全链路追溯
3. 用例优先级与需求优先级对齐：P0 需求生成 P0 用例，P1 生成 P1/P2 用例
4. 生成的 .spec.ts 测试文件由 nl-test-generator Skill 负责，本 Skill 只负责 TAPD 用例管理
5. Windows 环境下使用 `curl.exe` 而非 `curl`（PowerShell 别名）
6. 中文字段必须通过 `curl.exe --data-urlencode` 传入，避免编码乱码
7. **creator 字段说明**：TAPD 中 `creator`（创建人）由 API 认证身份决定，始终显示 API 账号名（如 `CiOzjwRC`）。要让 creator 显示真实用户名（如 `刘晓康`），需要登录 TAPD 界面为该用户生成专属 API Token，然后替换 `config.json` 中的 `api_user` 和 `api_password`。`owner`（处理人）已设置为 `real_user`，可正常显示真实用户名。