# TAPD 测试全流程数据流参考

> 本文档描述 tapd-test 编排 Skill 中各子 Skill 之间的数据流转格式。

---

## 1. 全流程数据流

```
story_id ──→ tapd-analyze ──→ tapd-gen ──→ (auto-test-runner) ──→ tapd-sync ──→ tapd-notify
                    │               │                    │               │               │
                    │               │                    │               │               │
                    v               v                    v               v               v
           analyze_result    plan_id + case_ids    test_results      sync_status      通知消息
```

---

## 2. tapd-analyze 输出格式

**消费者**: tapd-gen

```json
{
  "story_id": "S-1120003271001000123",
  "story_name": "登录功能优化",
  "story_status": "in_progress",
  "story_priority": "2",
  "story_owner": "zhangsan",
  "analysis_result": {
    "features": [
      {
        "name": "正常登录",
        "description": "使用正确账号密码登录系统",
        "risk_level": "低",
        "test_type": "功能测试",
        "priority": "P1",
        "acceptance_criteria": ["登录成功跳转首页", "显示用户头像和名称"]
      },
      {
        "name": "密码错误提示",
        "description": "输入错误密码时显示错误提示",
        "risk_level": "中",
        "test_type": "功能测试",
        "priority": "P1",
        "acceptance_criteria": ["显示错误提示信息", "不跳转页面"]
      }
    ],
    "test_scope": {
      "in_scope": ["登录功能", "密码验证", "记住密码"],
      "out_of_scope": ["注册功能", "第三方登录"]
    },
    "test_focus": ["密码安全性", "账号锁定机制"],
    "summary": "登录功能优化需求，重点测试密码安全性和错误处理场景"
  }
}
```

---

## 3. tapd-gen 输出格式

**消费者**: tapd-sync, tapd-notify

```json
{
  "story_id": "S-1120003271001000123",
  "plan_id": "1120003271001002001",
  "plan_name": "登录功能优化-测试计划",
  "case_ids": [
    "1120003271001005001",
    "1120003271001005002",
    "1120003271001005003"
  ],
  "cases": [
    {
      "case_id": "1120003271001005001",
      "name": "登录-正常登录验证",
      "type": "正面",
      "priority": "P1",
      "tapd_case_id": "1120003271001005001"
    },
    {
      "case_id": "1120003271001005002",
      "name": "登录-密码错误提示",
      "type": "反面",
      "priority": "P1",
      "tapd_case_id": "1120003271001005002"
    }
  ],
  "summary": {
    "total": 3,
    "positive": 1,
    "negative": 1,
    "interaction": 1
  }
}
```

---

## 4. auto-test-runner 输出格式

**消费者**: tapd-sync

```
test-results/
├── report/
│   ├── playwright-merged-<timestamp>.html
│   └── ...
├── cache/
└── ...
```

Playwright 测试结果通过结果目录传递给 tapd-sync。

---

## 5. tapd-sync 输出格式

**消费者**: tapd-notify

```json
{
  "story_id": "S-1120003271001000123",
  "plan_id": "1120003271001002001",
  "sync_summary": {
    "total": 3,
    "passed": 2,
    "failed": 1,
    "blocked": 0,
    "skipped": 0,
    "pass_rate": "66.7%"
  },
  "bug_ids": [
    "1120003271001003001"
  ],
  "bugs": [
    {
      "bug_id": "1120003271001003001",
      "title": "[自动] 登录-密码错误提示 测试失败",
      "severity": "一般",
      "linked_case": "1120003271001005002",
      "linked_story": "S-1120003271001000123"
    }
  ],
  "unmapped": []
}
```

---

## 6. 状态文件格式

**文件**: `.tapd-test-state.json`

**用途**: 保存全流程进度，支持中断恢复

```json
{
  "story_id": "S-1120003271001000123",
  "current_step": "sync",
  "steps_completed": ["analyze", "gen"],
  "analyze_result": { ... },
  "plan_id": "1120003271001002001",
  "case_ids": ["1120003271001005001", "1120003271001005002"],
  "bug_ids": ["1120003271001003001"],
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-15T15:45:00Z"
}
```

**步骤值**：

| current_step | 说明 |
|-------------|------|
| `analyze` | 需求分析中 |
| `gen` | 用例生成中 |
| `run` | 等待测试执行 |
| `sync` | 结果同步中 |
| `notify` | 通知推送中 |
| `done` | 全流程完成 |

---

## 7. 恢复机制

### 恢复读取规则

1. 如果 state 文件存在且 `story_id` 匹配：从 `current_step` 恢复
2. 如果 state 文件存在但 `story_id` 不匹配：提示用户使用 `--restart` 重新开始
3. 如果 state 文件不存在：从头开始

### 恢复命令

```bash
/tapd-test S-xxx --resume    # 从中断处恢复
/tapd-test S-xxx --restart   # 从头开始（删除状态文件）
```

---

## 8. 子 Skill 数据消费关系

| 消费者 | 产出的数据 | 来源 |
|--------|----------|------|
| tapd-gen | analyze_result JSON | tapd-analyze |
| tapd-sync | plan_id, case_ids | tapd-gen |
| tapd-sync | test_results 目录 | auto-test-runner |
| tapd-notify | sync_summary, bug_ids | tapd-sync |
| tapd-notify | analyze_result, plan info | tapd-analyze, tapd-gen |