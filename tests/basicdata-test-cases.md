# Test Cases: 基础数据管理系统

## Overview
- **Feature**: 基础数据管理（系统公共参数、组织管理、物料管理、客户管理、行政区域管理、人员管理）
- **Requirements Source**: [CoDesign 原型] https://codesign.qq.com/s/686059816013115
- **Test Coverage**: 功能测试、边界测试、异常测试、状态迁移测试
- **Last Updated**: 2026-05-26

---

## 需求清单

| 模块 | 页面/功能 | ID |
|------|----------|-----|
| 系统公共参数 | 列表 / 制单 / 选择弹窗 | REQ-001 |
| 组织管理 | 流程 / 选择弹窗 | REQ-002 |
| 物料管理 | 基本分类 / 产品线 / 规格简化档案 / 列表 / 制单 / 选择弹窗 / 宣传资料档案管理 | REQ-003 |
| 客户管理 | 类别 / 属性 / 连锁体系 / 全功能 / 查询单 / 变更申请 / 查询表 | REQ-004 |
| 行政区域管理 | 列表 / 选择弹窗 | REQ-005 |
| 人员管理 | 同步定义 / 列表 / 制单 / 选择弹窗 / 账号管理 | REQ-006 |
| OA预研 | 预研点列表 | REQ-007 |

---

## Test Case Categories

### 1. Functional Tests

#### TC-F-001: 系统公共参数 — 列表查询
- **Requirement**: REQ-001
- **Priority**: High
- **Preconditions**:
  - 用户已登录系统
  - 数据库中存在至少 1 条系统公共参数记录
- **Test Steps**:
  1. 进入"基础数据 → 系统公共参数"页面
  2. 观察列表加载状态
  3. 确认列表展示字段正确（参数编码、参数名称、参数值、启用状态等）
- **Expected Results**:
  - 列表正确加载，无白屏/报错
  - 字段展示与原型一致
  - 分页功能正常
- **Postconditions**: 无

#### TC-F-002: 系统公共参数 — 新增（制单）
- **Requirement**: REQ-001
- **Priority**: High
- **Preconditions**:
  - 用户具有新增权限
- **Test Steps**:
  1. 点击"新增"按钮
  2. 填入必填字段：参数编码、参数名称、参数值
  3. 点击"保存"
  4. 返回列表页确认新记录存在
- **Expected Results**:
  - 新增页面（制单）正常打开
  - 保存后跳转回列表，列表刷新
  - 新记录在列表中可见
- **Postconditions**: 新增的公共参数记录存在于数据库中

#### TC-F-003: 系统公共参数 — 编辑
- **Requirement**: REQ-001
- **Priority**: High
- **Preconditions**:
  - 列表中存在可编辑的记录
- **Test Steps**:
  1. 在列表中选择一条记录，点击"编辑"
  2. 修改参数名称
  3. 点击"保存"
  4. 确认修改生效
- **Expected Results**:
  - 编辑页回显原数据正确
  - 修改后列表展示更新后的值
- **Postconditions**: 记录信息已更新

#### TC-F-004: 系统公共参数 — 选择弹窗
- **Requirement**: REQ-001
- **Priority**: Medium
- **Preconditions**:
  - 从其他页面触发选择弹窗
- **Test Steps**:
  1. 打开系统公共参数选择弹窗
  2. 输入关键词搜索
  3. 选中一条记录，确认
  4. 观察主页面是否回填选中值
- **Expected Results**:
  - 弹窗正常弹出，列表加载
  - 搜索过滤正常
  - 选中后正确回填到主表单
- **Postconditions**: 无

#### TC-F-005: 组织管理 — 查看组织选择弹窗
- **Requirement**: REQ-002
- **Priority**: High
- **Preconditions**:
  - 系统存在多层级组织数据
- **Test Steps**:
  1. 从制单页面打开组织选择弹窗
  2. 展开树形结构，选择子组织
  3. 确认选择
  4. 观察主表单回填
- **Expected Results**:
  - 组织树正确展示层级关系
  - 支持多级展开/收起
  - 选中后回填正确
- **Postconditions**: 无

#### TC-F-006: 物料基本分类 — 列表与选择弹窗
- **Requirement**: REQ-003
- **Priority**: High
- **Preconditions**:
  - 存在物料基本分类数据
