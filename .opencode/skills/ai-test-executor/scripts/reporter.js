const fs = require('fs');
const path = require('path');
const { SCREENSHOT_DIR } = require('./executor');

function generateReport(results, meta) {
  const { page, action, storyId, timestamp } = meta;
  const total = results.length;
  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const errors = results.filter(r => r.status === 'error').length;

  let casesHtml = '';
  results.forEach(r => {
    const statusClass = r.status === 'pass' ? 'pass' : r.status === 'fail' ? 'fail' : 'error';
    const icon = r.status === 'pass' ? '✅' : r.status === 'fail' ? '❌' : '⚠️';
    let stepsHtml = (r.steps || []).map(s => `<div class="step">${s}</div>`).join('');
    let imgHtml = r.screenshot
      ? `<img src="../screenshots/${r.screenshot}" alt="screenshot" />`
      : '';
    casesHtml += `<div class="case">
      <h3>${icon} <span class="${statusClass}">${r.status.toUpperCase()}</span> ${r.name}</h3>
      <table><tr><th>预期</th><td>${r.expected || '-'}</td></tr>
      <tr><th>步骤</th><td>${stepsHtml || '-'}</td></tr>
      ${r.error ? `<tr><th>错误</th><td>${r.error}</td></tr>` : ''}
      ${r.screenshot ? `<tr><th>截图</th><td>${imgHtml}</td></tr>` : ''}
      </table></div>`;
  });

  const tmpl = fs.readFileSync(path.resolve(__dirname, '..', 'templates', 'report.html'), 'utf8');
  let html = tmpl
    .replace('{{timestamp}}', timestamp || new Date().toLocaleString())
    .replace('{{page}}', page || '-')
    .replace('{{action}}', action || '-')
    .replace('{{total}}', total)
    .replace('{{passed}}', passed)
    .replace('{{failed}}', failed)
    .replace('{{errors}}', errors)
    .replace('{{cases}}', casesHtml);

  const reportPath = path.resolve(SCREENSHOT_DIR, '..', `report_${Date.now()}.html`);
  fs.writeFileSync(reportPath, html, 'utf8');
  console.log(`[report] 报告已生成: ${reportPath}`);
  return reportPath;
}

module.exports = { generateReport };
