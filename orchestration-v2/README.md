# Test Orchestrator V2

LangGraph + FastAPI test orchestration engine, integrated with Dify.

## Quick Start

```bash
# install dependencies
pip install -r requirements.txt

# start API server
uvicorn api.main:app --port 8000

# invoke a test flow
curl -X POST http://localhost:8000/invoke -H "Content-Type: application/json" -d '{"story_id":"S-12345"}'

# check status
curl http://localhost:8000/status/<thread_id>
```

## Dify Deployment

```bash
cd infra/dify
docker compose up -d
# open http://localhost:3000
```

## Architecture

```
User → Dify Workflow (HTTP Request)
  → LangGraph Service (FastAPI :8000)
    → analyze_node       (TAPD API)
    → gen_cases_node     (TAPD API)
    → assemble_node      (subprocess: template-engine)
    → ui_test_node       (Playwright)
    → api_test_node      (OpenAPI spec)
    → sync_node          (TAPD API)
    → bug_node           (TAPD API)
    → notify_node        (WeChat Work)
```

## Project Structure

```
orchestration-v2/
├── orchestrator/        LangGraph state graph + nodes
├── api/                 FastAPI service
├── shared/              TAPD client, WeChat notifier, config
├── api_test_runner/     API test executor from OpenAPI spec
├── infra/dify/          Docker Compose for Dify
└── tests/
```
