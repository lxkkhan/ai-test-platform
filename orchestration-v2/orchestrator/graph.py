# LangGraph 状态图定义 - 测试编排主流程
# 定义 8 个节点（analyze → gen_cases → assemble → ui_test+api_test → sync → bug → notify）
# 支持条件分支（测试失败时走 bug 节点）和并行执行（UI + API）
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
from .state import TestState
from .nodes import (
    analyze_node,
    gen_cases_node,
    assemble_node,
    ui_test_node,
    api_test_node,
    sync_node,
    bug_node,
    notify_node,
)

# 条件路由函数：根据测试结果决定流程方向
def router(state: TestState) -> str:
    """sync -> bug (if failures) or notify (if all pass)"""
    failed = 0
    # 统计 UI 测试失败数
    for r in (state.get("ui_test_results") or []):
        if r.get("status") != "pass":
            failed += 1
    # 统计 API 测试失败数
    for r in (state.get("api_test_results") or []):
        if r.get("status") != "pass":
            failed += 1
    # notify_on=on_failure 且全部通过时跳过通知
    if state.get("notify_on") == "on_failure" and failed == 0:
        return "all_pass"
    return "has_failures" if failed > 0 else "all_pass"

# 构建并编译状态图
def build_graph() -> StateGraph:
    builder = StateGraph(TestState)

    # 注册所有节点
    builder.add_node("analyze", analyze_node)        # 需求分析
    builder.add_node("gen_cases", gen_cases_node)    # 生成用例
    builder.add_node("assemble", assemble_node)      # 组装脚本
    builder.add_node("ui_test", ui_test_node)        # UI 自动化测试
    builder.add_node("api_test", api_test_node)      # 接口测试
    builder.add_node("sync", sync_node)              # 回写 TAPD
    builder.add_node("bug", bug_node)                # 自动提 Bug
    builder.add_node("notify", notify_node)          # 企业微信通知

    # 顺序边
    builder.set_entry_point("analyze")
    builder.add_edge("analyze", "gen_cases")
    builder.add_edge("gen_cases", "assemble")

    # 并行边：UI 测试和 API 测试同时执行
    builder.add_edge("assemble", "ui_test")
    builder.add_edge("assemble", "api_test")

    # 汇合点
    builder.add_edge(["ui_test", "api_test"], "sync")

    # 条件边：根据测试结果决定是否提 Bug
    builder.add_conditional_edges(
        "sync",
        router,
        {"has_failures": "bug", "all_pass": "notify"},
    )
    builder.add_edge("bug", "notify")
    builder.add_edge("notify", END)

    # 编译图，启用检查点（支持断点续跑）
    graph = builder.compile(checkpointer=MemorySaver())
    return graph
