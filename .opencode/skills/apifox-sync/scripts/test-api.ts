const t = 'afxp_bd17ebBiJKhV6YQIgIp2BHDbPgH2cGBqKV6P';
const pid = 2620342;
const yaml = 'openapi: "3.0.3"\ninfo:\n  title: T\n  version: "1.0"\npaths: {}\n';

async function tryBody(body: any, label: string) {
  const r = await fetch('https://api.apifox.com/api/v1/projects/' + pid + '/import-openapi', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const text = await r.text();
  if (r.status !== 422) console.log(label + ': ' + r.status + ' ' + text.slice(0, 300));
  else if (!text.includes('Parameter is missing')) console.log(label + ': ' + r.status + ' ' + text.slice(0, 300));
}

async function main() {
  // Try every possible field name combination
  const structures = [
    { importFormat: 'openapi', data: { type: 'yaml', content: yaml }, options: { overwrite: true } },
    { importFormat: 'openapi', spec: yaml, type: 'yaml' },
    { importFormat: 'openapi', openapi: yaml, type: 'yaml' },
    { importFormat: 'openapi', content: yaml, type: 'yaml' },
    { importFormat: 'openapi', api: yaml, type: 'yaml' },
    { importFormat: 'openapi', file: yaml, type: 'yaml' },
    { format: 'openapi', data: { type: 'yaml', content: yaml } },
    { type: 'openapi', data: { content: yaml } },
    { data: { content: yaml } },
    { spec: yaml, type: 'yaml' },
    { importFormat: 'openapi', data: yaml, type: 'yaml' },
  ];

  for (let i = 0; i < structures.length; i++) {
    await tryBody(structures[i], 'v' + i);
  }
  console.log('done');
}
main();
