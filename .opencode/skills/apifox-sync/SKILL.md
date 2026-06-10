---
name: apifox-sync
description: 接口捕获 & 同步 Apifox。自动遍历目标系统的每个页面，通过 Playwright 网络拦截捕获所有业务 API 请求，生成标准 OpenAPI 3.0 规范，并根据 (模块+路径+方法) 唯一性校验后同步到 Apifox 项目。触发词：同步接口、apifox同步、接口捕获、接口文档同步。
metadata:
  audience: testers
  workflow: test-automation
---

# apifox-sync — 接口捕获 & 同步 Apifox

## 功能概述

自动扫描目标系统的所有页面，捕获页面触发的业务 API 请求，生成结构化接口文档并同步到 Apifox。

| 能力 | 说明 |
|------|------|
| 自动遍历 | 登录后展开菜单，逐页访问所有叶子菜单页面 |
| 网络拦截 | 对每个页面拦截 XHR/Fetch 请求，采集 method/url/params/body/response |
| 智能过滤 | 排除登录、静态资源、OSS 上传等非业务请求 |
| OpenAPI 生成 | 按菜单分组（tag），生成标准 OpenAPI 3.0 YAML |
| Apifox 同步 | 基于 (tag + path + method) 唯一性校验，新建或更新接口 |

## 触发方式

```bash
# 全量同步
npx tsx .opencode/skills/apifox-sync/scripts/main.ts

# 无头模式（不显示浏览器窗口）
npx tsx .opencode/skills/apifox-sync/scripts/main.ts --headless

# 指定输出目录
npx tsx .opencode/skills/apifox-sync/scripts/main.ts --output ./my-output
```

## 工作流程

```
1. 启动 Chrome（CDP 模式，端口 9302）
2. 自动登录目标系统（复用 dom-recorder 的登录脚本）
3. 展开左侧菜单，扫描所有叶子菜单项
4. 逐菜单页遍历：
   ├─ 导航到页面
   ├─ 开启网络拦截器 → 等待页面加载完成
   ├─ 自动触发交互（翻页、展开等）
   ├─ 关闭拦截器 → 捕获该页面的 API 列表
   └─ 保存到 { menuName → apis[] } 映射
5. 汇总所有页面数据 → 生成 OpenAPI 3.0 spec
6. 读取 Apifox 项目现有接口列表
7. 逐接口校验 (tag + path + method) 唯一性：
   ├─ 已存在 → PUT 更新
   └─ 不存在 → POST 创建
8. 输出同步报告
```

## 配置项

| 配置 | 类型 | 说明 |
|------|------|------|
| `apifox.project_id` | number | Apifox 项目 ID（当前: 2620342） |
| `apifox.access_token` | string | Apifox 个人访问令牌 |
| `capture.exclude_patterns` | string[] | 排除的非业务接口正则 |
| `capture.include_only` | string[] | 只捕获包含这些前缀的请求 |

## 输出产物

```
output/apifox-sync-{timestamp}/
  ├── api-spec.yaml           # OpenAPI 3.0 规范
  ├── api-spec.json           # JSON 版本
  ├── sync-report.json        # 推送结果
  └── pages/                  # 每页的原始捕获数据
      ├── 到货单列表.json
      └── ...
```
