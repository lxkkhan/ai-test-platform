"""
状态定义 - 测试编排的 State 类型
定义了 LangGraph 状态图中每个节点间传递的数据结构
"""
from typing import TypedDict, Optional, Annotated

def reduce_list(a: list, b: list) -> list:
    """列表合并，支持并行节点安全写入"""
    return a + b

def reduce_steps(a: list[str], b: list[str]) -> list[str]:
    return a + b

def reduce_errors(a: list[str], b: list[str]) -> list[str]:
    return a + b

class TestState(TypedDict):
    story_id: str                              # TAPD 需求 ID

    # 各阶段产出
    analysis: Optional[dict]                   # 需求分析结果
    plan_id: Optional[str]                     # 测试计划 ID
    case_ids: Annotated[list[str], reduce_list] # 测试用例 ID 列表
    script_paths: list[str]                    # 生成的 Playwright 脚本路径列表
    ui_test_results: list[dict]                # UI 自动化测试结果
    api_test_results: list[dict]               # 接口测试结果
    bug_ids: list[str]                         # 自动提的 Bug ID
    final_report: Optional[str]                # 最终报告

    # 控制字段（reducer 确保并行节点安全写入）
    steps: Annotated[list[str], reduce_steps]
    errors: Annotated[list[str], reduce_errors]
    parallel: bool                             # 是否并行执行 UI + API 测试
    notify_on: str                             # 通知策略: always / on_failure / never
