/**
 * run-reporter.js
 * 保存执行结果 + 生成 HTML 报告
 */
const fs = require('fs');
const path = require('path');

const RUNS_DIR = path.resolve(__dirname, '..', '..', '..', '.ai-test-runs');

function saveRun(runId, meta, results) {
  const runDir = path.join(RUNS_DIR, runId);
  fs.mkdirSync(runDir, { recursive: true });

  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const errors = results.filter(r => r.status === 'error').length;

  const manifest = {
    id: runId,
    page: meta.page,
    areas: meta.areas,
    total: results.length,
    passed,
    failed,
    errors,
    duration: meta.duration || 0,
    startedAt: meta.startedAt,
    finishedAt: new Date().toISOString(),
  };

  fs.writeFileSync(path.join(runDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  fs.writeFileSync(path.join(runDir, 'results.json'), JSON.stringify(results, null, 2), 'utf8');
  generateReport(runDir, manifest, results);
  console.log(`\n📄 报告: ${path.join(runDir, 'report.html')}`);
}

function generateReport(runDir, manifest, results) {
  let casesHtml = '';
  results.forEach(r => {
    const icon = r.status === 'pass' ? '✅' : r.status === 'fail' ? '❌' : '⚠️';
    const steps = (r.steps || []).map(s => `<div class="step">${s}</div>`).join('');
    const imgHtml = r.screenshot
      ? `<img src="../screenshots/${r.screenshot}" alt="screenshot" style="max-width:800px;border:1px solid #ddd;margin:10px 0" />`
      : '';
    casesHtml += `<div class="case">
      <h3>${icon} <span class="${r.status}">${r.status.toUpperCase()}</span> ${r.field} | ${r.type}</h3>
      <table>
        ${r.error ? `<tr><th>错误</th><td>${r.error}</td></tr>` : ''}
        <tr><th>步骤</th><td>${steps || '-'}</td></tr>
        <tr><th>截图</th><td>${imgHtml || '-'}</td></tr>
      </table></div>`;
  });

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>测试报告 - ${manifest.page}</title>
<style>
body{font-family:'Microsoft YaHei',sans-serif;padding:20px;background:#f5f5f5;max-width:1000px;margin:0 auto}
h1{color:#1890ff;border-bottom:2px solid #1890ff;padding-bottom:10px}
.summary{background:#fff;padding:20px;border-radius:8px;margin:20px 0;box-shadow:0 2px 8px rgba(0,0,0,.1)}
.summary span{display:inline-block;margin:0 20px 10px 0;font-size:16px}
.pass{color:#52c41a;font-weight:bold}
.fail{color:#ff4d4f;font-weight:bold}
.error{color:#faad14;font-weight:bold}
.case{margin:10px 0;background:#fff;border-radius:8px;padding:15px;box-shadow:0 1px 4px rgba(0,0,0,.08)}
.case h3{margin:0 0 10px 0}
.case .step{color:#666;margin:3px 0;font-size:13px;padding:2px 0;border-bottom:1px dotted #eee}
table{border-collapse:collapse;width:100%;font-size:13px}
td,th{border:1px solid #ddd;padding:6px 8px;text-align:left}
th{background:#f0f0f0;width:80px}
</style></head><body>
<h1>🤖 AI 测试执行报告</h1>
<p>页面: ${manifest.page} | 执行ID: ${manifest.id}</p>
<div class="summary">
<h2>执行汇总</h2>
<span>总计: <b>${manifest.total}</b></span>
<span class="pass">✅ 通过: <b>${manifest.passed}</b></span>
<span class="fail">❌ 失败: <b>${manifest.failed}</b></span>
<span class="error">⚠️ 异常: <b>${manifest.errors}</b></span>
<span>⏱ ${(manifest.duration / 1000).toFixed(1)}s</span>
</div>
<h2>详细结果</h2>
${casesHtml}
<p style="color:#888;font-size:12px;margin-top:20px">生成时间: ${manifest.finishedAt}</p>
</body></html>`;

  fs.writeFileSync(path.join(runDir, 'report.html'), html, 'utf8');
}

async function listRuns() {
  if (!fs.existsSync(RUNS_DIR)) return [];
  const dirs = fs.readdirSync(RUNS_DIR).filter(d => d.startsWith('run_'));
  return dirs.map(d => {
    try {
      return JSON.parse(fs.readFileSync(path.join(RUNS_DIR, d, 'manifest.json'), 'utf8'));
    } catch { return null; }
  }).filter(Boolean).sort((a, b) => b.startedAt?.localeCompare(a.startedAt));
}

module.exports = { saveRun, listRuns, RUNS_DIR };
