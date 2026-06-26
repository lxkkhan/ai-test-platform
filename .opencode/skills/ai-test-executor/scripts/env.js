const path = require('path');
const fs = require('fs');

const SYSTEM_CONFIG_PATH = path.resolve(__dirname, '..', 'systems.json');

let systemConfigs = {};
try {
  systemConfigs = JSON.parse(fs.readFileSync(SYSTEM_CONFIG_PATH, 'utf8'));
} catch (e) {
  console.warn('[env] 无法加载 systems.json:', e.message);
}

// Default to 配送中心系统
const DEFAULT_SYSTEM = '配送中心系统';

function getSystemConfig(systemName) {
  const name = systemName || DEFAULT_SYSTEM;
  const config = systemConfigs[name];
  if (!config) {
    console.warn(`[env] 未找到系统 "${name}"，使用默认配置`);
    return systemConfigs[DEFAULT_SYSTEM] || {};
  }
  return config;
}

// Also load .env as fallback
const ENV_PATH = path.resolve(__dirname, '..', '..', 'dom-recorder', '.env');
try {
  const envContent = fs.readFileSync(ENV_PATH, 'utf8');
  envContent.split('\n').forEach(line => {
    const idx = line.indexOf('=');
    if (idx > 0) {
      const key = line.substring(0, idx).trim();
      let val = line.substring(idx + 1).trim();
      if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) {
        val = val.substring(1, val.length - 1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  });
} catch (e) {
  // .env file is optional
}

module.exports = { getSystemConfig, systemConfigs, DEFAULT_SYSTEM };
