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

// ===== Bearer Token 管理 =====

var _accessToken = null;
var _tokenExpiresAt = 0;

function getAccessToken() {
  if (_accessToken && Date.now() < _tokenExpiresAt) {
    return Promise.resolve(_accessToken);
  }
  var creds = getCredentials();
  var user = creds.api_user;
  var pass = creds.api_password;
  var tokenUrl = (creds.api_url || 'https://api.tapd.cn').replace(/\/+$/, '') + '/tokens/request_token';

  if (!user || !pass) {
    return Promise.reject(new Error('管理员尚未配置 API 凭证'));
  }

  var auth = 'Basic ' + btoa(user + ':' + pass);
  console.log('[TAPD] 请求 Bearer Token...', tokenUrl);

  return fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Authorization': auth,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  })
  .then(function(r) { return r.json(); })
  .then(function(json) {
    if (json.status === 1 && json.data && json.data.access_token) {
      _accessToken = json.data.access_token;
      var expiresIn = json.data.expires_in || 7200;
      _tokenExpiresAt = Date.now() + (expiresIn - 300) * 1000;
      console.log('[TAPD] Bearer Token 获取成功，有效期', expiresIn, '秒');
      return _accessToken;
    }
    throw new Error(json.info || 'Token 获取失败');
  });
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
  var apiUrl = (creds.api_url || 'https://api.tapd.cn').replace(/\/+$/, '');
  var wsId = bugData.workspace_id;

  if (!wsId) {
    sendResponse({ success: false, error: '未填写项目ID' });
    return;
  }

  var STANDARD_FIELDS = ['deadline', 'begin', 'due', 'iteration_id'];

  getAccessToken().then(function(token) {
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

    // Include story_id in bug creation (TAPD 可能原生支持)
    if (bugData.requirement_id) {
      payload.story_id = bugData.requirement_id.replace(/^S-/i, '');
    }

    var customFields = bugData.custom_fields || {};
    for (var ck in customFields) {
      if (!customFields[ck]) continue;
      // Known standard fields: use as-is (no cus_ prefix)
      if (STANDARD_FIELDS.indexOf(ck) > -1) {
        payload[ck] = customFields[ck];
      } else {
        payload['cus_' + ck] = customFields[ck];
      }
    }

    var body = new URLSearchParams();
    for (var k in payload) {
      if (payload[k]) body.append(k, payload[k]);
    }

    console.log('[TAPD] 提交Bug to', apiUrl + '/bugs', 'project', wsId);
    console.log('[TAPD] 提交字段:', Object.keys(payload).join(', '));

    return fetch(apiUrl + '/bugs', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: body.toString()
    }).then(function(r) {
      console.log('[TAPD] 响应状态:', r.status);
      return r.json();
    });
  })
  .then(function(json) {
    console.log('[TAPD] 响应数据:', JSON.stringify(json).substring(0, 200));
    if (json.status === 1) {
      var bugResult = json.data && json.data.Bug ? json.data.Bug : json.data;
      var bugId = bugResult ? bugResult.id : null;
      // Try direct story_id first, fallback to relations API
      if (bugId && bugData.requirement_id) {
        return tryLinkBugToStory(apiUrl, wsId, bugId, bugData.requirement_id).then(function(linkResult) {
          sendResponse({ success: true, data: json.data, link: linkResult });
        });
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

function tryLinkBugToStory(apiUrl, wsId, bugId, storyId) {
  var numericStoryId = String(storyId).replace(/^S-/i, '');
  console.log('[TAPD] 尝试关联需求:', bugId, '->', numericStoryId);

  return getAccessToken().then(function(token) {
    // 方法一：专用接口 /bugs/linked_stories（加 Accept 头 + 记录状态码）
    return tryLinkViaLinkedStories(apiUrl, wsId, bugId, numericStoryId, token).then(function(result) {
      if (result && result.success) return result;
      // 方法二：尝试通用 Relations API
      console.warn('[TAPD] linked_stories 失败, 尝试 /relations...');
      return tryLinkViaRelations(apiUrl, wsId, bugId, numericStoryId, token);
    });
  });
}

function doLinkFetch(url, body, token) {
  return fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    },
    body: body.toString()
  }).then(function(r) {
    var status = r.status;
    var location = r.headers.get('location') || '';
    console.log('[TAPD] 关联响应状态码:', status, 'location:', location.substring(0, 100));
    var ct = r.headers.get('content-type') || '';
    if (ct.indexOf('json') === -1 && ct.indexOf('javascript') === -1) {
      return r.text().then(function(t) {
        return { status: 0, info: '非JSON响应(HTTP ' + status + '): ' + t.substring(0, 300) };
      });
    }
    return r.json().catch(function() { return { status: 0, info: 'JSON解析失败(HTTP ' + status + ')' }; });
  });
}

function tryLinkViaLinkedStories(apiUrl, wsId, bugId, storyId, token) {
  var body = new URLSearchParams();
  body.append('workspace_id', wsId);
  body.append('bug_id', String(bugId));
  body.append('story_id', storyId);

  return doLinkFetch(apiUrl + '/bugs/linked_stories', body, token)
  .then(function(json) {
    if (json && json.status === 1) {
      console.log('[TAPD] ✅ linked_stories 关联成功:', storyId);
      return { success: true, story_id: storyId, method: 'linked_stories' };
    }
    var errMsg = (json && json.info) || JSON.stringify(json) || '未知错误';
    console.warn('[TAPD] ❌ linked_stories 失败:', errMsg);
    return { success: false, story_id: storyId, error: errMsg };
  });
}

function tryLinkViaRelations(apiUrl, wsId, bugId, storyId, token) {
  var body = new URLSearchParams();
  body.append('workspace_id', wsId);
  body.append('source_type', 'bug');
  body.append('target_type', 'story');
  body.append('source_id', String(bugId));
  body.append('target_id', storyId);

  return doLinkFetch(apiUrl + '/relations', body, token)
  .then(function(json) {
    if (json && json.status === 1) {
      console.log('[TAPD] ✅ Relations API 关联成功:', storyId);
      return { success: true, story_id: storyId, method: 'relations' };
    }
    var errMsg = (json && json.info) || JSON.stringify(json) || '未知错误';
    console.warn('[TAPD] ❌ /relations 失败:', errMsg);
    return { success: false, story_id: storyId, error: errMsg };
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
  var user = creds.api_user;
  var pass = creds.api_password;
  var apiUrl = (creds.api_url || 'https://api.tapd.cn').replace(/\/+$/, '');
  var wsId = cfg.workspace_id;

  if (!user || !pass) {
    sendResponse({ success: false, error: '管理员尚未配置 API 凭证' });
    return;
  }

  console.log('[TAPD] 测试连接...');

  getAccessToken().then(function(token) {
    console.log('[TAPD] Token 获取成功，验证项目权限...');

    if (!wsId) {
      sendResponse({ success: true, message: 'API凭证有效（未填写项目ID，跳过字段获取）' });
      return;
    }

    return Promise.all([
      fetchTemplateFields(apiUrl, wsId),
      fetchBugFieldInfo(apiUrl, wsId),
      fetchWorkspaceUsers(apiUrl, wsId)
    ]).then(function(results) {
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
    });
  })
  .catch(function(err) {
    console.error('[TAPD] 测试失败:', err);
    sendResponse({ success: false, error: '连接失败: ' + err.message });
  });
}

// ===== TAPD API 辅助函数 =====

function tapdApiFetch(apiUrl, pathWithQuery) {
  return getAccessToken().then(function(token) {
    var url = apiUrl + pathWithQuery;
    console.log('[TAPD] 请求:', url);

    return fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Accept': 'application/json'
      }
    })
    .then(function(r) { return r.text(); })
    .then(function(t) {
      if (t.charAt(0) !== '{') throw new Error('TAPD返回非JSON: ' + t.substring(0, 150));
      return JSON.parse(t);
    });
  });
}

function fetchBugFieldInfo(apiUrl, wsId) {
  return tapdApiFetch(apiUrl, '/bugs/get_fields_info?workspace_id=' + wsId)
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

function fetchTemplateFields(apiUrl, wsId) {
  return tapdApiFetch(apiUrl, '/bugs/template_list?workspace_id=' + wsId)
  .then(function(json) {
    if (json.status !== 1 || !json.data || !json.data.length) {
      console.warn('[TAPD] 未获取到模板列表');
      return [];
    }
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

    return tapdApiFetch(apiUrl, '/bugs/get_default_bug_template?template_id=' + defaultTemplate.id + '&workspace_id=' + wsId + '&use_priority_label=1');
  })
  .then(function(json) {
    if (json.status !== 1 || !json.data) {
      console.warn('[TAPD] 未获取到模板字段');
      return [];
    }
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

function fetchWorkspaceUsers(apiUrl, wsId) {
  return tapdApiFetch(apiUrl, '/workspaces/users?workspace_id=' + wsId)
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
