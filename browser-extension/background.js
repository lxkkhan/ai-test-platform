// 加密凭证文件（由 encrypt-credentials.ps1 生成）
try {
  importScripts('credentials.enc.js');
  console.log('[TAPD] credentials.enc.js loaded, api_user_enc length:', (CREDENTIALS_ENCRYPTED.api_user_enc || '').length);
} catch(e) {
  console.error('[TAPD] Failed to load credentials.enc.js:', e);
}

// ===== AES-GCM 密钥派生参数（与加密脚本保持一致） =====
var ENC_PASSPHRASE = 'R7kQ2mZ9xW4vN1pL8jF6yH3tB5cA0sD';
var ENC_SALT_B64   = 'B58EUkqXDtCMSgpEgcKnyA==';

var _credentialsCache = null;
var _credentialsReady = false;
var _credentialsWaiters = [];

// ===== 启动时异步解密凭证 =====
initCredentials();

function initCredentials() {
  console.log('[TAPD] initCredentials called');
  console.log('[TAPD] CREDENTIALS_ENCRYPTED:', JSON.stringify(Object.keys(CREDENTIALS_ENCRYPTED)));
  console.log('[TAPD] api_user_enc length:', (CREDENTIALS_ENCRYPTED.api_user_enc || '').length);
  console.log('[TAPD] api_password_enc length:', (CREDENTIALS_ENCRYPTED.api_password_enc || '').length);
  if (!CREDENTIALS_ENCRYPTED.api_user_enc || !CREDENTIALS_ENCRYPTED.api_password_enc) {
    console.warn('[TAPD] 管理员尚未配置加密凭证');
    _credentialsReady = true;
    return;
  }
  deriveKey(ENC_PASSPHRASE, ENC_SALT_B64).then(function(key) {
    console.log('[TAPD] key derived successfully, starting decrypt...');
    return Promise.all([
      key,
      decryptAesCbcHmac(key, CREDENTIALS_ENCRYPTED.api_user_enc),
      decryptAesCbcHmac(key, CREDENTIALS_ENCRYPTED.api_password_enc)
    ]);
  }).then(function(results) {
    console.log('[TAPD] decrypt results user:', results[1], 'pass:', results[2] ? '***' : 'EMPTY');
    _credentialsCache = {
      api_url: CREDENTIALS_ENCRYPTED.api_url,
      api_user: results[1],
      api_password: results[2]
    };
    _credentialsReady = true;
    console.log('[TAPD] 凭证解密成功');
    // 通知所有等待中的请求
    for (var i = 0; i < _credentialsWaiters.length; i++) {
      _credentialsWaiters[i]();
    }
    _credentialsWaiters = [];
  }).catch(function(err) {
    console.error('[TAPD] 凭证解密失败:', err);
    _credentialsReady = true;
  });
}

function getCredentials() {
  if (_credentialsCache) return _credentialsCache;
  return { api_url: CREDENTIALS_ENCRYPTED.api_url, api_user: '', api_password: '' };
}

function waitForCredentials() {
  if (_credentialsReady) return Promise.resolve();
  return new Promise(function(resolve) {
    _credentialsWaiters.push(resolve);
  });
}

// ===== AES-CBC + HMAC-SHA256 加解密实现 =====

function deriveKey(passphrase, saltB64) {
  var encoder = new TextEncoder();
  var saltBytes = base64ToUint8(saltB64);
  return crypto.subtle.importKey(
    'raw', encoder.encode(passphrase), 'PBKDF2', false, ['deriveKey']
  ).then(function(keyMaterial) {
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: saltBytes, iterations: 100000, hash: 'SHA-256' },
      keyMaterial,
      { name: 'AES-CBC', length: 256 },
      true,
      ['decrypt']
    );
  });
}

