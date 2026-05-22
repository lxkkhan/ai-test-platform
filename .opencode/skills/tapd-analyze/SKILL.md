---
name: tapd-analyze
description: 从 TAPD 拉取需求并 AI 分析，提取功能点、测试范围、风险等级和验收标准。触发词：/tapd-analyze、分析需求、需求解析、tapd需求分析。当用户提到"分析需求"、"看看这个需求"、"需求提测"等涉及 TAPD 需求分析的请求时，必须使用此 Skill。
metadata:
  audience: testers
  workflow: tapd
---

## 功能概述

本 Skill 用于从 TAPD 拉取需求详情，结合 AI 进行深度分析，输出结构化的测试分析报告。分析结果可作为 tapd-gen（用例生成）的输入。

## 触发方式

### 命令式

```
/tapd-analyze S-xxx
```

直接提供 TAPD 需求 ID（如 `S-1120003271001000123`），自动拉取并分析。

### 对话式

用户说类似："帮我分析 S-xxx 这个需求"、"看看这个需求怎么测"、"需求提测分析"。

本 Skill 会从对话中提取 story_id，然后拉取需求详情并分析。

## 配置文件

本 Skill 依赖同级目录下的 `config.json`，需包含以下字段：

```json
{
  "workspace_id": "你的TAPD项目ID",
  "api_user": "你的API账号",
  "api_password": "你的API密码",
  "api_url": "https://api.tapd.cn",
  "defaults": {
    "priority_label": "中",
    "severity": "一般",
    "testtype": "功能测试",
    "testphase": "功能测试阶段"
  },
  "modules": ["登录", "注册", "首页", "订单管理", "用户中心", "设置", "报表", "其他"],
  "owner_list": [],
  "default_story_id": "",
  "default_reviewer": "",
  "analyze_fields": []
}
```

> **注意**：`api_url` 默认为 `https://api.tapd.cn`，私有化部署需修改为实际 API 地址。`api_user` 和 `api_password` 为明文，建议加入 `.gitignore`。

## 工作流

### 第一步：读取配置并验证连通性

1. 读取 `config.json` 获取 TAPD 凭证和项目配置
2. 验证 TAPD API 连通性：
   ```bash
   curl.exe -u 'api_user:api_password' "{api_url}/workspaces/projects?id={workspace_id}"
   ```
3. 如果连通失败，提示用户检查 config.json 中的 api_url、api_user、api_password

### 第二步：拉取需求详情

1. 根据 story_id 调用 TAPD Stories API：
   ```bash
   curl.exe -u 'api_user:api_password' "{api_url}/stories/{story_id}?workspace_id={workspace_id}"
   ```
2. 解析返回的 JSON，提取需求的标题、描述、优先级、状态、处理人等字段
3. 如果需求不存在或 ID 无效，提示用户检查 story_id

story_id 支持的格式：
- 纯数字：`1120003271001000123`
- 带前缀：`S-1120003271001000123`

### 第三步：AI 深度分析

对拉取的需求内容进行 AI 分析，生成结构化测试分析报告：

#### 分析维度

1. **基本信息提取**：需求标题、描述、优先级、状态、处理人、创建时间
2. **功能点拆解**：将需求拆解为可测试的功能点列表
3. **测试范围界定**：明确测试范围（IN SCOPE）和不在范围内（OUT OF SCOPE）
4. **风险等级评估**：对每个功能点评估风险等级（高/中/低）
5. **测试重点标注**：标识重点测试项和优先级
6. **验收标准**：给出明确的验收条件

#### 输出格式

```json
{
  "story_id": "S-xxx",
  "story_name": "需求标题",
  "story_status": "状态",
  "story_priority": "优先级",
  "story_owner": "处理人",
  "analysis_result": {
    "features": [
      {
        "name": "功能点1",
        "description": "功能描述",
        "risk_level": "高/中/低",
        "test_type": "功能测试/性能测试/安全测试",
        "priority": "P0/P1/P2/P3",
        "acceptance_criteria": ["验收条件1", "验收条件2"]
      }
    ],
    "test_scope": {
      "in_scope": ["测试范围内的项目"],
      "out_of_scope": ["不在范围内的项目"]
    },
    "test_focus": ["重点测试项1", "重点测试项2"],
    "summary": "整体分析摘要"
  }
}
```

此 JSON 输出格式可直接作为 tapd-gen Skill 的输入。

### 第四步：展示分析报告

将 AI 分析结果以结构化方式展示给用户：

1. **📋 基本信息**：需求 ID、标题、状态、优先级、处理人
2. **🎯 功能点列表**：每个功能点的名称、描述、风险等级、测试类型、优先级
3. **📐 测试范围**：明确 IN SCOPE 和 OUT OF SCOPE
4. **⚠️ 风险等级**：高风险项标红，提示特别关注
5. **🔑 测试重点**：需要优先测试的功能点
6. **✅ 验收标准**：每个功能点的验收条件

## 错误处理

| 场景 | 处理方式 |
|------|---------|
| story_id 无效或不存在 | 提示用户检查 ID 格式，支持的格式如 `S-1120003271001000123` |
| 认证失败（status != 1） | 检查 config.json 中的 api_user 和 api_password |
| 网络错误 | 检查 api_url 是否正确（私有化部署地址），检查网络连通性 |
| API 限流（429） | 提示稍后重试，TAPD 限流规则为 5 次/秒/workspace |
| 需求为空或描述不足 | 提示用户补充需求信息后再分析 |

## TAPD API 参考

详细 API 文档请参考 `references/api-reference.md`，涵盖 Stories、Test Cases、Test Plans、Test Results、Bugs、Relations 等所有端点。

## 与其他 Skill 的协作

- **tapd-gen**：本 Skill 的 JSON 输出可直接作为 tapd-gen 的输入，用于生成测试用例
- **tapd-notify**：分析完成后可调用 tapd-notify 推送通知到企业微信
- **tapd-test**：作为全流程编排的第一个环节

## 注意事项

1. 分析前必须确认 TAPD API 连通性正常
2. story_id 支持的格式：纯数字（如 `1120003271001000123`）或带前缀（如 `S-1120003271001000123`）
3. 分析结果会缓存，同一 story_id 不会重复拉取（除非用户明确要求刷新）
4. 输出 JSON 格式必须与 tapd-gen 的输入格式保持一致
5. Windows 环境下使用 `curl.exe` 而非 `curl`（PowerShell 别名）