- **Test Steps**:
  1. 进入物料基本分类页面
  2. 查看列表
  3. 从制单页面触发选择弹窗
  4. 搜索并选择一条分类
- **Expected Results**:
  - 列表正常展示
  - 选择弹窗支持搜索和分页
  - 选中回填正确
- **Postconditions**: 无

#### TC-F-007: 物料产品线 — 列表与选择弹窗
- **Requirement**: REQ-003
- **Priority**: Medium
- **Preconditions**:
  - 存在物料产品线数据
- **Test Steps**:
  1. 进入物料产品线页面
  2. 查看列表数据
  3. 从物料制单页面触发产品线选择弹窗
  4. 选中一条记录
- **Expected Results**:
  - 列表展示产品线编码、名称等字段
  - 选择弹窗支持关键词检索
  - 选中后正确填充
- **Postconditions**: 无

#### TC-F-008: 规格简化物料档案 — 增删改查
- **Requirement**: REQ-003
- **Priority**: High
- **Preconditions**:
  - 用户有操作权限
- **Test Steps**:
  1. 进入规格简化物料档案页面
  2. 新增一条物料档案（填入规格、物料名称等）
  3. 保存后列表确认存在
  4. 编辑该记录
  5. 删除该记录
- **Expected Results**:
  - 新增/编辑/删除均提示成功
  - 操作后列表数据正确刷新
- **Postconditions**: 测试数据被删除

#### TC-F-009: 物料管理 — 制单与列表联动
- **Requirement**: REQ-003
- **Priority**: High
- **Preconditions**:
  - 存在物料数据
- **Test Steps**:
  1. 进入物料管理列表页
  2. 点击"新增"进入制单页
  3. 填写物料信息（编码、名称、分类、产品线、规格等）
  4. 保存后返回列表
  5. 验证新记录出现在列表中
  6. 点击编辑，验证回显
- **Expected Results**:
  - 列表和制单页面切换流畅
  - 数据填写/保存/回显正确
- **Postconditions**: 无

#### TC-F-010: 宣传资料档案管理 — 列表与制单
- **Requirement**: REQ-003
- **Priority**: Medium
- **Preconditions**:
  - 用户有操作权限
- **Test Steps**:
  1. 进入宣传资料档案管理列表
  2. 点击新增
  3. 填写宣传物料档案信息
  4. 保存
  5. 验证列表刷新
- **Expected Results**:
  - 列表页面展示字段与原型一致
  - 制单页面必填字段校验正确
  - 保存后返回列表

#### TC-F-011: 客户管理（全功能） — 列表/制单/选择弹窗
- **Requirement**: REQ-004
- **Priority**: High
- **Preconditions**:
  - 客户数据存在
- **Test Steps**:
  1. 进入客户管理（全功能）-列表页
  2. 验证列表字段（客户编码、客户名称、类别、属性、连锁体系等）与原型一致
  3. 点击新增进入制单页
  4. 填写所有字段，从选择弹窗选取客户类别、属性、组织等
  5. 保存
- **Expected Results**:
  - 列表字段全部正确展示
  - 制单页各选择弹窗功能正常
  - 保存后回列表正确

#### TC-F-012: 客户管理 — 简化版列表/制单
- **Requirement**: REQ-004
- **Priority**: Medium
- **Preconditions**:
  - 客户数据存在
- **Test Steps**:
  1. 进入客户管理-列表页（简化版）
  2. 对比全功能版的字段差异
  3. 新增一条记录
  4. 编辑/删除
- **Expected Results**:
  - 简化版表格列数应少于全功能版
  - 核心功能（增删改查）正常
- **Postconditions**: 无

#### TC-F-013: 客户查询单 — 列表与制单
- **Requirement**: REQ-004
- **Priority**: Medium
- **Preconditions**:
  - 存在客户查询单数据
- **Test Steps**:
  1. 进入客户查询单-列表页
  2. 新增一条查询单
  3. 填写查询条件（客户、时间范围、销区等）
  4. 保存
  5. 编辑/删除
- **Expected Results**:
  - 查询单协议功能正常
  - 列表支持按条件查看
- **Postconditions**: 测试数据可删除

#### TC-F-014: 客户变更申请
- **Requirement**: REQ-004
- **Priority**: Medium
- **Preconditions**:
  - 系统支持客户变更申请流程
- **Test Steps**:
  1. 进入客户变更申请页
  2. 选择需要变更的客户
  3. 填写变更内容（编码变更、类别变更等）
  4. 提交申请
  5. 查看申请状态
