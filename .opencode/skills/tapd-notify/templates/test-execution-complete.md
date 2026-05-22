## 📊 测试执行完成

**关联需求**: S-{{story_id}}
**测试计划**: 测试计划_S{{story_id}}_{{plan_seq}} ({{plan_id}})
**处理人**: {{real_user}}

### 执行结果
| 状态 | 数量 |
|------|------|
| ✅ 通过 | {{passed}} |
| ❌ 失败 | {{failed}} |
| ⚠️ 阻塞 | {{blocked}} |
| ⏭️ 未执行 | {{skipped}} |

### 通过率
**{{pass_rate}}%** ({{passed}}/{{total}})

{{#if failed_list}}
### 失败用例
{{failed_list}}
{{/if}}

{{#if bug_list}}
### 自动创建Bug
{{bug_list}}
{{/if}}

> 详细结果请在 TAPD 中查看