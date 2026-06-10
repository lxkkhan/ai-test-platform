import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

const specPath = 'E:\\006Skills\\.opencode\\skills\\apifox-sync\\output\\merged-api-spec.yaml';
const spec = yaml.load(fs.readFileSync(specPath, 'utf8')) as any;

const lines: string[] = [];
function w(s = '') { lines.push(s); }

w('# 配送中心 SAAS 接口文档');
w();
w(`> 自动生成时间: ${spec.info.version}`);
w(`> 共 ${spec.tags.length} 个模块, ${Object.keys(spec.paths).length} 个接口`);
w();
w('---');
w();

// Build module -> paths map
const modulePaths = new Map<string, { path: string; method: string; op: any }[]>();
for (const [p, methods] of Object.entries(spec.paths) as any) {
  for (const [method, op] of Object.entries(methods) as any) {
    const tag = op.tags?.[0] || '未分类';
    if (!modulePaths.has(tag)) modulePaths.set(tag, []);
    modulePaths.get(tag)!.push({ path: p, method, op });
  }
}

// Sort modules by tag order in spec
const tagOrder = new Map(spec.tags.map((t: any, i: number) => [t.name, i]));
const sortedModules = [...modulePaths.entries()].sort((a, b) => {
  const ai = tagOrder.get(a[0]) ?? 999;
  const bi = tagOrder.get(b[0]) ?? 999;
  return ai - bi;
});

for (const [module, endpoints] of sortedModules) {
  const tagInfo = spec.tags.find((t: any) => t.name === module);
  const desc = tagInfo?.description || module;
  w(`## ${module}`);
  w();
  w(`> ${desc}`);
  w();

  // Group by controller (first 3 path segments)
  const controllerGroups = new Map<string, typeof endpoints>();
  for (const ep of endpoints) {
    const segs = ep.path.split('/').filter(Boolean);
    const controller = segs.slice(0, 3).join('/') || '其他';
    if (!controllerGroups.has(controller)) controllerGroups.set(controller, []);
    controllerGroups.get(controller)!.push(ep);
  }

  for (const [controller, eps] of controllerGroups) {
    w(`### \`/${controller}\``);
    w();

    for (const { path: p, method, op } of eps) {
      const methodBadge = method.toUpperCase();
      const summary = op.summary || `${methodBadge} ${p}`;
      w(`#### ${methodBadge} \`${p}\``);
      w();
      w(`${summary}`);
      w();

      // Params
      const params = op.parameters || [];
      if (params.length > 0) {
        w('| 参数名 | 位置 | 类型 | 必填 | 说明 |');
        w('|--------|------|------|------|------|');
        for (const param of params) {
          w(`| \`${param.name}\` | ${param.in} | ${param.schema?.type || 'string'} | ${param.required ? '是' : '否'} | ${param.description || ''} |`);
        }
        w();
      }

      // Request body
      if (op.requestBody) {
        const bodySchema = op.requestBody.content?.['application/json']?.schema;
        if (bodySchema?.properties) {
          w('**请求体:**');
          w();
          w('| 字段 | 类型 | 说明 |');
          w('|------|------|------|');
          for (const [key, val] of Object.entries(bodySchema.properties) as any) {
            const t = val.type || 'string';
            const ex = val.example !== undefined ? `示例: \`${JSON.stringify(val.example)}\`` : '';
            w(`| \`${key}\` | ${t} | ${ex} |`);
          }
          w();
        }
      }

      // Response
      w('**响应:** `200` 成功');
      w();
      w('---');
      w();
    }
  }
}

const outputPath = 'E:\\006Skills\\.opencode\\skills\\apifox-sync\\output\\api-docs.md';
fs.writeFileSync(outputPath, lines.join('\n'), 'utf8');
console.log(`已生成: ${outputPath}`);
console.log(`共 ${spec.tags.length} 个模块, ${Object.keys(spec.paths).length} 个接口`);
