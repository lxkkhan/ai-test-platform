import type { Page } from 'playwright';

export interface CapturedRequest {
  id: string;
  method: string;
  url: string;
  pathname: string;
  headers: Record<string, string>;
  queryParams: Record<string, string>;
  postData: string | null;
  requestContentType: string | null;
  timestamp: number;
  statusCode: number | null;
  responseHeaders: Record<string, string> | null;
  responseBodyPreview: string | null;
  responseContentType: string | null;
}

export interface PageCaptureResult {
  menuName: string;
  menuCategory: string;
  url: string;
  apis: CapturedRequest[];
}

export interface CaptureConfig {
  excludePatterns: string[];
  includeOnly: string[];
  minWaitMs: number;
}

export class NetworkCapture {
  private requests = new Map<string, CapturedRequest>();
  private isActive = false;
  private page: Page | null = null;

  constructor(private config: CaptureConfig) {}

  start(page: Page): void {
    this.page = page;
    this.isActive = true;
    this.requests.clear();

    page.on('request', this.handleRequest);
    page.on('response', this.handleResponse);
  }

  stop(): CapturedRequest[] {
    this.isActive = false;
    if (this.page) {
      this.page.removeListener('request', this.handleRequest);
      this.page.removeListener('response', this.handleResponse);
      this.page = null;
    }
    const result = Array.from(this.requests.values());
    this.requests.clear();
    return result;
  }

  private handleRequest = (req: any) => {
    if (!this.isActive) return;
    const url = req.url();
    if (!this.shouldCapture(url)) return;

    const parsedUrl = new URL(url);
    const queryParams: Record<string, string> = {};
    parsedUrl.searchParams.forEach((v, k) => { queryParams[k] = v; });

    const method = req.method();
    const pathname = parsedUrl.pathname;
    const postData = req.postData() || null;

    let bodyKey = '';
    if (postData && method === 'POST') {
      try {
        const parsed = JSON.parse(postData);
        bodyKey = extractBodyKey(parsed);
      } catch {
        bodyKey = postData.slice(0, 80).replace(/[^a-zA-Z0-9]/g, '_');
      }
    }

    const id = `${method}_${pathname}_${bodyKey}`;
    if (this.requests.has(id)) return;

    this.requests.set(id, {
      id,
      method,
      url,
      pathname,
      headers: req.headers(),
      queryParams,
      postData,
      requestContentType: req.headers()['content-type'] || null,
      timestamp: Date.now(),
      statusCode: null,
      responseHeaders: null,
      responseBodyPreview: null,
      responseContentType: null,
    });
  };

  private handleResponse = (res: any) => {
    if (!this.isActive) return;
    const url = res.url();
    if (!this.shouldCapture(url)) return;

    const parsedUrl = new URL(url);
    const id = `${res.request().method()}_${parsedUrl.pathname}`;
    const existing = this.requests.get(id);
    if (!existing) return;

    existing.statusCode = res.status();
    existing.responseHeaders = res.headers();

    const ct = res.headers()['content-type'] || '';
    existing.responseContentType = ct;

    if (ct.includes('json')) {
      res.text().then(body => {
        existing.responseBodyPreview = body.slice(0, 5000);
      }).catch(() => {});
    }
  };

  private shouldCapture(url: string): boolean {
    try {
      const parsed = new URL(url);

      if (parsed.pathname === '/' || parsed.pathname === '') return false;

      const host = parsed.hostname;
      if (!host.includes('zgzykg.com.cn')) return false;
      if (host.includes('dev.')) return false;

      const path = parsed.pathname;
      if (!path.includes('/pszxSaasServer/') && !path.includes('/api/')) return false;

      const excludeCheck = this.config.excludePatterns;
      for (const pattern of excludeCheck) {
        if (url.match(new RegExp(pattern, 'i'))) return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  async interactAndCapture(page: Page): Promise<void> {
    const triggerActions = [
      async () => {
        const btns = await page.locator('button:has-text("查询"), button:has-text("搜索"), button:has-text("查找")').all();
        for (const btn of btns) {
          try { await btn.click({ timeout: 2000 }); await page.waitForTimeout(1000); } catch {}
        }
      },
      async () => {
        const selects = await page.locator('.ant-select-selector, .ant-cascader-picker').all();
        if (selects.length > 0 && selects.length < 3) {
          for (const sel of selects) {
            try { await sel.click({ timeout: 1000 }); await page.waitForTimeout(500); } catch {}
          }
        }
      },
    ];
    for (const action of triggerActions) {
      await action();
    }
    await page.waitForTimeout(2000);
  }
}

export function extractBodyKey(data: any): string {
  if (!data || typeof data !== 'object') return 'no_body';
  if (data.action) return safeKey(data.action);
  if (data.operationType) return safeKey(data.operationType);
  if (data.operation) return safeKey(data.operation);

  const keys = Object.keys(data);
  if (keys.length === 0) return 'empty_obj';

  const firstVal = data[keys[0]];
  if (typeof firstVal === 'string') return `${safeKey(keys[0])}_${safeKey(firstVal)}`;
  if (typeof firstVal === 'object' && firstVal) {
    const subKeys = Object.keys(firstVal);
    if (subKeys.length > 0) {
      const subFirst = firstVal[subKeys[0]];
      if (typeof subFirst === 'string') return `${safeKey(keys[0])}_${safeKey(subKeys[0])}_${safeKey(subFirst)}`;
      return `${safeKey(keys[0])}_${safeKey(subKeys[0])}`;
    }
  }

  const dataStr = JSON.stringify(data).slice(0, 100).replace(/[^a-zA-Z0-9]/g, '_');
  return dataStr;
}

function safeKey(s: string): string {
  return s.replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, '_').slice(0, 40);
}