- **Expected Results**:
  - 申请页面正常（当前标注"待定"，可能部分功能未实现）
  - 如有实现，提交后生成申请记录

#### TC-F-015: 客户查询表（销区）
- **Requirement**: REQ-004
- **Priority**: Medium
- **Preconditions**:
  - 系统有销区概念
- **Test Steps**:
  1. 进入客户查询单（销区）页面
  2. 选择销区维度查询客户数据
  3. 验证数据按销区正确分组
- **Expected Results**:
  - 销区维度数据可正常查询
  - 显示字段符合原型设计

#### TC-F-016: 行政区域管理 — 列表与选择弹窗
- **Requirement**: REQ-005
- **Priority**: Medium
- **Preconditions**:
  - 行政区域树形数据存在
- **Test Steps**:
  1. 进入行政区域管理页面
  2. 查看树形列表
  3. 展开/收起层级
  4. 从其他页面触发行政区域选择弹窗
  5. 选择一个区域
- **Expected Results**:
  - 树形结构正常展示
  - 弹窗支持搜索和树形选择
  - 选中回填正确
- **Postconditions**: 无

#### TC-F-017: 人员管理 — 列表/制单/选择弹窗
- **Requirement**: REQ-006
- **Priority**: High
- **Preconditions**:
  - 存在人员数据
- **Test Steps**:
  1. 进入人员管理-列表页
  2. 新增人员（填写姓名、工号、部门、角色等）
  3. 从选择弹窗选取部门和角色
  4. 保存
  5. 编辑/删除
- **Expected Results**:
  - 列表正常展示
  - 制单页所有字段可用
  - 选择弹窗功能正常
- **Postconditions**: 无

#### TC-F-018: 人员账号管理 — 列表/制单/弹窗
- **Requirement**: REQ-006
- **Priority**: High
- **Preconditions**:
  - 存在人员记录
- **Test Steps**:
  1. 进入人员账号管理-列表页
  2. 新增账号（选择人员、设置账号、密码、启用状态等）
  3. 保存
  4. 编辑/禁用账号
- **Expected Results**:
  - 列表展示账号信息
  - 新增/编辑功能正常
  - 禁用后状态正确更新
- **Postconditions**: 无

#### TC-F-019: 人员同步定义
- **Requirement**: REQ-006
- **Priority**: Medium
- **Preconditions**:
  - 系统支持人员同步配置
- **Test Steps**:
  1. 进入人员同步定义页面
  2. 配置同步规则（源系统、目标系统、同步周期等）
  3. 保存配置
  4. 触发一次手动同步
- **Expected Results**:
  - 同步定义配置可保存
  - 同步执行后日志可查看
- **Postconditions**: 无

---

### 2. Edge Case Tests

#### TC-E-001: 列表空数据状态
- **Requirement**: REQ-001 ~ REQ-007
- **Priority**: Medium
- **Preconditions**:
  - 某个模块没有任何数据记录
- **Test Steps**:
  1. 进入各模块列表页（系统公共参数、组织管理、物料管理、客户管理、行政区域、人员管理等）
  2. 观察空数据状态
- **Expected Results**:
  - 显示空状态提示文案（如"暂无数据"）
  - 无 JS 报错
  - "新增"按钮仍可用

#### TC-E-002: 列表单页极限数据量
- **Requirement**: REQ-001 ~ REQ-006
- **Priority**: Low
- **Preconditions**:
  - 数据量接近分页上限（如每页 50 条）
- **Test Steps**:
  1. 进入列表页
  2. 将每页条数调至最大值
  3. 确认数据正确加载，无卡顿
- **Expected Results**:
  - 页面不崩溃
  - 滚动正常
  - 翻页正常

#### TC-E-003: 表单输入框长度边界
- **Requirement**: REQ-001, REQ-003, REQ-004, REQ-006
- **Priority**: Medium
- **Preconditions**:
  - 制单页面包含文本输入框
- **Test Steps**:
  1. 在"参数编码"字段输入 1 个字符
  2. 输入数据库字段定义的最大长度
  3. 输入超过最大长度的字符
- **Expected Results**:
  - 1 字符：可保存
  - 最大长度：可保存
  - 超长：前端截断或提示超出

