import axios, { AxiosInstance } from 'axios';
import { OpenApiSpec } from './openapi-builder';

interface ApifoxConfig {
  project_id: number;
  access_token: string;
  api_base_url: string;
}

interface SyncResult {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  errors: Array<{ path: string; method: string; error: string }>;
}

interface ExistingApiItem {
  id: number;
  method: string;
  path: string;
  tags: string[];
  name: string;
}

export class ApifoxPusher {
  private client: AxiosInstance;
  private config: ApifoxConfig;

  constructor(config: ApifoxConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.api_base_url,
      headers: {
        'Authorization': `Bearer ${config.access_token}`,
        'Content-Type': 'application/json',
        'X-Api-Version': '1.0',
      },
      timeout: 30000,
    });
  }

  async push(spec: OpenApiSpec, yamlContent?: string): Promise<SyncResult> {
    const result: SyncResult = { total: 0, created: 0, updated: 0, skipped: 0, errors: [] };
    const projectId = this.config.project_id;

    result.total = Object.values(spec.paths).reduce((sum, methods) => sum + Object.keys(methods).length, 0);
    console.log(`\n[apifox-pusher] 使用 OpenAPI 批量导入到项目 ${projectId} (${result.total} 个接口)...`);

    // 优先使用批量导入（自带去重）
    if (yamlContent) {
      try {
        const res = await this.client.post(`/api/v1/projects/${projectId}/import-openapi`, {
          type: 'yaml',
          content: yamlContent,
          options: { overwrite: true, mergeTags: false },
        });
        const d = res.data?.data || res.data;
        result.created = d.createdCount ?? d.created ?? 0;
        result.updated = d.updatedCount ?? d.updated ?? 0;
        result.skipped = d.skippedCount ?? d.skipped ?? 0;
        console.log(`[apifox-pusher] 批量导入成功`);
        return result;
      } catch (err) {
        console.log(`[apifox-pusher] 批量导入失败 (${err instanceof Error ? err.message : String(err)})，回退到逐一同步`);
      }
    }

    console.log(`[apifox-pusher] 读取 Apifox 项目 ${projectId} 现有接口...`);
    const existing = await this.listExistingApis();
    console.log(`[apifox-pusher] 已有接口: ${existing.length} 个`);

    const existingKeyMap = new Map<string, ExistingApiItem>();
    for (const api of existing) {
      existingKeyMap.set(this.buildUniqueKey(api.tags?.[0] || '', api.path, api.method), api);
    }

    let processedCount = 0;
    for (const [path, methods] of Object.entries(spec.paths)) {
      for (const [method, operation] of Object.entries(methods)) {
        const tag = operation.tags?.[0] || '';
        result.total++;

        try {
          const existingApi = existingKeyMap.get(this.buildUniqueKey(tag, path, method));
          if (existingApi) {
            await this.updateApi(projectId, existingApi.id, tag, method, path, operation);
            result.updated++;
          } else {
            await this.createApi(projectId, tag, method, path, operation);
            result.created++;
          }
        } catch (err) {
          result.errors.push({ path, method, error: err instanceof Error ? err.message : String(err) });
        }

        processedCount++;
        if (processedCount % 10 === 0) console.log(`  [进度] ${processedCount}/${result.total}`);
      }
    }

    console.log(`\n[apifox-pusher] 同步完成:`);
    console.log(`  总计: ${result.total} | 新建: ${result.created} | 更新: ${result.updated} | 跳过: ${result.skipped} | 错误: ${result.errors.length}`);

    return result;
  }

  private async listExistingApis(): Promise<ExistingApiItem[]> {
    try {
      const res = await this.client.get(`/api/v1/projects/${this.config.project_id}/apis`, {
        params: { pageSize: 1000, page: 1 },
      });
      return this.parseApiList(res.data);
    } catch (err) {
      console.warn(`[apifox-pusher] 读取现有接口失败，将全部新建: ${err instanceof Error ? err.message : String(err)}`);
      return [];
    }
  }

  private async createApi(
    projectId: number,
    tag: string,
    method: string,
    path: string,
    operation: any,
  ): Promise<void> {
    const body = this.buildApiBody(tag, method, path, operation);
    await this.client.post(`/api/v1/projects/${projectId}/apis`, body);
  }

  private async updateApi(
    projectId: number,
    apiId: number,
    tag: string,
    method: string,
    path: string,
    operation: any,
  ): Promise<void> {
    const body = this.buildApiBody(tag, method, path, operation);
    await this.client.put(`/api/v1/projects/${projectId}/apis/${apiId}`, body);
  }

  private buildApiBody(tag: string, method: string, path: string, operation: any): object {
    const params = operation.parameters || [];
    const queryItems = params
      .filter((p: any) => p.in === 'query')
      .map((p: any) => ({
        name: p.name,
        type: p.schema?.type || 'string',
        required: p.required || false,
        description: p.description || '',
      }));
    const pathItems = params
      .filter((p: any) => p.in === 'path')
      .map((p: any) => ({
        name: p.name,
        type: p.schema?.type || 'string',
        required: true,
        description: p.description || '',
      }));

    const body: any = {
      name: operation.summary || `${method} ${path}`,
      method: method.toUpperCase(),
      path,
      tags: [tag],
      description: operation.description || '',
      requestBody: {
        contentType: 'application/json',
      },
      response: {
        contentType: 'application/json',
        httpStatusCode: '200',
        successDescription: '成功',
      },
    };

    if (queryItems.length > 0) {
      body.parameters = queryItems;
    }
    if (pathItems.length > 0) {
      body.pathParameters = pathItems;
    }
    if (operation.requestBody) {
      body.requestBody.example = JSON.stringify(operation.requestBody.content?.['application/json']?.schema || {});
    }

    return body;
  }

  private buildUniqueKey(tag: string, path: string, method: string): string {
    return `${tag}|${path}|${method.toUpperCase()}`;
  }

  private parseApiList(data: any): ExistingApiItem[] {
    try {
      if (Array.isArray(data)) return data.map(this.mapApiItem);
      if (data?.data && Array.isArray(data.data)) return data.data.map(this.mapApiItem);
      if (data?.list && Array.isArray(data.list)) return data.list.map(this.mapApiItem);
      if (data?.items && Array.isArray(data.items)) return data.items.map(this.mapApiItem);
      return [];
    } catch {
      return [];
    }
  }

  private mapApiItem(item: any): ExistingApiItem {
    return {
      id: item.id,
      method: (item.method || 'GET').toUpperCase(),
      path: item.path || item.url || '',
      tags: item.tags || item.tag ? [item.tag] : [],
      name: item.name || '',
    };
  }
}
