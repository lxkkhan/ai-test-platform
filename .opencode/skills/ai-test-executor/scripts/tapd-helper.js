const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CONFIG = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', '..', '_shared', 'tapd-config.json'), 'utf8'));
const WS = CONFIG.workspace_id;
const TOKEN_URL = CONFIG.token_url;
const API_URL = CONFIG.api_url;

function getToken() {
  const cmd = `curl.exe -s -u "${CONFIG.api_user}:${CONFIG.api_password}" -d "grant_type=client_credentials" "${TOKEN_URL}"`;
  return JSON.parse(execSync(cmd, { encoding: 'utf8' })).data.access_token;
}

function getTaskOwner(storyId, token) {
  try {
    const cmd = `curl.exe -s -H "Authorization: Bearer ${token}" "${API_URL}/tasks?workspace_id=${WS}&story_id=${storyId}&fields=id,name,owner"`;
    const out = execSync(cmd, { encoding: 'utf8' });
    const data = JSON.parse(out).data;
    if (data && data.length > 0) return data[0].Task.owner || CONFIG.real_user;
  } catch {}
  return CONFIG.real_user;
}

function createTAPDTestCase(tc, storyId, token) {
  try {
    const tmp = `${process.env.TEMP}/tc_${tc.id}.txt`;
    const desc = `操作步骤：\n${tc.steps ? tc.steps.join('\n') : tc.description}\n\n预期：${tc.expected}`;
    fs.writeFileSync(tmp, desc, 'utf8');
    const cmd = `curl.exe -s -H "Authorization: Bearer ${token}" --data-urlencode "workspace_id=${WS}" --data-urlencode "title=${tc.name}" --data-urlencode "steps@${tmp}" --data-urlencode "expectation=${tc.expected}" --data-urlencode "story_id=${storyId}" "${API_URL}/tcases"`;
    const out = execSync(cmd, { encoding: 'utf8' });
    const result = JSON.parse(out);
    if (result.status === 1) console.log(`  ✓ TAPD用例已创建: ${tc.name}`);
    return result;
  } catch (e) {
    console.warn(`  ✗ TAPD用例创建失败: ${e.message}`);
    return null;
  }
}

function submitBug(tc, screenshotPath, storyId, owner, dueDate, token) {
  try {
    const tmp = `${process.env.TEMP}/bug_${tc.id}.txt`;
    const desc = `<p><strong>【AI测试自动提报】</strong></p>
<p><strong>测试用例：</strong>${tc.name}</p>
<p><strong>操作步骤：</strong></p>${tc.steps.map(s => `<p>${s}</p>`).join('')}
<p><strong>预期结果：</strong>${tc.expected}</p>
<p><strong>实际结果：</strong>${tc.error || '操作失败'}</p>`;
    if (screenshotPath) desc += `<p><strong>截图：</strong>${screenshotPath}</p>`;
    fs.writeFileSync(tmp, desc, 'utf8');

    const cmd = `curl.exe -s -H "Authorization: Bearer ${token}" --data-urlencode "workspace_id=${WS}" --data-urlencode "title=[AI测试] ${tc.name}" --data-urlencode "severity=一般" --data-urlencode "priority_label=中" --data-urlencode "module=其他" --data-urlencode "current_owner=${owner}" --data-urlencode "description@${tmp}" --data-urlencode "testtype=功能测试" --data-urlencode "testphase=功能测试阶段" "${API_URL}/bugs"`;
    const out = execSync(cmd, { encoding: 'utf8' });
    const result = JSON.parse(out);
    if (result.status === 1) {
      const bugId = result.data.Bug.id;
      console.log(`  ✓ Bug已创建: #${bugId}`);

      // Link to story
      try {
        const relCmd = `curl.exe -s -X POST -H "Authorization: Bearer ${token}" -d "workspace_id=${WS}&source_type=bug&source_id=${bugId}&target_type=story&target_id=${storyId}" "${API_URL}/relations"`;
        execSync(relCmd, { encoding: 'utf8' });
        console.log(`  ✓ Bug已关联到story #${storyId}`);
      } catch {}

      return bugId;
    }
    return null;
  } catch (e) {
    console.warn(`  ✗ Bug提交失败: ${e.message}`);
    return null;
  }
}

function calculateDueDate(days = 2) {
  const now = new Date();
  let count = 0;
  while (count < days) {
    now.setDate(now.getDate() + 1);
    const dow = now.getDay();
    if (dow !== 0 && dow !== 6) count++;
  }
  return now.toISOString().split('T')[0];
}

module.exports = { getToken, getTaskOwner, createTAPDTestCase, submitBug, calculateDueDate };