#### TC-E-004: 编码/名称特殊字符
- **Requirement**: REQ-001, REQ-003, REQ-004, REQ-006
- **Priority**: Medium
- **Preconditions**:
  - 制单页面编码/名称字段
- **Test Steps**:
  1. 编码输入特殊字符（!@#$%^&*()）
  2. 名称输入 emoji（🐛🚀）
  3. 名称输入 SQL 注入字符串（' OR '1'='1）
  4. 保存
- **Expected Results**:
  - 特殊字符根据系统规则：允许保存或提示不合法
  - SQL 注入不应影响数据库
  - Emoji 不应导致页面崩溃

#### TC-E-005: 选择弹窗 — 搜索结果为空
- **Requirement**: REQ-001 ~ REQ-006
- **Priority**: Low
- **Preconditions**:
  - 任意选择弹窗
- **Test Steps**:
  1. 打开选择弹窗
  2. 搜索一个不存在的数据
- **Expected Results**:
  - 显示"无搜索结果"提示
  - 不出现 JS 错误

#### TC-E-006: 树形数据 — 叶子节点选中
- **Requirement**: REQ-002, REQ-005
- **Priority**: Medium
- **Preconditions**:
  - 组织/行政区域树形数据
- **Test Steps**:
  1. 打开组织选择弹窗
  2. 尝试选中父节点（非叶子节点）
  3. 选中叶子节点
- **Expected Results**:
  - 父节点选择规则：如只允许选叶子，点父节点应展开而非选中
  - 或如允许选父节点，应正确回填

#### TC-E-007: 日期范围选择
- **Requirement**: REQ-004
- **Priority**: Medium
- **Preconditions**:
  - 客户查询单包含日期范围筛选
- **Test Steps**:
  1. 选择开始日期 > 结束日期
  2. 选择未来的日期
  3. 不选择任何日期
- **Expected Results**:
  - 开始 > 结束：提示"开始日期不能大于结束日期"或自动交换
  - 未来日期：允许或提示
  - 空日期：按默认范围查询

#### TC-E-008: 分页边界 — 最后一页删除
- **Requirement**: REQ-001 ~ REQ-006
- **Priority**: Low
- **Preconditions**:
  - 列表有多页数据，当前在第 2 页
- **Test Steps**:
  1. 翻到最后一页
  2. 删除该页唯一一条记录
- **Expected Results**:
  - 自动跳转到前一页，不出现空列表

---

### 3. Error Handling Tests

#### TC-ERR-001: 新增表单 — 必填字段为空
- **Requirement**: REQ-001 ~ REQ-007
- **Priority**: High
- **Preconditions**:
  - 打开任意制单页面
- **Test Steps**:
  1. 不填写任何必填字段
  2. 点击"保存"
  3. 逐项验证每个必填字段的校验提示
- **Expected Results**:
  - 保存被阻止
  - 每个必填字段显示红色错误提示
  - 焦点自动定位到第一个错误字段
- **Postconditions**: 无数据保存

#### TC-ERR-002: 编码重复
- **Requirement**: REQ-001, REQ-003, REQ-004, REQ-006
- **Priority**: High
- **Preconditions**:
  - 系统中已存在编码为"TEST001"的记录
- **Test Steps**:
  1. 新增一条记录，编码填入"TEST001"
  2. 保存
- **Expected Results**:
  - 保存失败
  - 提示"编码已存在，请重新输入"
- **Postconditions**: 数据库无重复记录

#### TC-ERR-003: 删除被引用的记录
- **Requirement**: REQ-001 ~ REQ-006
- **Priority**: High
- **Preconditions**:
  - 某条系统公共参数已被业务单据引用
- **Test Steps**:
  1. 尝试删除该记录
- **Expected Results**:
  - 删除失败
  - 提示"该记录已被引用，无法删除"

#### TC-ERR-004: 未授权访问
- **Requirement**: REQ-001 ~ REQ-007
- **Priority**: High
- **Preconditions**:
  - 使用无操作权限的账号登录
- **Test Steps**:
  1. 进入各模块页面
  2. 尝试点击新增/编辑/删除按钮
- **Expected Results**:
  - 按钮置灰或隐藏
  - 或点击后提示"无操作权限"

#### TC-ERR-005: 网络断开后保存
- **Requirement**: REQ-001 ~ REQ-006
- **Priority**: Medium
- **Preconditions**:
  - 制单页面已填写数据
- **Test Steps**:
  1. 断开网络
  2. 点击保存
