(function() {
  'use strict';

  var MAX_STEPS = 10;
  var operationLog = [];
  var panelVisible = false;
  var panelEl = null;
  var lastUrl = window.location.href;
  var inputTimers = {};
  var screenshotDataUrl = '';
  var mediaRecorder = null;
  var recordedChunks = [];
  var recordingStartTime = 0;
  var recordingTimer = null;
  var pastedImages = [];

  var SENSITIVE_PATTERNS = [
    { pattern: /^\d{17}[\dXx]$/, desc: '身份证号' },
    { pattern: /^1[3-9]\d{9}$/, desc: '手机号' },
    { pattern: /^\d{16,19}$/, desc: '银行卡号' },
    { pattern: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/, desc: '邮箱' }
  ];

  function maskValue(val) {
    if (!val || typeof val !== 'string') return val;
    for (var i = 0; i < SENSITIVE_PATTERNS.length; i++) {
      if (SENSITIVE_PATTERNS[i].pattern.test(val.trim())) {
        return '***[' + SENSITIVE_PATTERNS[i].desc + ']';
      }
    }
    if (val.length > 100) {
      return val.substring(0, 100) + '...';
    }
    return val;
  }

  function getElementLabel(el) {
    var aria = el.getAttribute('aria-label') || el.getAttribute('aria-describedby') || el.getAttribute('title');
    if (aria) return aria;
    if (el.getAttribute('placeholder')) return el.getAttribute('placeholder');
    if (el.getAttribute('name')) return el.getAttribute('name');
    if (el.getAttribute('data-testid')) return el.getAttribute('data-testid');
    return null;
  }

  function getVisibleText(el) {
    // Walk text nodes to get visible text, prioritizing the element itself and children
    var text = '';
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
    while (walker.nextNode()) {
      var parent = walker.currentNode.parentNode;
      if (parent && !/^(SCRIPT|STYLE|NOSCRIPT|SVG|PATH)$/i.test(parent.tagName)) {
        var t = walker.currentNode.textContent.trim();
        if (t) text += t;
      }
    }
    return text.substring(0, 60);
  }

  function getElementDesc(el) {
    if (!el || el === document.body || el === document.documentElement) return '页面';
    if (el.closest('.tapd-bug-panel, .tapd-bug-floater, .tapd-toast')) return null;

    var label = getElementLabel(el);
    if (label) return label;

    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') {
      var fieldLabel = findAssociatedLabel(el);
      if (fieldLabel) return fieldLabel;
    }

    var text = getVisibleText(el);
    if (text && text.length <= 60) return text;

    var tag = el.tagName.toLowerCase();
    if (el.id) return tag + '#' + el.id;
    if (el.className && typeof el.className === 'string') {
      var cls = el.className.trim().split(/\s+/).filter(function(c) { return c.length > 0 && c !== 'tapd-bug-panel'; })[0];
      if (cls) return tag + '.' + cls;
    }
    if (el.getAttribute('type')) return tag + '[type="' + el.getAttribute('type') + '"]';

    return tag;
  }

  function findAssociatedLabel(el) {
    if (el.labels && el.labels.length > 0) return el.labels[0].textContent.trim();
    if (el.id) {
      var label = document.querySelector('label[for="' + el.id + '"]');
      if (label) return label.textContent.trim();
    }
    var parent = el.closest('label');
    if (parent) {
      var clone = parent.cloneNode(true);
      var inputs = clone.querySelectorAll('input, select, textarea');
      for (var i = 0; i < inputs.length; i++) inputs[i].remove();
      return clone.textContent.trim();
    }
    var container = el.closest('.form-group, .form-item, .field, .ant-form-item, .el-form-item');
    if (container) {
      var labelEl = container.querySelector('label, .label, .ant-form-item-label, .el-form-item__label');
      if (labelEl) return labelEl.textContent.trim();
    }
    return null;
  }

  function getSelector(el) {
    if (!el || el === document.body) return 'body';
    if (el.id) return '#' + el.id;
    if (el.getAttribute('data-testid')) return '[data-testid="' + el.getAttribute('data-testid') + '"]';
    if (el.getAttribute('name') && el.tagName !== 'FORM') return el.tagName.toLowerCase() + '[name="' + el.getAttribute('name') + '"]';

    var parts = [];
    var cur = el;
    var depth = 0;
    while (cur && cur !== document.body && cur !== document.documentElement && depth < 5) {
      var part = cur.tagName.toLowerCase();
      if (cur.id) { parts.unshift('#' + cur.id); break; }
      if (cur.className && typeof cur.className === 'string') {
        var cls = cur.className.trim().split(/\s+/).filter(function(c) { return c.length > 0; })[0];
        if (cls) part += '.' + cls;
      }
      parts.unshift(part);
      cur = cur.parentElement;
      depth++;
    }
    return parts.join(' > ');
  }

  function addOperation(action, targetEl, value) {
    var desc = getElementDesc(targetEl);
    if (!desc) return;
    var sel = getSelector(targetEl);
    var maskedVal = '';
    if (value !== undefined && value !== null && value !== '') {
      if (targetEl && targetEl.tagName === 'INPUT' && targetEl.type === 'password') {
        maskedVal = '******';
      } else {
        maskedVal = maskValue(String(value));
      }
    }

    var op = {
      action: action,
      target: desc,
      selector: sel,
      value: maskedVal,
      url: window.location.href,
      timestamp: new Date().toISOString()
    };
    operationLog.push(op);
    if (operationLog.length > MAX_STEPS) {
      operationLog = operationLog.slice(-MAX_STEPS);
    }

    renumberSteps();
    persistLog();
    if (panelVisible) updateStepsDisplay();
  }

  function renumberSteps() {
    for (var i = 0; i < operationLog.length; i++) {
      operationLog[i].step = i + 1;
    }
  }

  function persistLog() {
    try { sessionStorage.setItem('__tapd_oplog', JSON.stringify(operationLog)); } catch(e) {}
  }

  function loadLog() {
    try {
      var saved = sessionStorage.getItem('__tapd_oplog');
      if (saved) {
        var parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (parsed[parsed.length - 1].url === window.location.href || parsed[parsed.length - 1].action !== '打开页面') {
            operationLog = parsed.slice(-MAX_STEPS);
          }
        }
      }
    } catch(e) {}
  }

  // ========== Event Recording ==========

  document.addEventListener('click', function(e) {
    if (e.target.closest('.tapd-bug-panel, .tapd-floater, .tapd-toast')) return;
    addOperation('点击', e.target);
  }, true);

  document.addEventListener('change', function(e) {
    if (e.target.closest('.tapd-bug-panel, .tapd-floater, .tapd-toast')) return;
    var el = e.target;
    if (['INPUT', 'SELECT', 'TEXTAREA'].indexOf(el.tagName) > -1) {
      addOperation('修改', el, el.value);
    }
  }, true);

  document.addEventListener('input', function(e) {
    if (e.target.closest('.tapd-bug-panel, .tapd-floater, .tapd-toast')) return;
    var el = e.target;
    if (['INPUT', 'TEXTAREA'].indexOf(el.tagName) === -1) return;
    var id = el.id || el.name || el.className;
    if (!id) id = '_anon';
    clearTimeout(inputTimers[id]);
    inputTimers[id] = setTimeout(function() {
      if (el.value && document.contains(el)) {
        addOperation('输入', el, el.value);
      }
    }, 800);
  }, true);

  document.addEventListener('submit', function(e) {
    if (e.target.closest('.tapd-bug-panel, .tapd-floater, .tapd-toast')) return;
    addOperation('提交', e.target);
  }, true);

  function checkUrlChange() {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      addOperation('跳转', document.body, window.location.pathname);
      if (panelVisible) updateUrlField();
    }
  }
  setInterval(checkUrlChange, 1000);

  addOperation('打开页面', document.body, document.title);
  loadLog();

  // ========== Panel UI ==========

  function escapeHtml(str) {
    var d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
  }

  function escapeAttr(str) {
    return (str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function buildPanelHTML() {
    return '' +
    '<div class="tapd-bug-panel" id="tapd-bug-panel">' +
    '  <div class="tapd-panel-header" id="tapd-panel-header">' +
    '    <div class="tapd-panel-drag-handle">' +
    '      <span class="tapd-panel-icon">🐛</span>' +
    '      <span class="tapd-panel-title">提Bug到TAPD</span>' +
    '    </div>' +
    '    <div class="tapd-panel-actions">' +
    '      <button class="tapd-btn-icon tapd-btn-settings" title="设置 (API凭证/项目)">⚙️</button>' +
    '      <button class="tapd-btn-icon tapd-btn-mini" title="最小化">─</button>' +
    '      <button class="tapd-btn-icon tapd-btn-close" title="关闭 (Alt+Q)">✕</button>' +
    '    </div>' +
    '  </div>' +
    '  <div class="tapd-settings-panel" id="tapd-settings-panel" style="display:none">' +
    '    <div class="tapd-settings-inner">' +
    '      <div class="tapd-row">' +
    '        <div class="tapd-form-group tapd-col">' +
    '          <label class="tapd-label">📁 项目 ID <span class="tapd-required">*</span></label>' +
    '          <input type="text" id="tapd-workspace-id" class="tapd-input tapd-input-sm" placeholder="TAPD项目ID，如10158231">' +
    '        </div>' +
    '        <div class="tapd-form-group tapd-col">' +
    '          <label class="tapd-label">👤 创建人 <span class="tapd-badge">自动保存</span></label>' +
    '          <input type="text" id="tapd-reporter" class="tapd-input tapd-input-sm" placeholder="登录用户名">' +
    '        </div>' +
    '      </div>' +
    '      <div class="tapd-settings-actions">' +
    '        <div class="tapd-settings-left">' +
    '          <button class="tapd-btn-link tapd-btn-icon-only" id="tapd-btn-login-tapd" title="登录 TAPD">🌐</button>' +
    '        </div>' +
    '        <div class="tapd-settings-right">' +
    '          <span class="tapd-test-result" id="tapd-test-result"></span>' +
    '          <button class="tapd-btn tapd-btn-secondary tapd-btn-sm" id="tapd-btn-test">🔌 测试连接</button>' +
    '          <button class="tapd-btn tapd-btn-primary tapd-btn-sm" id="tapd-btn-save-settings">💾 保存</button>' +
    '        </div>' +
    '      </div>' +
    '    </div>' +
    '  </div>' +
    '  <div class="tapd-panel-body-wrap" id="tapd-panel-body-wrap">' +
    '    <div class="tapd-body-inner">' +

    '      <div class="tapd-section tapd-section-steps">' +
    '        <div class="tapd-section-header">' +
    '          <span class="tapd-section-title">📝 操作记录</span>' +
    '          <span class="tapd-step-count" id="tapd-step-count">(最近 ' + MAX_STEPS + ' 步)</span>' +
    '          <button class="tapd-btn-link tapd-btn-clear" id="tapd-btn-clear">清空</button>' +
    '        </div>' +
    '        <div class="tapd-steps-list" id="tapd-steps-list"></div>' +
    '      </div>' +

    '      <div class="tapd-section tapd-section-form">' +
    '        <div class="tapd-row">' +
    '          <div class="tapd-form-group tapd-col">' +
    '            <label class="tapd-label">📁 项目 ID <span class="tapd-badge">自动保存</span></label>' +
    '            <input type="text" id="tapd-project-id" class="tapd-input tapd-input-sm" placeholder="TAPD项目ID">' +
    '          </div>' +
    '          <div class="tapd-form-group tapd-col">' +
    '            <label class="tapd-label">📋 需求 ID <span class="tapd-required">*</span> <span class="tapd-badge">自动保存</span></label>' +
    '            <input type="text" id="tapd-requirement-id" class="tapd-input tapd-input-sm" placeholder="需求ID">' +
    '          </div>' +
    '        </div>' +
    '        <div class="tapd-form-group">' +
    '          <label class="tapd-label">🔗 当前页面 <span class="tapd-badge">自动</span></label>' +
    '          <input type="text" id="tapd-url" class="tapd-input tapd-input-sm" readonly>' +
    '        </div>' +
    '        <div class="tapd-section tapd-section-media" id="tapd-media-section">' +
    '          <div class="tapd-media-header">' +
    '            <span class="tapd-section-title">📸 截图与录屏</span>' +
    '            <span class="tapd-media-hint">可选</span>' +
    '          </div>' +
    '          <div class="tapd-media-toolbar">' +
    '            <button class="tapd-btn tapd-btn-secondary tapd-btn-sm" id="tapd-btn-screenshot">📸 截取页面</button>' +
    '            <button class="tapd-btn tapd-btn-secondary tapd-btn-sm" id="tapd-btn-record-start">🎬 开始录屏</button>' +
    '          </div>' +
    '          <div class="tapd-screenshot-preview" id="tapd-screenshot-preview" style="display:none">' +
    '            <img id="tapd-screenshot-img" src="" alt="截图预览" class="tapd-screenshot-img">' +
    '            <button class="tapd-btn-link tapd-btn-remove" id="tapd-btn-remove-screenshot">✕ 删除截图</button>' +
    '          </div>' +
    '          <div class="tapd-recording-status" id="tapd-recording-status" style="display:none">' +
    '            <div class="tapd-rec-indicator">' +
    '              <span class="tapd-rec-dot"></span>' +
    '              <span class="tapd-rec-timer" id="tapd-rec-timer">00:00</span>' +
    '            </div>' +
    '            <button class="tapd-btn tapd-btn-warn tapd-btn-sm" id="tapd-btn-record-stop">⏹ 停止录制并下载</button>' +
    '          </div>' +
    '        </div>' +
    '        <div class="tapd-form-group">' +
    '          <label class="tapd-label">🏷️ Bug 标题 <span class="tapd-required">*</span></label>' +
    '          <input type="text" id="tapd-title" class="tapd-input" placeholder="简要描述Bug现象">' +
    '        </div>' +
    '        <div class="tapd-row">' +
    '          <div class="tapd-form-group tapd-col" id="tapd-severity-group">' +
    '            <label class="tapd-label">⚠️ 严重程度</label>' +
    '            <select id="tapd-severity" class="tapd-input">' +
    '              <option value="">-- 请选择 --</option>' +
    '              <option value="致命">致命</option>' +
    '              <option value="严重">严重</option>' +
    '              <option value="一般" selected>一般</option>' +
    '              <option value="轻微">轻微</option>' +
    '              <option value="建议">建议</option>' +
    '            </select>' +
    '          </div>' +
    '          <div class="tapd-form-group tapd-col" id="tapd-priority-group">' +
    '            <label class="tapd-label">🔺 优先级</label>' +
    '            <select id="tapd-priority" class="tapd-input">' +
    '              <option value="">-- 请选择 --</option>' +
    '              <option value="高">高</option>' +
    '              <option value="中" selected>中</option>' +
    '              <option value="低">低</option>' +
    '            </select>' +
    '          </div>' +
    '        </div>' +
    '        <div class="tapd-row">' +
    '          <div class="tapd-form-group tapd-col">' +
    '            <label class="tapd-label">📂 模块</label>' +
    '            <select id="tapd-module" class="tapd-input"></select>' +
    '          </div>' +
    '          <div class="tapd-form-group tapd-col">' +
    '            <label class="tapd-label">👤 处理人</label>' +
    '            <input type="text" id="tapd-owner" class="tapd-input" placeholder="指定处理人">' +
    '          </div>' +
    '        </div>' +
    '        <div class="tapd-form-group">' +
    '          <label class="tapd-label">📋 复现步骤 <span class="tapd-badge">自动填充</span></label>' +
    '          <textarea id="tapd-steps-input" class="tapd-input" rows="5" placeholder="从上方操作记录自动填充..."></textarea>' +
    '        </div>' +
    '        <div class="tapd-row">' +
    '          <div class="tapd-form-group tapd-col">' +
    '            <label class="tapd-label">✅ 预期结果</label>' +
    '            <textarea id="tapd-expected" class="tapd-input" rows="2" placeholder="应该发生什么"></textarea>' +
    '          </div>' +
    '          <div class="tapd-form-group tapd-col">' +
    '            <label class="tapd-label">❌ 实际结果</label>' +
    '            <textarea id="tapd-actual" class="tapd-input" rows="2" placeholder="实际发生了什么"></textarea>' +
    '          </div>' +
    '        </div>' +
    '        <div class="tapd-form-group">' +
    '          <label class="tapd-label">💬 补充说明</label>' +
    '          <textarea id="tapd-description" class="tapd-input" rows="2" placeholder="其他补充信息..."></textarea>' +
    '        </div>' +
    '        <div class="tapd-row tapd-check-row">' +
    '          <label class="tapd-check-label"><input type="checkbox" id="tapd-include-url" checked> 包含页面URL</label>' +
    '          <label class="tapd-check-label"><input type="checkbox" id="tapd-include-console"> 附带控制台日志</label>' +
    '        </div>' +
    '      </div>' +

    '    </div>' +
    '  </div>' +
    '  <div class="tapd-panel-footer">' +
    '    <div class="tapd-footer-item">' +
    '      <label class="tapd-step-config">' +
    '        记录步数' +
    '        <select id="tapd-max-steps" class="tapd-select-sm">' +
    '          <option value="5">5</option>' +
    '          <option value="10" selected>10</option>' +
    '          <option value="20">20</option>' +
    '        </select>' +
    '      </label>' +
    '    </div>' +
    '    <div class="tapd-footer-item">' +
    '      <button class="tapd-btn tapd-btn-secondary tapd-btn-full" id="tapd-btn-copy">📋 复制到剪贴板</button>' +
    '    </div>' +
    '    <div class="tapd-footer-item">' +
    '      <button class="tapd-btn tapd-btn-primary tapd-btn-full" id="tapd-btn-submit">🚀 提交到 TAPD</button>' +
    '    </div>' +
    '  </div>' +
    '  <div class="tapd-resize-handle" id="tapd-resize-handle"></div>' +
    '</div>';
  }

  function createPanel() {
    if (panelEl) return;
    var wrapper = document.createElement('div');
    wrapper.className = 'tapd-panel-wrapper';
    wrapper.innerHTML = buildPanelHTML();
    panelEl = wrapper.firstElementChild;
    document.body.appendChild(panelEl);

    bindPanel();
    updateUrlField();
    updateTitleField();
    updateStepsDisplay();
    loadModules();
    loadSettings();
    panelVisible = true;

    // Default values
    var expectedEl = document.getElementById('tapd-expected');
    if (expectedEl && !expectedEl.value.trim()) expectedEl.value = '操作正常';

    // Restore screenshot and pasted images from memory
    setTimeout(function() {
      restoreScreenshots();
    }, 100);

    // Auto-save project ID and reporter on change
    var pidEl = document.getElementById('tapd-project-id');
    if (pidEl) pidEl.addEventListener('change', saveProjectId);
    if (pidEl) pidEl.addEventListener('blur', saveProjectId);

    var ridEl = document.getElementById('tapd-requirement-id');
    if (ridEl) ridEl.addEventListener('change', saveRequirementId);
    if (ridEl) ridEl.addEventListener('blur', saveRequirementId);

    // Focus title field
    setTimeout(function() {
      var titleEl = document.getElementById('tapd-title');
      if (titleEl) titleEl.focus();
    }, 200);
  }

  function removePanel() {
    if (panelEl) { panelEl.remove(); panelEl = null; }
    panelVisible = false;
    // Keep screenshot/pasted data in memory across open/close cycles
  }

  function togglePanel() {
    panelVisible ? removePanel() : createPanel();
  }

  function updateUrlField() {
    var f = document.getElementById('tapd-url');
    if (f) f.value = window.location.href;
  }

  function updateTitleField() {
    var f = document.getElementById('tapd-title');
    if (!f) return;
    if (f.value.trim()) return;
    var raw = (document.title || '未命名页面').trim().replace(/\s+/g, ' ').substring(0, 100);
    if (!raw) raw = '未命名页面';
    f.value = '【' + raw + '】';
    f.select();
    console.log('[TAPD] 标题栏已自动填入：', f.value);
  }

  function updateStepsDisplay() {
    var list = document.getElementById('tapd-steps-list');
    if (!list) return;
    if (operationLog.length === 0) {
      list.innerHTML = '<div class="tapd-steps-empty">📭 暂无操作记录，请操作页面后将自动捕获</div>';
    } else {
      var html = '';
      for (var i = operationLog.length - 1; i >= 0; i--) {
        var op = operationLog[i];
        var actionClass = 'tapd-action-' + op.action;
        var valHtml = op.value ? '<span class="tapd-step-val">→ "' + escapeHtml(op.value) + '"</span>' : '';
        html += '' +
        '<div class="tapd-step-item">' +
        '  <span class="tapd-step-num">' + (i + 1) + '</span>' +
        '  <span class="tapd-step-action ' + actionClass + '">' + op.action + '</span>' +
        '  <span class="tapd-step-target">' + escapeHtml(op.target) + '</span>' +
        valHtml +
        '</div>';
      }
      list.innerHTML = html;
    }
    updateStepsInput();
  }

  function updateStepsInput() {
    var ta = document.getElementById('tapd-steps-input');
    if (!ta || operationLog.length === 0) return;
    var lines = [];
    for (var i = 0; i < operationLog.length; i++) {
      var op = operationLog[i];
      var line = (i + 1) + '. ' + op.action + '：「' + op.target + '」';
      if (op.value) line += ' → "' + op.value + '"';
      lines.push(line);
    }
    lines.push('');
    lines.push('== 此处发现Bug，预期结果 vs 实际结果如下 ==');
    ta.value = lines.join('\n');
  }

  function loadModules() {
    var sel = document.getElementById('tapd-module');
    if (!sel) return;
    sel.innerHTML = '<option value="">-- 请选择 --</option>';
  }

  function clearModuleOptions() {
    var sel = document.getElementById('tapd-module');
    if (!sel) return;
    // Only clear if it's a select (not text input)
    if (sel.tagName === 'SELECT') {
      sel.innerHTML = '<option value="">-- 加载中... --</option>';
    }
  }

  function loadSettings() {
    if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) return;
    chrome.storage.local.get(['tapd_workspace_id', 'tapd_reporter', 'tapd_requirement_id'], function(cfg) {
      setVal('tapd-workspace-id', cfg.tapd_workspace_id || '');
      setVal('tapd-project-id', cfg.tapd_workspace_id || '');
      _lastProjectId = cfg.tapd_workspace_id || '';
      if (cfg.tapd_reporter) setVal('tapd-reporter', cfg.tapd_reporter);
      if (cfg.tapd_requirement_id) setVal('tapd-requirement-id', cfg.tapd_requirement_id);
      if (cfg.tapd_workspace_id) {
        loadCachedProjectData(cfg.tapd_workspace_id);
      }
    });
  }

  function saveSettings() {
    if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
      showToast('请在Chrome扩展环境下使用', 'warn');
      return;
    }
    var workspaceId = getVal('tapd-workspace-id');
    var reporter = getVal('tapd-reporter');

    chrome.storage.local.set({
      tapd_workspace_id: workspaceId,
      tapd_reporter: reporter
    }, function() {
      document.getElementById('tapd-project-id').value = workspaceId || '';
      document.getElementById('tapd-settings-panel').style.display = 'none';
      showToast('设置已保存！');
    });
  }

  var _lastProjectId = '';

  function resetProjectUI() {
    var severityEl = document.getElementById('tapd-severity');
    if (severityEl) {
      severityEl.innerHTML = '<option value="">-- 请选择 --</option><option value="致命">致命</option><option value="严重">严重</option><option value="一般" selected>一般</option><option value="轻微">轻微</option><option value="建议">建议</option>';
    }
    var priorityEl = document.getElementById('tapd-priority');
    if (priorityEl) {
      priorityEl.innerHTML = '<option value="">-- 请选择 --</option><option value="高">高</option><option value="中" selected>中</option><option value="低">低</option>';
    }
    var moduleEl = document.getElementById('tapd-module');
    if (moduleEl) {
      moduleEl.innerHTML = '<option value="">-- 请选择 --</option>';
    }
    var ownerEl = document.getElementById('tapd-owner');
    if (ownerEl && ownerEl.tagName === 'SELECT') {
      var input = document.createElement('input');
      input.type = 'text';
      input.id = 'tapd-owner';
      input.className = 'tapd-input';
      input.placeholder = '处理人';
      ownerEl.parentNode.replaceChild(input, ownerEl);
    }
    var container = document.getElementById('tapd-custom-fields');
    if (container) container.innerHTML = '';
  }

  function saveProjectId() {
    var pid = document.getElementById('tapd-project-id').value.trim();
    if (pid && pid !== _lastProjectId) {
      _lastProjectId = pid;
      resetProjectUI();
      document.getElementById('tapd-workspace-id').value = pid;
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ tapd_workspace_id: pid });
      }
      loadCachedProjectData(pid);
    }
    saveRequirementId();
  }

  function saveRequirementId() {
    var rid = document.getElementById('tapd-requirement-id').value.trim();
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ tapd_requirement_id: rid });
    }
  }

  function toggleSettings() {
    var panel = document.getElementById('tapd-settings-panel');
    if (!panel) return;
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
  }

  function openTapdSettings() {
    window.open('https://www.tapd.cn/help/show#1120003271001000093', '_blank');
  }

  function openTapdLogin() {
    showToast('请在打开的页面中登录 TAPD，然后重新测试连接');
    window.open('https://www.tapd.cn', '_blank');
  }

  function testConnection() {
    var resultEl = document.getElementById('tapd-test-result');
    var btn = document.getElementById('tapd-btn-test');
    if (!btn) return;

    btn.disabled = true;
    btn.textContent = '⏳ 测试中...';
    if (resultEl) { resultEl.textContent = ''; resultEl.className = 'tapd-test-result'; }

    // Always sync main form project ID to settings, detect changes, reset UI
    var pid = getVal('tapd-project-id');
    if (pid) {
      setVal('tapd-workspace-id', pid);
      if (pid !== _lastProjectId) {
        _lastProjectId = pid;
        resetProjectUI();
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          chrome.storage.local.set({ tapd_workspace_id: pid });
          chrome.storage.local.remove('tapd_project_' + pid);
        }
      }
    }
    resetProjectUI();

    var testData = {
      workspace_id: pid || getVal('tapd-workspace-id')
    };

    if (!testData.workspace_id) {
      if (resultEl) { resultEl.textContent = '✗ 请填写项目ID'; resultEl.className = 'tapd-test-result tapd-test-fail'; }
      btn.disabled = false;
      btn.textContent = '🔌 测试连接';
      return;
    }

    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      console.log('[TAPD Bug Reporter] 发送测试连接请求...', testData.workspace_id);
      chrome.runtime.sendMessage({ action: 'testAuth', data: testData }, function(resp) {
        console.log('[TAPD Bug Reporter] 测试连接响应:', JSON.stringify(resp).substring(0, 500));
        btn.disabled = false;
      btn.textContent = '🔌 测试连接';
        if (resp && resp.success) {
          var msg = resp.message;
          if (resp.projectData) {
            var fieldCount = resp.projectData.fields ? Object.keys(resp.projectData.fields).length : 0;
            var templateCount = (resp.projectData.template || []).length;
            var userCount = (resp.projectData.users || []).length;
            msg += '，已加载 ' + templateCount + ' 个模板字段，' + fieldCount + ' 个字段选项' + (userCount ? '，' + userCount + ' 位成员' : '');
            console.log('[TAPD] projectData fields debug:', resp.projectData._debug_fields);
            console.log('[TAPD] projectData fields keys:', resp.projectData.fields ? Object.keys(resp.projectData.fields) : 'none');
            applyProjectFields(resp.projectData);
            cacheProjectData(testData.workspace_id, resp.projectData);
          }
          if (resultEl) { resultEl.textContent = '✓ ' + msg; resultEl.className = 'tapd-test-result tapd-test-ok'; }
          showToast('连接成功！' + msg);
        } else {
          var msg = resp ? (resp.error + (resp.debug ? ' | URL: ' + resp.debug : '')) : '连接失败';
          if (resultEl) { resultEl.textContent = '✗ ' + msg; resultEl.className = 'tapd-test-result tapd-test-fail'; }
          showToast('连接失败: ' + msg, 'error');
        }
      });
    } else {
      btn.disabled = false;
      btn.textContent = '🔌 测试连接';
      showToast('请在Chrome扩展环境下使用', 'warn');
    }
  }

  function applyProjectFields(pd) {
    if (!pd) return;

    var templateFields = pd.template || [];
    var fieldSet = {};
    for (var i = 0; i < templateFields.length; i++) {
      fieldSet[(templateFields[i].name || '').toLowerCase()] = templateFields[i];
    }

    // Populate field options from API (independent of template)
    console.log('[TAPD] applyProjectFields - pd.fields keys:', pd.fields ? Object.keys(pd.fields) : 'none');
    console.log('[TAPD] applyProjectFields - pd.fields preview:', JSON.stringify(pd.fields).substring(0, 500));
    if (pd.fields && Object.keys(pd.fields).length > 0) {
      populateSelectFromField('tapd-severity', pd.fields, 'severity');
      populateSelectFromField('tapd-priority', pd.fields, 'priority_label');
      populateModulesFromField(pd.fields);
    }
    // Ensure defaults are present if API didn't fill
    ensureDefaultOptions('tapd-severity', ['致命','严重','一般','轻微','建议']);
    ensureDefaultOptions('tapd-priority', ['高','中','低']);

    // 设置默认值（仅当选项存在时）
    if (document.querySelector('#tapd-severity option[value=\'一般\']')) setVal('tapd-severity', '一般');
    if (document.querySelector('#tapd-priority option[value=\'中\']')) setVal('tapd-priority', '中');

    // Show/hide standard fields per template
    showFieldIfInTemplate('tapd-severity-group', fieldSet, 'severity');
    showFieldIfInTemplate('tapd-priority-group', fieldSet, 'priority_label', 'priority');

    // Module: API didn't provide options? Convert to text input
    if (!hasPopulatedOptions('tapd-module')) {
      setModuleAsText();
    }

    // Render custom fields from template (with Chinese labels from fieldData)
    if (templateFields.length > 0) {
      renderCustomFields(templateFields, pd.fields);
      applyTemplateRequired(fieldSet);
    }

    if (pd.users && pd.users.length > 0) {
      replaceInputWithSelect('tapd-owner', pd.users);
    }
  }

  function ensureDefaultOptions(selectId, defaults) {
    var sel = document.getElementById(selectId);
    if (!sel) return;
    // If already populated (more than 1 option with value), skip
    var hasCustom = false;
    for (var i = 1; i < sel.options.length; i++) {
      if (sel.options[i].value) { hasCustom = true; break; }
    }
    if (hasCustom) return;
    sel.innerHTML = '<option value="">-- 请选择 --</option>';
    for (var i = 0; i < defaults.length; i++) {
      var o = document.createElement('option');
      o.value = defaults[i]; o.textContent = defaults[i]; sel.appendChild(o);
    }
  }

  function showFieldIfInTemplate(groupId, fieldSet, name1, name2) {
    var el = document.getElementById(groupId);
    if (!el) return;
    if (fieldSet[name1] || (name2 && fieldSet[name2])) {
      el.style.display = '';
    } else {
      el.style.display = 'none';
    }
  }

  function hasPopulatedOptions(selectId) {
    var sel = document.getElementById(selectId);
    if (!sel || sel.tagName !== 'SELECT') return false;
    for (var i = 1; i < sel.options.length; i++) {
      if (sel.options[i].value) return true;
    }
    return false;
  }

  function setModuleAsText() {
    var sel = document.getElementById('tapd-module');
    if (!sel || sel.tagName !== 'SELECT') return;
    var input = document.createElement('input');
    input.type = 'text';
    input.id = 'tapd-module';
    input.className = 'tapd-input';
    input.placeholder = '模块名称';
    sel.parentNode.replaceChild(input, sel);
  }

  function applyTemplateRequired(fieldSet) {
    markRequired('tapd-title', fieldSet, 'title');
    markRequired('tapd-severity', fieldSet, 'severity');
    markRequired('tapd-priority', fieldSet, 'priority_label', 'priority');
    markRequired('tapd-module', fieldSet, 'module');
    markRequired('tapd-owner', fieldSet, 'current_owner');
  }

  function markRequired(fieldId, fieldSet, name1, name2) {
    var el = document.getElementById(fieldId);
    if (!el) return;
    var f = fieldSet[name1] || (name2 ? fieldSet[name2] : null);
    if (f && f.required) {
      // Find the parent label and add required indicator
      var group = el.closest('.tapd-form-group');
      if (!group) return;
      var label = group.querySelector('.tapd-label');
      if (!label) return;
      if (label.querySelector('.tapd-required')) return;
      var span = document.createElement('span');
      span.className = 'tapd-required';
      span.textContent = ' *';
      label.appendChild(span);
    }
  }

  function getFieldLabel(fieldData, fieldName) {
    if (!fieldData) return fieldName;
    var f = fieldData[fieldName];
    if (!f) {
      for (var k in fieldData) {
        if (k.toLowerCase() === fieldName.toLowerCase()) { f = fieldData[k]; break; }
      }
    }
    return f && f.label ? f.label : fieldName;
  }

  function renderCustomFields(templateFields, fieldData) {
    var oldContainer = document.getElementById('tapd-custom-fields');
    if (oldContainer) oldContainer.innerHTML = '';

    var container = document.getElementById('tapd-custom-fields');
    if (!container) {
      var formSection = document.querySelector('.tapd-section-form');
      if (!formSection) return;
      container = document.createElement('div');
      container.id = 'tapd-custom-fields';
      container.className = 'tapd-custom-fields';
      var descGroup = document.getElementById('tapd-description');
      if (descGroup) {
        descGroup.parentNode.insertBefore(container, descGroup.parentNode.lastElementChild);
      } else {
        formSection.appendChild(container);
      }
    }

    var standardNames = ['title', 'severity', 'priority', 'priority_label', 'module', 'current_owner', 'description', 'workspace_id', 'id', 'status', 'reporter', 'created', 'modified', 'lastmodify', 'closed', 'resolved', 'testtype', 'testphase'];

    var hasVisibleFields = false;

    for (var i = 0; i < templateFields.length; i++) {
      var f = templateFields[i];
      var name = f.name || '';
      if (!name || standardNames.indexOf(name.toLowerCase()) > -1) continue;

      hasVisibleFields = true;
      var fieldLabel = getFieldLabel(fieldData, name);

      var fieldMeta = null;
      if (fieldData) {
        fieldMeta = fieldData[name];
        if (!fieldMeta) {
          for (var k in fieldData) {
            if (k.toLowerCase() === name.toLowerCase()) { fieldMeta = fieldData[k]; break; }
          }
        }
      }

      var div = document.createElement('div');
      div.className = 'tapd-form-group';

      var label = document.createElement('label');
      label.className = 'tapd-label';
      label.textContent = fieldLabel;
      if (f.required) label.innerHTML += ' <span class="tapd-required">*</span>';
      div.appendChild(label);

      var fieldOptions = fieldMeta && fieldMeta.options;
      var hasOptions = fieldOptions && typeof fieldOptions === 'object' && Object.keys(fieldOptions).length > 0;

      if (hasOptions) {
        var sel = document.createElement('select');
        sel.className = 'tapd-input';
        sel.id = 'tapd-custom-' + name;

        var emptyOpt = document.createElement('option');
        emptyOpt.value = '';
        emptyOpt.textContent = '-- 请选择 --';
        sel.appendChild(emptyOpt);

        if (!Array.isArray(fieldOptions)) {
          for (var optKey in fieldOptions) {
            var opt = document.createElement('option');
            opt.value = optKey;
            opt.textContent = fieldOptions[optKey];
            if (f.value === optKey) opt.selected = true;
            sel.appendChild(opt);
          }
        } else {
          fieldOptions.forEach(function(item) {
            var opt = document.createElement('option');
            if (typeof item === 'string') { opt.value = item; opt.textContent = item; }
            else { opt.value = item.value || item.id || ''; opt.textContent = item.label || item.name || item.value || ''; }
            if (f.value === opt.value) opt.selected = true;
            if (opt.value) sel.appendChild(opt);
          });
        }
        div.appendChild(sel);
      } else {
        var input = document.createElement('input');
        input.type = 'text';
        input.className = 'tapd-input';
        input.id = 'tapd-custom-' + name;
        input.placeholder = f.required ? '必填' : '';
        if (name === 'version_report' && !f.value) input.value = '1.0';
        else if (f.value) input.value = f.value;
        div.appendChild(input);
      }

      container.appendChild(div);
    }

    if (!hasVisibleFields && oldContainer) {
      oldContainer.style.display = 'none';
    } else {
      container.style.display = '';
    }
  }

  function populateSelectFromField(selectId, fieldData, fieldName) {
    var sel = document.getElementById(selectId);
    if (!sel) return;

    // The API returns {severity: {name, label, options: {...}}, ...}
    var fieldObj = fieldData[fieldName];
    if (!fieldObj) {
      // Try case-insensitive
      for (var k in fieldData) {
        if (k.toLowerCase() === fieldName.toLowerCase()) {
          fieldObj = fieldData[k]; break;
        }
      }
    }
    if (!fieldObj) return;

    var options = fieldObj.options || fieldObj;
    if (!options || typeof options !== 'object') return;

    sel.innerHTML = '<option value="">-- 请选择 --</option>';

    if (!Array.isArray(options)) {
      for (var k in options) {
        var v = options[k];
        var o = document.createElement('option');
        o.value = k;
        o.textContent = v;
        sel.appendChild(o);
      }
    } else {
      options.forEach(function(item) {
        var o = document.createElement('option');
        if (typeof item === 'string') { o.value = item; o.textContent = item; }
        else { o.value = item.value || item.id || ''; o.textContent = item.label || item.name || item.value || ''; }
        if (o.value) sel.appendChild(o);
      });
    }
  }

  function populateModulesFromField(fieldData) {
    var sel = document.getElementById('tapd-module');
    if (!sel) return;

    // API returns data.module = {name, label, options: {"模块1":"模块1",...}}
    var moduleObj = fieldData.module || fieldData['module'];
    if (!moduleObj) return;

    var modules = moduleObj.options || moduleObj;
    if (!modules || typeof modules !== 'object') return;

    console.log('[TAPD] 模块选项:', Object.keys(modules).join(', '));
    sel.innerHTML = '<option value="">-- 请选择 --</option>';

    if (!Array.isArray(modules)) {
      for (var k in modules) {
        var o = document.createElement('option');
        o.value = k;
        o.textContent = modules[k];
        sel.appendChild(o);
      }
    } else {
      modules.forEach(function(m) {
        var o = document.createElement('option');
        if (typeof m === 'string') { o.value = m; o.textContent = m; }
        else { o.value = m.value || ''; o.textContent = m.label || m.name || ''; }
        if (o.value) sel.appendChild(o);
      });
    }
  }

  function replaceInputWithSelect(inputId, users) {
    var oldEl = document.getElementById(inputId);
    if (!oldEl) return;

    var sel = document.createElement('select');
    sel.id = inputId;
    sel.className = 'tapd-input';
    sel.innerHTML = '<option value="">-- 请选择处理人 --</option>';

    users.forEach(function(u) {
      var o = document.createElement('option');
      o.value = u.user;
      o.textContent = u.name || u.user;
      sel.appendChild(o);
    });

    oldEl.parentNode.replaceChild(sel, oldEl);
  }

  function cacheProjectData(wsId, pd) {
    if (!wsId || !pd) return;
    if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) return;
    var key = 'tapd_project_' + wsId;
    chrome.storage.local.set({ [key]: pd });
  }

  function loadCachedProjectData(wsId) {
    if (!wsId) return;
    if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) return;
    var key = 'tapd_project_' + wsId;
    chrome.storage.local.get([key], function(res) {
      if (res[key]) {
        applyProjectFields(res[key]);
      }
    });
  }

  function setVal(id, val) {
    var el = document.getElementById(id);
    if (el) el.value = val || '';
  }

  function getVal(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  function buildBugData() {
    var includeUrl = document.getElementById('tapd-include-url').checked;
    var steps = document.getElementById('tapd-steps-input').value.trim();
    var expected = document.getElementById('tapd-expected').value.trim();
    var actual = document.getElementById('tapd-actual').value.trim();
    var extra = document.getElementById('tapd-description').value.trim();

    var parts = [];

    // HTML wrapper
    parts.push('<div style="font-family:-apple-system,BlinkMacSystemFont,\'Microsoft YaHei\',sans-serif;font-size:14px;line-height:1.6;color:#333;">');

    // Section: 基本信息
    parts.push('<table style="width:100%;border-collapse:collapse;margin-bottom:12px;border:1px solid #e8e8e8;border-radius:4px;overflow:hidden;">');
    if (includeUrl) {
      var url = document.getElementById('tapd-url').value;
      parts.push('<tr><td style="padding:6px 10px;background:#f7f8fa;font-weight:600;white-space:nowrap;width:80px;border:1px solid #e8e8e8;">📎 测试页面</td><td style="padding:6px 10px;border:1px solid #e8e8e8;"><a href="' + escapeAttr(url) + '" style="color:#1890ff;word-break:break-all;">' + escapeHtml(url) + '</a></td></tr>');
    }
    parts.push('<tr><td style="padding:6px 10px;background:#f7f8fa;font-weight:600;border:1px solid #e8e8e8;">💻 测试环境</td><td style="padding:6px 10px;border:1px solid #e8e8e8;">浏览器功能测试</td></tr>');
    parts.push('</table>');

    // Section: 复现步骤
    if (steps) {
      parts.push('<h4 style="margin:12px 0 4px;color:#1a1a1a;">📝 操作步骤</h4>');
      var stepLines = steps.split('\n').filter(function(l) { return l.trim(); });
      parts.push('<ol style="margin:4px 0 12px;padding-left:24px;">');
      stepLines.forEach(function(line) {
        parts.push('<li style="margin:2px 0;">' + escapeHtml(line) + '</li>');
      });
      parts.push('</ol>');
    }

    // Section: 预期结果
    parts.push('<h4 style="margin:12px 0 4px;color:#52c41a;">✅ 预期结果</h4>');
    parts.push('<div style="background:#f6ffed;border:1px solid #b7eb8f;border-radius:4px;padding:8px 12px;margin:4px 0 12px;">' + (expected ? escapeHtml(expected) : '未填写') + '</div>');

    // Section: 实际结果
    parts.push('<h4 style="margin:12px 0 4px;color:#f5222d;">❌ 实际结果</h4>');
    parts.push('<div style="background:#fff2f0;border:1px solid #ffccc7;border-radius:4px;padding:8px 12px;margin:4px 0 12px;">' + (actual ? escapeHtml(actual) : '未填写') + '</div>');

    // Section: 预期结果
    if (screenshotDataUrl) {
      parts.push('<h4 style="margin:12px 0 4px;color:#1a1a1a;">📸 截图</h4>');
      parts.push('<img src="' + escapeAttr(screenshotDataUrl) + '" style="max-width:100%;border:1px solid #e8e8e8;border-radius:4px;margin:4px 0 12px;" />');
    }

    // Section: 粘贴的图片
    var validImages = pastedImages.filter(function(img) { return img !== null; });
    if (validImages.length > 0) {
      parts.push('<h4 style="margin:12px 0 4px;color:#1a1a1a;">🖼️ 附件截图 (' + validImages.length + '张)</h4>');
      validImages.forEach(function(img) {
        parts.push('<img src="' + escapeAttr(img) + '" style="max-width:100%;border:1px solid #e8e8e8;border-radius:4px;margin:4px 0;" />');
      });
    }

    // Section: 补充说明
    if (extra) {
      parts.push('<h4 style="margin:12px 0 4px;color:#1a1a1a;">📌 补充说明</h4>');
      parts.push('<div style="background:#f7f8fa;border:1px solid #d9d9d9;border-radius:4px;padding:8px 12px;margin:4px 0 12px;">' + escapeHtml(extra) + '</div>');
    }

    // Close wrapper
    parts.push('</div>');

    var description = parts.join('\n');

    var reqId = document.getElementById('tapd-requirement-id').value.trim();

    return {
      workspace_id: document.getElementById('tapd-project-id').value.trim(),
      reporter: document.getElementById('tapd-reporter').value.trim(),
      title: document.getElementById('tapd-title').value.trim(),
      severity: document.getElementById('tapd-severity').value,
      priority_label: document.getElementById('tapd-priority').value,
      module: document.getElementById('tapd-module').value,
      current_owner: document.getElementById('tapd-owner').value.trim(),
      description: description,
      testtype: '功能测试',
      testphase: '功能测试阶段',
      requirement_id: reqId || undefined,
      custom_fields: collectCustomFields()
    };
  }

  function collectCustomFields() {
    var container = document.getElementById('tapd-custom-fields');
    if (!container) return {};
    var fields = {};
    var els = container.querySelectorAll('[id^="tapd-custom-"]');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      var name = el.id.replace('tapd-custom-', '');
      var val = (el.value || '').trim();
      if (val) fields[name] = val;
    }
    return fields;
  }

  function showImagePreview(dataUrl) {
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.75);z-index:1000001;display:flex;align-items:center;justify-content:center;cursor:pointer;';
    overlay.addEventListener('click', function() { overlay.remove(); });

    var closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = 'position:absolute;top:16px;right:16px;width:36px;height:36px;border:none;border-radius:50%;background:rgba(0,0,0,0.5);color:#fff;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;';
    closeBtn.addEventListener('click', function() { overlay.remove(); });
    overlay.appendChild(closeBtn);

    var container = document.createElement('div');
    container.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:12px;';
    container.addEventListener('click', function(e) { e.stopPropagation(); });

    var img = document.createElement('img');
    img.src = dataUrl;
    img.style.cssText = 'max-width:90vw;max-height:85vh;border-radius:8px;box-shadow:0 8px 32px rgba(0,0,0,0.5);object-fit:contain;';

    container.appendChild(img);
    overlay.appendChild(container);
    document.body.appendChild(overlay);
  }

  function clearMediaAttachments() {
    screenshotDataUrl = '';
    pastedImages = [];
    recordedChunks = [];
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      clearInterval(recordingTimer);
    }
    var preview = document.getElementById('tapd-screenshot-preview');
    if (preview) preview.style.display = 'none';
    var img = document.getElementById('tapd-screenshot-img');
    if (img) img.src = '';
    var recStatus = document.getElementById('tapd-recording-status');
    if (recStatus) recStatus.style.display = 'none';
    var recBtn = document.getElementById('tapd-btn-record-start');
    if (recBtn) recBtn.style.display = '';
    var pasteContainer = document.getElementById('tapd-pasted-previews');
    if (pasteContainer) pasteContainer.innerHTML = '';
  }

  function showToast(msg, type) {
    var old = document.querySelector('.tapd-toast');
    if (old) old.remove();
    var toast = document.createElement('div');
    toast.className = 'tapd-toast tapd-toast-' + (type || 'success');
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(function() { toast.classList.add('tapd-toast-hide'); }, 2500);
    setTimeout(function() { if (toast.parentNode) toast.remove(); }, 2800);
  }

  function bindPanel() {
    if (!panelEl) return;

    panelEl.querySelector('.tapd-btn-close').addEventListener('click', removePanel);

    panelEl.querySelector('.tapd-btn-mini').addEventListener('click', function() {
      var body = document.getElementById('tapd-panel-body-wrap');
      var footer = panelEl.querySelector('.tapd-panel-footer');
      var hidden = body.style.display === 'none';
      body.style.display = hidden ? '' : 'none';
      footer.style.display = hidden ? '' : 'none';
      this.textContent = hidden ? '─' : '□';
    });

    // Drag
    (function() {
      var header = document.getElementById('tapd-panel-header');
      var dragging = false, sx, sy, ix, iy;
      header.addEventListener('mousedown', function(e) {
        if (e.target.tagName === 'BUTTON') return;
        dragging = true;
        sx = e.clientX; sy = e.clientY;
        var r = panelEl.getBoundingClientRect();
        ix = r.left; iy = r.top;
        panelEl.style.transition = 'none';
        panelEl.style.right = 'auto';
        panelEl.style.top = iy + 'px';
        panelEl.style.left = ix + 'px';
      });
      document.addEventListener('mousemove', function(e) {
        if (!dragging) return;
        panelEl.style.left = (ix + e.clientX - sx) + 'px';
        panelEl.style.top = (iy + e.clientY - sy) + 'px';
      });
      document.addEventListener('mouseup', function() {
        if (dragging) { dragging = false; panelEl.style.transition = ''; }
      });
    })();

    document.getElementById('tapd-btn-clear').addEventListener('click', function() {
      operationLog = [];
      updateStepsDisplay();
      document.getElementById('tapd-steps-input').value = '';
      try { sessionStorage.removeItem('__tapd_oplog'); } catch(e) {}
    });

    document.getElementById('tapd-max-steps').addEventListener('change', function() {
      MAX_STEPS = parseInt(this.value);
      document.getElementById('tapd-step-count').textContent = '(最近 ' + MAX_STEPS + ' 步)';
      operationLog = operationLog.slice(-MAX_STEPS);
      renumberSteps();
      updateStepsDisplay();
    });

    document.getElementById('tapd-btn-copy').addEventListener('click', function() {
      var data = buildBugData();
      if (!data.title) { showToast('请先输入Bug标题', 'warn'); return; }
      var html = '<h3>【Bug 标题】' + escapeHtml(data.title) + '</h3>\n' + data.description;
      var text = data.title + '\n\n' + stripHtml(data.description);
      copyRichText(html, text, function() {
        showToast('已复制！可直接粘贴到 TAPD');
      });
    });

    document.getElementById('tapd-btn-submit').addEventListener('click', function() {
      var btn = this;
      if (btn.disabled) return;
      var data = buildBugData();
      if (!data.title) { showToast('请先输入Bug标题', 'warn'); return; }
      if (!data.requirement_id) { showToast('请填写需求ID', 'warn'); return; }

      btn.disabled = true;
      btn.textContent = '提交中...';

      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ action: 'submitBug', data: data }, function(resp) {
          if (resp && resp.success) {
            var bugId = resp.data && resp.data.Bug ? resp.data.Bug.id : '';
            var linkStatus = resp.link;
            if (linkStatus) {
              if (linkStatus.success) {
                showToast('Bug #' + bugId + ' 已提交并关联需求！');
              } else {
                showToast('Bug #' + bugId + ' 已提交，但需求关联失败: ' + (linkStatus.error || '未知错误'), 'warn');
              }
            } else {
              showToast('Bug 已提交！ID: ' + bugId);
            }
            // 上传完成预览：截图和粘贴图片保留3秒供查看，再清空
            var hasMedia = screenshotDataUrl || pastedImages.some(function(p) { return p !== null; });
            if (hasMedia) {
              showToast('Bug #' + bugId + ' 已提交！图片预览将在3秒后自动清除');
              setTimeout(function() {
                clearMediaAttachments();
              }, 3000);
            } else {
              clearMediaAttachments();
            }
          } else {
            var errMsg = resp ? resp.error : '请检查TAPD配置';
            showToast('提交失败: ' + errMsg, 'error');
          }
          setTimeout(function() {
            btn.disabled = false;
            btn.textContent = '🚀 提交到 TAPD';
          }, 3000);
        });
      } else {
        showToast('请在Chrome扩展环境下使用', 'warn');
        btn.disabled = false;
        btn.textContent = '🚀 提交到 TAPD';
      }
    });

    document.getElementById('tapd-btn-screenshot').addEventListener('click', captureScreenshot);
    document.getElementById('tapd-btn-remove-screenshot').addEventListener('click', removeScreenshot);
    document.getElementById('tapd-btn-record-start').addEventListener('click', startRecording);
    document.getElementById('tapd-btn-record-stop').addEventListener('click', stopRecording);

    panelEl.querySelector('.tapd-btn-settings').addEventListener('click', toggleSettings);
    document.getElementById('tapd-btn-save-settings').addEventListener('click', saveSettings);
    document.getElementById('tapd-btn-login-tapd').addEventListener('click', openTapdLogin);
    document.getElementById('tapd-btn-test').addEventListener('click', testConnection);

    // Resize handle (top-left anchor)
    (function() {
      var handle = document.getElementById('tapd-resize-handle');
      if (!handle) return;
      var resizing = false, sx, sy, sw, sh, sl, st;
      handle.addEventListener('mousedown', function(e) {
        e.preventDefault();
        e.stopPropagation();
        resizing = true;
        sx = e.clientX; sy = e.clientY;
        var r = panelEl.getBoundingClientRect();
        sw = r.width; sh = r.height;
        sl = r.left; st = r.top;
        panelEl.style.right = 'auto';
        panelEl.style.left = sl + 'px';
        panelEl.style.top = st + 'px';
      });
      document.addEventListener('mousemove', function(e) {
        if (!resizing) return;
        var nw = Math.max(320, sw + (e.clientX - sx));
        var nh = Math.max(360, sh + (e.clientY - sy));
        panelEl.style.width = nw + 'px';
        panelEl.style.minHeight = nh + 'px';
      });
      document.addEventListener('mouseup', function() { resizing = false; });
    })();
  }

  function copyText(text, cb) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(cb).catch(function() { fallbackCopy(text, cb); });
    } else {
      fallbackCopy(text, cb);
    }
  }

  function fallbackCopy(text, cb) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed'; ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); cb(); } catch(e) { showToast('复制失败', 'error'); }
    document.body.removeChild(ta);
  }

  function copyRichText(html, text, cb) {
    var blobHtml = new Blob([html], { type: 'text/html' });
    var blobText = new Blob([text], { type: 'text/plain' });
    var data = new ClipboardItem({
      'text/html': blobHtml,
      'text/plain': blobText
    });
    navigator.clipboard.write([data]).then(cb).catch(function() {
      copyText(text, cb);
    });
  }

  function stripHtml(html) {
    var d = document.createElement('div');
    d.innerHTML = html;
    return d.textContent || d.innerText || '';
  }

  function captureScreenshot() {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      showToast('正在截取页面...');
      chrome.runtime.sendMessage({ action: 'captureScreenshot' }, function(resp) {
        if (resp && resp.dataUrl) {
          screenshotDataUrl = resp.dataUrl;
          var preview = document.getElementById('tapd-screenshot-preview');
          var img = document.getElementById('tapd-screenshot-img');
          preview.style.display = 'block';
          img.src = screenshotDataUrl;
          img.style.cursor = 'pointer';
          img.onclick = function() { showImagePreview(screenshotDataUrl); };
          showToast('截图已捕获！已嵌入Bug描述中');
        } else {
          showToast('截图失败: ' + (resp ? resp.error : '未知错误'), 'error');
        }
      });
    } else {
      fallbackScreenshot();
    }
  }

  function fallbackScreenshot() {
    showToast('请使用Chrome扩展环境截图', 'warn');
  }

  function removeScreenshot() {
    screenshotDataUrl = '';
    pastedImages = [];
    document.getElementById('tapd-screenshot-preview').style.display = 'none';
    document.getElementById('tapd-screenshot-img').src = '';
    var pastedContainer = document.getElementById('tapd-pasted-previews');
    if (pastedContainer) pastedContainer.innerHTML = '';
    showToast('截图已移除');
  }

  function restoreScreenshots() {
    if (screenshotDataUrl) {
      var preview = document.getElementById('tapd-screenshot-preview');
      var img = document.getElementById('tapd-screenshot-img');
      if (preview && img) {
        preview.style.display = 'block';
        img.src = screenshotDataUrl;
      }
    }
    var validImages = pastedImages.filter(function(img) { return img !== null; });
    validImages.forEach(function(dataUrl, index) {
      addPastedImagePreview(dataUrl, index);
    });
  }

  function startRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      showToast('正在录制中...', 'warn');
      return;
    }

    var displayMediaOptions = {
      video: { mediaSource: 'screen' },
      audio: false
    };

    var promise;
    if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
      promise = navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
    } else if (navigator.getDisplayMedia) {
      promise = navigator.getDisplayMedia(displayMediaOptions);
    } else {
      showToast('当前环境不支持录屏', 'error');
      return;
    }

    promise.then(function(stream) {
      recordedChunks = [];
      var mimeType = 'video/webm;codecs=vp9';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
      }

      try {
        mediaRecorder = new MediaRecorder(stream, { mimeType: mimeType });
      } catch(e) {
        mediaRecorder = new MediaRecorder(stream);
      }

      mediaRecorder.addEventListener('dataavailable', function(e) {
        if (e.data && e.data.size > 0) recordedChunks.push(e.data);
      });

      mediaRecorder.addEventListener('stop', function() {
        stream.getTracks().forEach(function(t) { t.stop(); });
        downloadVideo();
      });

      mediaRecorder.start(1000);
      recordingStartTime = Date.now();
      document.getElementById('tapd-recording-status').style.display = 'block';
      document.getElementById('tapd-btn-record-start').style.display = 'none';
      updateRecordingTimer();
      recordingTimer = setInterval(updateRecordingTimer, 1000);
      showToast('录屏已开始，请操作页面复现Bug');
    }).catch(function(err) {
      showToast('录屏启动失败: ' + err.message, 'error');
    });
  }

  function updateRecordingTimer() {
    var elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
    var mins = Math.floor(elapsed / 60);
    var secs = elapsed % 60;
    var el = document.getElementById('tapd-rec-timer');
    if (el) el.textContent = (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
  }

  function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      clearInterval(recordingTimer);
      document.getElementById('tapd-recording-status').style.display = 'none';
      document.getElementById('tapd-btn-record-start').style.display = '';
    }
  }

  function downloadVideo() {
    if (recordedChunks.length === 0) return;
    var blob = new Blob(recordedChunks, { type: 'video/webm' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'bug-screencast-' + new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19) + '.webm';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('录屏已下载！可手动上传到TAPD附件');
  }

  // ========== Keyboard shortcuts ==========

  document.addEventListener('keydown', function(e) {
    // Alt+Q: toggle panel
    if (e.altKey && e.key === 'q') {
      e.preventDefault();
      togglePanel();
    }
    // Escape: close panel
    if (e.key === 'Escape' && panelVisible) {
      removePanel();
    }
  });

  // ========== Clipboard image paste ==========

  document.addEventListener('paste', function(e) {
    if (!panelVisible) return;
    var items = e.clipboardData && e.clipboardData.items;
    if (!items) return;

    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      if (item.type.indexOf('image') === 0) {
        e.preventDefault();
        var blob = item.getAsFile();
        var reader = new FileReader();
        reader.onload = function(evt) {
          var dataUrl = evt.target.result;
          pastedImages.push(dataUrl);
          addPastedImagePreview(dataUrl, pastedImages.length - 1);
          showToast('图片已粘贴！');
        };
        reader.readAsDataURL(blob);
        break;
      }
    }
  });

  function addPastedImagePreview(dataUrl, index) {
    var previewContainer = document.getElementById('tapd-pasted-previews');
    if (!previewContainer) {
      var mediaSection = document.getElementById('tapd-media-section');
      if (!mediaSection) return;
      previewContainer = document.createElement('div');
      previewContainer.id = 'tapd-pasted-previews';
      previewContainer.style.display = 'flex';
      previewContainer.style.flexWrap = 'wrap';
      previewContainer.style.gap = '8px';
      previewContainer.style.marginTop = '8px';
      var toolbox = mediaSection.querySelector('.tapd-media-toolbar');
      if (toolbox) toolbox.parentNode.insertBefore(previewContainer, toolbox.nextSibling);
      else mediaSection.appendChild(previewContainer);
    }

    var wrapper = document.createElement('div');
    wrapper.style.position = 'relative';
    wrapper.style.width = '80px';
    wrapper.style.height = '80px';
    wrapper.style.borderRadius = '4px';
    wrapper.style.overflow = 'hidden';
    wrapper.style.border = '1px solid #313244';

    var img = document.createElement('img');
    img.src = dataUrl;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    img.style.cursor = 'pointer';
    img.addEventListener('click', function() { showImagePreview(dataUrl); });

    var del = document.createElement('button');
    del.textContent = '✕';
    del.style.position = 'absolute';
    del.style.top = '2px';
    del.style.right = '2px';
    del.style.width = '18px';
    del.style.height = '18px';
    del.style.border = 'none';
    del.style.background = 'rgba(0,0,0,0.6)';
    del.style.color = '#fff';
    del.style.fontSize = '10px';
    del.style.borderRadius = '50%';
    del.style.cursor = 'pointer';
    del.style.lineHeight = '1';
    del.addEventListener('click', function(e) {
      e.stopPropagation();
      pastedImages[index] = null;
      wrapper.remove();
    });

    wrapper.appendChild(img);
    wrapper.appendChild(del);
    previewContainer.appendChild(wrapper);
  }

  // ========== Message from background/extension ==========

  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener(function(req, sender, sendResponse) {
      if (req.action === 'togglePanel') {
        togglePanel();
        sendResponse({ visible: panelVisible });
      } else if (req.action === 'getStatus') {
        sendResponse({ visible: panelVisible, steps: operationLog.length, url: window.location.href });
      }
      return true;
    });
  }

  // ========== Init ==========

  console.log('[TAPD Bug Reporter] 已启动 | Alt+Q 打开提Bug面板 | 已录制 ' + operationLog.length + ' 步操作');
})();