function decryptAesCbcHmac(key, cipherB64) {
  console.log('[TAPD] decryptAesCbcHmac called, cipherB64 length:', cipherB64.length);
  var cipherBytes = base64ToUint8(cipherB64);
  console.log('[TAPD] cipherBytes length:', cipherBytes.length);
  // cipherB64 format: base64(IV(16) + ciphertext + HMAC(32))
  var ivLength = 16;
  var hmacLength = 32;
  var ctLength = cipherBytes.length - ivLength - hmacLength;
  console.log('[TAPD] ctLength:', ctLength, 'ivLength:', ivLength, 'hmacLength:', hmacLength);

  if (ctLength < 1) {
    return Promise.reject(new Error('Invalid ciphertext length: ' + ctLength + ', total: ' + cipherBytes.length));
  }

  var ctIv = cipherBytes.slice(0, ivLength);
  var ciphertext = cipherBytes.slice(ivLength, ivLength + ctLength);
  var expectedHmac = cipherBytes.slice(ivLength + ctLength);

  // Extract raw key bytes for HMAC
  return crypto.subtle.exportKey('raw', key).then(function(keyBytes) {
    console.log('[TAPD] key exported, length:', keyBytes.byteLength);
    // HMAC over (IV || ciphertext)
    var dataForHmac = new Uint8Array(ivLength + ctLength);
    dataForHmac.set(ctIv);
    dataForHmac.set(ciphertext, ivLength);

    return crypto.subtle.importKey(
      'raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
    ).then(function(hmacKey) {
      return crypto.subtle.verify(
        { name: 'HMAC', hash: 'SHA-256' },
        hmacKey,
        expectedHmac,
        dataForHmac
      );
    }).then(function(hmacValid) {
      if (!hmacValid) {
        throw new Error('HMAC verification failed - data tampered?');
      }
      return crypto.subtle.decrypt(
        { name: 'AES-CBC', iv: ctIv },
        key,
        ciphertext
      );
    }).then(function(decrypted) {
      return new TextDecoder().decode(decrypted);
    });
  });
}

function base64ToUint8(b64) {
  var binary = atob(b64);
  var bytes = new Uint8Array(binary.length);
  for (var i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// ===== 扩展事件 =====

chrome.runtime.onInstalled.addListener(function() {
  chrome.contextMenus.create({
    id: 'tapd-submit-bug',
    title: '\uD83D\uDC1B 在此提交Bug到TAPD',
    contexts: ['page', 'frame']
  });
});

chrome.contextMenus.onClicked.addListener(function(info, tab) {
  if (info.menuItemId === 'tapd-submit-bug') {
    chrome.tabs.sendMessage(tab.id, { action: 'togglePanel' });
  }
});

chrome.action.onClicked.addListener(function(tab) {
  chrome.tabs.sendMessage(tab.id, { action: 'togglePanel' });
});

chrome.commands.onCommand.addListener(function(command) {
  if (command === 'toggle-panel') {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'togglePanel' });
      }
    });
  }
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'submitBug') {
    waitForCredentials().then(function() {
      submitBug(request.data, sendResponse);
    });
    return true;
  }
  if (request.action === 'captureScreenshot') {
    captureScreenshot(sendResponse);
    return true;
  }
  if (request.action === 'testAuth') {
    waitForCredentials().then(function() {
      testAuth(request.data, sendResponse);
    });
    return true;
  }
});

// ===== 核心功能 =====

