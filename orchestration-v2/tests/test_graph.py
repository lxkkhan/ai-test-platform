"""
编排引擎单元测试
"""
import pytest
from orchestrator.graph import build_graph, router
from orchestrator.state import TestState


def test_router_all_pass():
    """全部通过时路由到 notify"""
    state = TestState(
        story_id="S-001",
        analysis=None, plan_id=None, case_ids=[], script_paths=[],
        ui_test_results=[{"status": "pass"}, {"status": "pass"}],
        api_test_results=[{"status": "pass"}],
        bug_ids=[], final_report=None,
        steps=[], errors=[], parallel=True, notify_on="always",
    )
    assert router(state) == "all_pass"


def test_router_has_failures():
    """有失败时路由到 bug"""
    state = TestState(
        story_id="S-001",
        analysis=None, plan_id=None, case_ids=[], script_paths=[],
        ui_test_results=[{"status": "pass"}],
        api_test_results=[{"status": "fail"}],
        bug_ids=[], final_report=None,
        steps=[], errors=[], parallel=True, notify_on="always",
    )
    assert router(state) == "has_failures"


def test_router_on_failure_skip():
    """notify_on=on_failure 且全部通过时路由到 all_pass（直接结束）"""
    state = TestState(
        story_id="S-001",
        analysis=None, plan_id=None, case_ids=[], script_paths=[],
        ui_test_results=[{"status": "pass"}],
        api_test_results=[{"status": "pass"}],
        bug_ids=[], final_report=None,
        steps=[], errors=[], parallel=True, notify_on="on_failure",
    )
    assert router(state) == "all_pass"


def test_router_empty_results():
    """无测试结果时视为全部通过"""
    state = TestState(
        story_id="S-001",
        analysis=None, plan_id=None, case_ids=[], script_paths=[],
        ui_test_results=[], api_test_results=[],
        bug_ids=[], final_report=None,
        steps=[], errors=[], parallel=True, notify_on="always",
    )
    assert router(state) == "all_pass"


def test_graph_compiles():
    """验证图编译成功"""
    g = build_graph()
    nodes = list(g.nodes.keys())
    assert "analyze" in nodes
    assert "gen_cases" in nodes
    assert "assemble" in nodes
    assert "ui_test" in nodes
    assert "api_test" in nodes
    assert "sync" in nodes
    assert "bug" in nodes
    assert "notify" in nodes
    assert "__start__" in nodes
    assert len(nodes) == 9