- **Expected Results**:
  - 提示"网络连接失败"或超时提示
  - 已填写的数据不丢失

#### TC-ERR-006: 并发的编辑冲突
- **Requirement**: REQ-001, REQ-003, REQ-004, REQ-006
- **Priority**: Medium
- **Preconditions**:
  - 两个用户同时编辑同一条记录
- **Test Steps**:
  1. 用户 A 打开编辑页
  2. 用户 B 也打开同一条记录的编辑页并保存
  3. 用户 A 修改后保存
- **Expected Results**:
  - 用户 A 保存时提示"数据已被他人修改，请刷新后重试"
  - 或采用乐观锁策略

#### TC-ERR-007: 刷新页面后表单数据丢失
- **Requirement**: REQ-001, REQ-003, REQ-004, REQ-006
- **Priority**: Medium
- **Preconditions**:
  - 制单页面已填写数据
- **Test Steps**:
  1. 填写一半数据
  2. 按 F5 刷新页面
- **Expected Results**:
  - 有离开确认提示"修改未保存，是否离开？"
  - 或自动暂存草稿

---

### 4. State Transition Tests

#### TC-ST-001: 客户变更申请 — 审批流程
- **Requirement**: REQ-004
- **Priority**: Medium
- **Preconditions**:
  - 客户变更申请功能已实现
- **Test Steps**:
  1. 提交变更申请（状态 → 待审批）
  2. 审批人审批通过（状态 → 已通过）
  3. 审批人驳回（状态 → 已驳回）
  4. 修改后重新提交（状态 → 待审批）
- **Expected Results**:
  - 状态变更正确
  - 各状态下操作按钮符合权限规则
  - 审批记录可追溯

#### TC-ST-002: 人员账号 — 启用/禁用状态切换
- **Requirement**: REQ-006
- **Priority**: High
- **Preconditions**:
  - 存在一个启用的账号
- **Test Steps**:
  1. 禁用该账号
  2. 用该账号尝试登录
  3. 重新启用该账号
  4. 再次登录
- **Expected Results**:
  - 禁用后：原有 session 失效，无法登录
  - 启用后：可正常登录
  - 状态切换有日志记录

#### TC-ST-003: 物料档案 — 生命周期
- **Requirement**: REQ-003
- **Priority**: Medium
- **Preconditions**:
  - 物料有启用/停用状态
- **Test Steps**:
  1. 新增物料（状态 → 启用）
  2. 停用物料（状态 → 停用）
  3. 在制单中选择物料，验证停用物料不可选
  4. 重新启用
- **Expected Results**:
  - 状态切换正常
  - 停用后在选择弹窗中不可见或标记为已停用

---

## Test Coverage Matrix

| Requirement ID | Test Cases | Coverage Status |
|---------------|------------|-----------------|
| REQ-001 | TC-F-001, TC-F-002, TC-F-003, TC-F-004, TC-E-001~004, TC-ERR-001~007 | ✓ Complete |
| REQ-002 | TC-F-005, TC-E-006, TC-ERR-001~006 | ✓ Complete |
| REQ-003 | TC-F-006~010, TC-E-002~006, TC-ERR-001~007, TC-ST-003 | ✓ Complete |
| REQ-004 | TC-F-011~015, TC-E-002~008, TC-ERR-001~007, TC-ST-001 | ✓ Complete |
| REQ-005 | TC-F-016, TC-E-006, TC-ERR-001~006 | ✓ Complete |
| REQ-006 | TC-F-017~019, TC-E-002~006, TC-ERR-001~007, TC-ST-002 | ✓ Complete |
| REQ-007 | TC-E-001, TC-ERR-001 | ⚠ Partial (预研阶段，功能未完全明确) |

---

## Notes

- **设计来源**: CoDesign 原型链接 https://codesign.qq.com/s/686059816013115
- **原型总页数**: 50 个页面
- **当前阶段**: 原型设计阶段，部分页面可能标注为"待定"（如客户变更申请）
- **选择弹窗模式**: 大部分模块采用"列表 + 选择弹窗"模式，弹窗逻辑通用
- **权限模型**: 假设存在角色权限控制，具体权限矩阵需与产品确认
- **异步操作**: 保存/删除操作建议前端有 loading 反馈，避免重复提交
- 本测试用例基于设计稿分析生成，未涉及后端 API 测试和性能测试