function submitBug(bugData, sendResponse) {
  var creds = getCredentials();
  var user = creds.api_user;
  var pass = creds.api_password;
  var apiUrl = (creds.api_url || 'https://api.tapd.cn').replace(/\/+$/, '');
  var wsId = bugData.workspace_id;

  if (!user || !pass) {
    sendResponse({ success: false, error: '管理员尚未配置 API 凭证' });
    return;
  }
  if (!wsId) {
    sendResponse({ success: false, error: '未填写项目ID' });
    return;
  }

  var payload = {
    workspace_id: wsId,
    title: bugData.title,
    reporter: bugData.reporter || '',
    priority_label: bugData.priority_label || '中',
    severity: bugData.severity || '一般',
    module: bugData.module || '',
    current_owner: bugData.current_owner || '',
    description: bugData.description || '',
    testtype: bugData.testtype || '功能测试',
    testphase: bugData.testphase || '功能测试阶段'
  };

  var customFields = bugData.custom_fields || {};
  for (var ck in customFields) {
    if (customFields[ck]) payload['cus_' + ck] = customFields[ck];
  }

  var auth = 'Basic ' + btoa(user + ':' + pass);

  var body = new URLSearchParams();
  for (var k in payload) {
    if (payload[k]) body.append(k, payload[k]);
  }

  console.log('[TAPD] 提交Bug to', apiUrl + '/bugs', 'project', wsId);

  fetch(apiUrl + '/bugs', {
    method: 'POST',
    headers: {
      'Authorization': auth,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: body.toString()
  })
  .then(function(r) {
    console.log('[TAPD] 响应状态:', r.status);
    return r.json();
  })
  .then(function(json) {
    console.log('[TAPD] 响应数据:', JSON.stringify(json).substring(0, 200));
    if (json.status === 1) {
      // 关联需求（如果有需求ID）
      var bugResult = json.data && json.data.Bug ? json.data.Bug : json.data;
      var bugId = bugResult ? bugResult.id : null;
      if (bugId && bugData.requirement_id) {
        linkBugToStory(apiUrl, auth, wsId, bugId, bugData.requirement_id);
      }
      sendResponse({ success: true, data: json.data });
    } else {
      sendResponse({ success: false, error: json.info || 'TAPD API 返回错误' });
    }
  })
  .catch(function(err) {
    console.error('[TAPD] 请求失败:', err);
    sendResponse({ success: false, error: '网络请求失败: ' + err.message });
  });
}

function linkBugToStory(apiUrl, auth, wsId, bugId, storyId) {
  var body = new URLSearchParams();
  body.append('workspace_id', wsId);
  body.append('source_type', 'bug');
  body.append('target_type', 'story');
  body.append('source_id', String(bugId));
  body.append('target_id', String(storyId));

  console.log('[TAPD] 关联需求:', bugId, '->', storyId);

  fetch(apiUrl + '/relations', {
    method: 'POST',
    headers: {
      'Authorization': auth,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: body.toString()
  })
  .then(function(r) { return r.json(); })
  .then(function(json) {
    if (json.status === 1) {
      console.log('[TAPD] 需求关联成功:', storyId);
    } else {
      console.warn('[TAPD] 需求关联失败:', json.info);
    }
  })
  .catch(function(err) {
    console.warn('[TAPD] 需求关联请求失败:', err.message);
  });
}

function captureScreenshot(sendResponse) {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    if (!tabs || tabs.length === 0) {
      sendResponse({ success: false, error: '未找到活动标签页' });
      return;
    }
    chrome.tabs.captureVisibleTab(tabs[0].windowId, { format: 'png', quality: 90 }, function(dataUrl) {
      if (chrome.runtime.lastError) {
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
        return;
      }
      if (dataUrl) {
        sendResponse({ success: true, dataUrl: dataUrl });
      } else {
        sendResponse({ success: false, error: '截图返回空数据' });
      }
    });
  });
}

function testAuth(cfg, sendResponse) {
  var creds = getCredentials();
  var apiUrl = (creds.api_url || 'https://api.tapd.cn').replace(/\/+$/, '');
  var user = creds.api_user;
  var pass = creds.api_password;
  var wsId = cfg.workspace_id;

  if (!user || !pass) {
    sendResponse({ success: false, error: '管理员尚未配置 API 凭证' });
    return;
  }

  var auth = 'Basic ' + btoa(user + ':' + pass);
  var testUrl = apiUrl + '/quickstart/testauth';

  console.log('[TAPD] 测试连接...', testUrl, 'user:', user);

  fetch(testUrl, {
    method: 'GET',
    headers: { 'Authorization': auth }
  })
  .then(function(r) {
    return r.text().then(function(t) {
      console.log('[TAPD] raw response:', t.substring(0, 300));
      if (t.charAt(0) !== '{') throw new Error('服务器返回非JSON (可能是认证失败页面): ' + t.substring(0, 100));
      return JSON.parse(t);
    });
  })
  .then(function(json) {
    console.log('[TAPD] testauth status:', json.status, 'info:', json.info);
    if (json.status !== 1) {
      sendResponse({ success: false, error: (json.info || '认证失败') + '。请检查API账号密码是否正确，或API账号是否已过期' });
      return;
    }
    if (!wsId) {
      sendResponse({ success: true, message: 'API凭证有效（未填写项目ID，跳过字段获取）' });
      return;
    }
    var baseUrl = apiUrl;
    console.log('[TAPD] 正在获取项目 ' + wsId + ' 的缺陷字段配置...');

    // Step 1: Get template list, find the default template ID
    fetchTemplateFields(apiUrl, auth, wsId).then(function(templateResult) {
      return Promise.all([
        Promise.resolve(templateResult),
        fetchBugFieldInfo(apiUrl, auth, wsId),
        fetchWorkspaceUsers(apiUrl, auth, wsId)
      ]);
    }).then(function(results) {
      var fieldInfoData = results[1].parsed || {};
      sendResponse({
        success: true,
        message: 'API凭证有效，已获取项目字段配置',
        projectData: {
          fields: fieldInfoData,
          template: results[0],
          users: results[2] || [],
          _debug_fields: results[1].raw || 'fields获取: ' + (Object.keys(fieldInfoData).length) + ' keys'
        },
        _debug: results[1].raw || (fieldInfoData ? 'fields已获取' : 'fields为空')
      });
    })
    .catch(function(err) {
      console.error('[TAPD] 获取字段失败:', err);
      sendResponse({
        success: true,
        message: 'API凭证有效，但获取项目字段失败: ' + err.message,
        projectData: null,
        debug: baseUrl + '/bugs/get_fields_info?workspace_id=' + wsId
      });
    });
  })
  .catch(function(err) {
    console.error('[TAPD] 测试失败:', err);
    sendResponse({ success: false, error: '网络请求失败: ' + err.message });
  });
}

