import * as yaml from 'js-yaml';
import { CapturedRequest, PageCaptureResult } from './network-capture';

export interface OpenApiSpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description: string;
  };
  servers: Array<{ url: string; description: string }>;
  tags: Array<{ name: string; description: string }>;
  paths: Record<string, Record<string, OpenApiOperation>>;
}

interface OpenApiOperation {
  tags: string[];
  summary: string;
  description?: string;
  operationId?: string;
  parameters?: OpenApiParameter[];
  requestBody?: OpenApiRequestBody;
  responses: Record<string, OpenApiResponse>;
}

interface OpenApiParameter {
  name: string;
  in: 'query' | 'path' | 'header';
  required: boolean;
  description?: string;
  schema: { type: string };
}

interface OpenApiRequestBody {
  required: boolean;
  content: Record<string, { schema: object }>;
}

interface OpenApiResponse {
  description: string;
  content?: Record<string, { schema: object }>;
}

export class OpenApiBuilder {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || 'https://tcm-dc-sit.zgzykg.com.cn';
  }

  build(pageResults: PageCaptureResult[]): OpenApiSpec {
    const paths: Record<string, Record<string, OpenApiOperation>> = {};
    const tags = new Map<string, string>();

    for (const pageResult of pageResults) {
      const tagName = pageResult.menuName;
      const tagDesc = pageResult.menuCategory
        ? `${pageResult.menuCategory} > ${pageResult.menuName}`
        : pageResult.menuName;
      if (!tags.has(tagName)) {
        tags.set(tagName, tagDesc);
      }

      for (const api of pageResult.apis) {
        if (!api.pathname) continue;

        const methodKey = api.method.toLowerCase();
        if (!paths[api.pathname]) {
          paths[api.pathname] = {};
        }

        if (paths[api.pathname][methodKey]) {
          const existing = paths[api.pathname][methodKey];
          if (!existing.tags.includes(tagName)) {
            existing.tags.push(tagName);
          }
          continue;
        }

        const params = this.buildParameters(api);
        const requestBody = this.buildRequestBody(api);
        const responses = this.buildResponses(api);

        const bodyTag = this.getBodyTag(api);
        const summary = bodyTag ? `${api.method} ${api.pathname} (${bodyTag})` : `${api.method} ${api.pathname}`;

        paths[api.pathname][methodKey] = {
          tags: [tagName],
          summary,
          description: `捕获自页面「${pageResult.menuName}」`,
          operationId: `${methodKey}${api.pathname.replace(/[^a-zA-Z0-9]/g, '_')}`,
          parameters: params.length > 0 ? params : undefined,
          requestBody: requestBody || undefined,
          responses,
        };
      }
    }

    return {
      openapi: '3.0.3',
      info: {
        title: '配送中心 SAAS 接口文档',
        version: `${new Date().toISOString().slice(0, 10)}-auto`,
        description: `由 apifox-sync 自动捕获生成\n捕获时间: ${new Date().toISOString()}\n共 ${pageResults.length} 个页面, ${this.countTotalApis(paths)} 个接口`,
      },
      servers: [{ url: this.baseUrl, description: '配送中心 SAAS 生产环境' }],
      tags: Array.from(tags.entries()).map(([name, description]) => ({ name, description })),
      paths,
    };
  }

  toYaml(spec: OpenApiSpec): string {
    return yaml.dump(spec, {
      indent: 2,
      lineWidth: 200,
      noRefs: true,
      sortKeys: false,
    });
  }

  toJson(spec: OpenApiSpec): string {
    return JSON.stringify(spec, null, 2);
  }

  private buildParameters(api: CapturedRequest): OpenApiParameter[] {
    const params: OpenApiParameter[] = [];

    for (const [key, value] of Object.entries(api.queryParams)) {
      params.push({
        name: key,
        in: 'query',
        required: false,
        schema: { type: this.inferType(value) },
      });
    }

    const pathParams = api.pathname.match(/\{(\w+)\}|:(\w+)/g);
    if (pathParams) {
      for (const match of pathParams) {
        const name = match.replace(/[{}:]/g, '');
        if (!params.find(p => p.name === name && p.in === 'path')) {
          params.push({
            name,
            in: 'path',
            required: true,
            schema: { type: 'string' },
          });
        }
      }
    }

    return params;
  }

  private buildRequestBody(api: CapturedRequest): OpenApiRequestBody | null {
    if (!api.postData || api.method === 'GET') return null;

    let parsedBody: object = {};
    try {
      if (api.requestContentType?.includes('json')) {
        parsedBody = JSON.parse(api.postData);
      }
    } catch {}

    const schema = this.inferSchemaFromData(parsedBody);
    return {
      required: true,
      content: {
        'application/json': {
          schema: schema as object,
        },
      },
    };
  }

  private buildResponses(api: CapturedRequest): Record<string, OpenApiResponse> {
    const responses: Record<string, OpenApiResponse> = {
      '200': {
        description: '成功',
      },
    };

    if (api.responseBodyPreview) {
      let parsedBody: object = {};
      try {
        parsedBody = JSON.parse(api.responseBodyPreview);
      } catch {}

      const schema = this.inferSchemaFromData(parsedBody);
      responses['200'].content = {
        'application/json': {
          schema: schema as object,
        },
      };
    }

    responses['500'] = { description: '服务器内部错误' };

    return responses;
  }

  private inferSchemaFromData(data: unknown): unknown {
    if (data === null || data === undefined) {
      return { type: 'object', properties: {} };
    }
    if (typeof data === 'string') return { type: 'string', example: data.slice(0, 100) };
    if (typeof data === 'number') return { type: 'number', example: data };
    if (typeof data === 'boolean') return { type: 'boolean', example: data };
    if (Array.isArray(data)) {
      const itemTypes = data.map(d => this.inferSchemaFromData(d));
      const mergedItems = itemTypes[0] || { type: 'object' };
      return {
        type: 'array',
        items: mergedItems,
        example: data.length > 0 ? data.slice(0, 1) : [],
      };
    }
    if (typeof data === 'object') {
      const properties: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
        properties[key] = this.inferSchemaFromData(value);
      }
      return { type: 'object', properties };
    }
    return { type: 'string' };
  }

  private getBodyTag(api: CapturedRequest): string {
    if (!api.postData) return '';
    try {
      const parsed = JSON.parse(api.postData);
      return this.extractBrief(parsed);
    } catch {
      return api.postData.replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, '_').slice(0, 50);
    }
  }

  private extractBrief(data: any): string {
    if (!data || typeof data !== 'object') return '';
    if (data.action) return String(data.action).slice(0, 40);
    if (data.operationType) return String(data.operationType).slice(0, 40);
    if (data.operation) return String(data.operation).slice(0, 40);
    if (data.method) return String(data.method).slice(0, 40);

    const keys = Object.keys(data);
    if (keys.length === 0) return '';

    const firstKey = keys[0];
    const firstVal = data[firstKey];
    if (typeof firstVal === 'string') return `${firstKey}=${firstVal}`.slice(0, 50);
    if (Array.isArray(firstVal)) return `${firstKey}[${firstVal.length}]`;
    if (typeof firstVal === 'object' && firstVal) return firstKey;

    return firstKey;
  }

  private inferType(value: string): string {
    if (/^\d+$/.test(value)) return 'integer';
    if (/^\d+\.\d+$/.test(value)) return 'number';
    if (value === 'true' || value === 'false') return 'boolean';
    return 'string';
  }

  private countTotalApis(paths: Record<string, Record<string, OpenApiOperation>>): number {
    let count = 0;
    for (const path of Object.values(paths)) {
      count += Object.keys(path).length;
    }
    return count;
  }
}
