import * as fs from 'fs';
import * as path from 'path';
import { NetworkCapture, PageCaptureResult, CapturedRequest } from './network-capture';
import { OpenApiBuilder } from './openapi-builder';

const sessionDirs = [
  'E:\\006Skills\\.opencode\\skills\\apifox-sync\\output\\apifox-sync-20260609131444',
  'E:\\006Skills\\.opencode\\skills\\apifox-sync\\output\\apifox-sync-20260609132331',
  'E:\\006Skills\\.opencode\\skills\\apifox-sync\\output\\apifox-sync-20260609133327',
];

async function main() {
  const allResults: PageCaptureResult[] = [];
  const seenApis = new Set<string>();

  for (const dir of sessionDirs) {
    const pagesDir = path.join(dir, 'pages');
    if (!fs.existsSync(pagesDir)) continue;
    const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.json'));
    for (const file of files) {
      const content = fs.readFileSync(path.join(pagesDir, file), 'utf8');
      const result: PageCaptureResult = JSON.parse(content);
      // Dedup APIs within result
      const uniqueApis: CapturedRequest[] = [];
      for (const api of result.apis) {
        const key = api.method + '|' + api.pathname;
        if (!seenApis.has(key)) {
          seenApis.add(key);
          uniqueApis.push(api);
        }
      }
      result.apis = uniqueApis;
      if (uniqueApis.length > 0) {
        allResults.push(result);
      }
    }
  }

  console.log(`合并 ${allResults.length} 个页面，去重后的 API 数据`);

  const builder = new OpenApiBuilder();
  const spec = builder.build(allResults);
  const yamlContent = builder.toYaml(spec);

  const outputDir = 'E:\\006Skills\\.opencode\\skills\\apifox-sync\\output';
  const mergedPath = path.join(outputDir, 'merged-api-spec.yaml');
  fs.writeFileSync(mergedPath, yamlContent, 'utf8');
  console.log(`已生成合并文件: ${mergedPath}`);

  const apiCount = Object.values(spec.paths).reduce((s, m) => s + Object.keys(m).length, 0);
  console.log(`共 ${apiCount} 个接口`);
}

main().catch(console.error);