// ===== TAPD API 辅助函数 =====

function tapdApiFetch(apiUrl, pathWithQuery, options) {
  var url = apiUrl + pathWithQuery;
  var basicAuth = options.basicAuth;
  var needCookies = options.needCookies;
  var cookieDomain = extractDomain(apiUrl);

  var headers = { 'Accept': 'application/json' };
  if (basicAuth) headers['Authorization'] = basicAuth;

  console.log('[TAPD] 请求:', url);

  function doFetch(headersToUse) {
    return fetch(url, { method: 'GET', headers: headersToUse })
      .then(function(r) { return r.text(); })
      .then(function(t) {
        if (t.charAt(0) !== '{') throw new Error('TAPD返回非JSON: ' + t.substring(0, 150));
        return JSON.parse(t);
      });
  }

  return doFetch(headers).then(function(json) {
    // If Basic Auth gets 401, retry with cookies
    if (needCookies && json.status !== 1 && (json.status === 401 || json.status === 403)) {
      console.log('[TAPD] Basic Auth返回', json.status, '，尝试Cookie认证...');
      return getTapdCookies(cookieDomain).then(function(cookieStr) {
        if (!cookieStr) throw new Error('未找到TAPD Cookie，请先登录');
        console.log('[TAPD] 使用Cookie重试, Cookie长度:', cookieStr.length);
        return doFetch({ 'Cookie': cookieStr, 'Accept': 'application/json' });
      });
    }
    return json;
  });
}

function extractDomain(url) {
  try {
    var m = url.match(/:\/\/([^\/:]+)/);
    return m ? m[1] : '';
  } catch(e) { return ''; }
}

function tryCookieFetch(url, apiDomain) {
  return getTapdCookies(apiDomain).then(function(cookieStr) {
    if (!cookieStr) throw new Error('未找到TAPD登录Cookie，请在浏览器中打开并登录TAPD');
    console.log('[TAPD] 使用Cookie认证, Cookie长度:', cookieStr.length);
    return fetch(url, {
      method: 'GET',
      headers: { 'Cookie': cookieStr, 'Accept': 'application/json' },
      credentials: 'include'
    }).then(function(r) { return r.text(); });
  }).then(function(t) {
    if (t.charAt(0) === '{') return JSON.parse(t);
    throw new Error('Cookie认证也失败(仍返回HTML), 请确认已登录TAPD');
  });
}

function getTapdCookies(apiDomain) {
  return new Promise(function(resolve) {
    var domains = [];
    if (apiDomain) {
      domains.push(apiDomain);
      domains.push('.' + apiDomain.split('.').slice(-2).join('.')); // e.g. .tapd.cn
    }
    domains.push('.tapd.cn', '.tapd.woa.com', 'www.tapd.cn', 'api.tapd.cn');
    // Deduplicate
    domains = domains.filter(function(d, i) { return domains.indexOf(d) === i; });
    console.log('[TAPD] 尝试Cookie域:', domains.join(', '));
    tryDomains(0);

    function tryDomains(i) {
      if (i >= domains.length) { console.log('[TAPD] 所有域均无Cookie'); resolve(''); return; }
      chrome.cookies.getAll({ domain: domains[i] }, function(cookies) {
        if (cookies && cookies.length > 0) {
          console.log('[TAPD] 从域', domains[i], '获取到', cookies.length, '个Cookie:', cookies.map(function(c) { return c.name; }).join(', '));
          var pairs = [];
          cookies.forEach(function(c) { pairs.push(c.name + '=' + c.value); });
          resolve(pairs.join('; '));
        } else {
          console.log('[TAPD] 域', domains[i], '无Cookie');
          tryDomains(i + 1);
        }
      });
    }
  });
}

function fetchBugFieldInfo(apiUrl, auth, wsId) {
  return tapdApiFetch(apiUrl, '/bugs/get_fields_info?workspace_id=' + wsId, { basicAuth: auth, needCookies: true })
  .then(function(json) {
    console.log('[TAPD] get_fields_info status:', json.status, 'info:', json.info);
    if (json.status === 1 && json.data) {
      console.log('[TAPD] get_fields_info keys:', Object.keys(json.data).join(', '));
      return { parsed: json.data, raw: '' };
    }
    throw new Error(json.info || '获取字段信息失败');
  })
  .catch(function(err) {
    console.warn('[TAPD] get_fields_info失败:', err.message);
    return { parsed: {}, raw: err.message };
  });
}

function fetchTemplateFields(apiUrl, auth, wsId) {
  // Step 1: Get template list to find the default template
  return tapdApiFetch(apiUrl, '/bugs/template_list?workspace_id=' + wsId, { basicAuth: auth, needCookies: true })
  .then(function(json) {
    if (json.status !== 1 || !json.data || !json.data.length) {
      console.warn('[TAPD] 未获取到模板列表');
      return [];
    }
    // Find the default template (default === "1") or first one
    var defaultTemplate = null;
    for (var i = 0; i < json.data.length; i++) {
      var t = json.data[i];
      var tmpl = t.WorkitemTemplate || t;
      if (tmpl.default === '1') { defaultTemplate = tmpl; break; }
    }
    if (!defaultTemplate) {
      var first = json.data[0];
      defaultTemplate = first.WorkitemTemplate || first;
    }
    console.log('[TAPD] 使用模板: id=' + defaultTemplate.id + ' name=' + defaultTemplate.name);

    // Step 2: Get template fields using the template ID
    return tapdApiFetch(apiUrl, '/bugs/get_default_bug_template?template_id=' + defaultTemplate.id + '&workspace_id=' + wsId + '&use_priority_label=1', { basicAuth: auth, needCookies: true });
  })
  .then(function(json) {
    if (json.status !== 1 || !json.data) {
      console.warn('[TAPD] 未获取到模板字段');
      return [];
    }
    // Convert to flat field list
    var fields = [];
    json.data.forEach(function(item) {
      var tf = item.WorkitemTemplateField || item;
      if (tf.field) {
        fields.push({
          name: tf.field,
          required: tf.required === '1',
          value: tf.value || '',
          sort: parseInt(tf.sort) || 0
        });
      }
    });
    fields.sort(function(a, b) { return a.sort - b.sort; });
    console.log('[TAPD] 模板字段: ' + fields.length + ' 个 ', fields.map(function(f) { return f.name; }).join(', '));
    return fields;
  })
  .catch(function(err) {
    console.warn('[TAPD] 模板获取失败:', err.message);
    return [];
  });
}

function fetchWorkspaceUsers(apiUrl, auth, wsId) {
  return tapdApiFetch(apiUrl, '/workspaces/users?workspace_id=' + wsId, { basicAuth: auth, needCookies: true })
  .then(function(json) {
    if (json.status !== 1 || !json.data) return [];
    var userData = json.data;
    var members = userData.Member || userData.User || userData || [];
    if (!Array.isArray(members)) {
      members = [];
      for (var k in userData) {
        if (Array.isArray(userData[k])) { members = userData[k]; break; }
      }
    }
    return members.map(function(u) {
      var user = u.user || u.nick || u.name || '';
      var name = u.name || u.nick || u.user || '';
      return { user: user, name: name };
    }).filter(function(u) { return u.user; });
  })
  .catch(function(err) {
    console.warn('[TAPD] 成员获取失败:', err.message);
    return [];
  });
}
