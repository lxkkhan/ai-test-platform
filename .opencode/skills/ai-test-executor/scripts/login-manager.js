const path = require('path');
const fs = require('fs');
const os = require('os');
const { chromium } = require(path.resolve(__dirname, '..', '..', 'playwright-mind', 'node_modules', 'playwright'));
const env = require('./env');
const { solveSlider, interceptCaptchaData } = require('./slider-solver');

const MAX_RETRIES = 5;

async function launchBrowser(headless = false) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aite-'));
  const context = await chromium.launchPersistentContext(tmpDir, {
    headless,
    viewport: { width: 1920, height: 1080 },
    timeout: 300000,
    bypassCSP: true,
  });
  const page = context.pages()[0] || await context.newPage();
  return { context, page, tmpDir };
}

async function login(page, loginUrl, username, password) {
  const url = loginUrl || env.LOGIN_URL;
  const user = username || env.LOGIN_USERNAME;
  const pwd = password || env.LOGIN_PASSWORD;

  console.log('[login] 导航到登录页:', url);
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  } catch { console.log('[login] goto 超时，继续...'); }

  // Wait for WAF challenge
  try {
    await page.waitForFunction(() => !window.location.href.includes('unsaFpAV7iKf'), { timeout: 60000, polling: 500 });
  } catch { console.warn('[login] WAF 超时，继续...'); }

  // Wait for login form
  try {
    await page.waitForSelector('input[type="password"], input[id="pwd"]', { timeout: 30000, state: 'visible' });
  } catch { console.warn('[login] 密码框未在30s内出现，尝试继续...'); }

  if (user) {
    try { await page.fill('#userCode', user, { timeout: 5000 }); } catch { console.log('[login] #userCode 不存在，跳过'); }
  }
  if (pwd) {
    try { await page.fill('#pwd', pwd, { timeout: 5000 }); } catch { console.log('[login] #pwd 不存在，跳过'); }
  }
  console.log('[login] 账号密码已填写');

  // Set up captcha listener BEFORE clicking login
  const captchaPromise = interceptCaptchaData(page).catch(() => null);

  // Click login button
  try {
    const btn = page.locator('#formLogin button[type="submit"]');
    if (await btn.count() > 0) await btn.first().click();
    else await page.click('button:has-text("登录")');
  } catch { console.log('[login] 登录按钮点击失败，手动尝试'); }

  await page.waitForTimeout(1500);

  // Check if captcha appears
  const hasCaptcha = await page.locator('#slideVerify').isVisible().catch(() => false);
  if (hasCaptcha) {
    console.log('[login] 检测到滑块验证码，自动求解中...');
    let captchaData = await captchaPromise;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      console.log(`[login] 第 ${attempt}/${MAX_RETRIES} 次尝试...`);
      try {
        const success = await solveSlider(page, captchaData);
        if (success) {
          console.log(`[login] 滑块验证成功!`);
          return;
        }
      } catch (e) {
        console.warn(`[login] 第 ${attempt} 次失败: ${e.message}`);
      }
      if (attempt < MAX_RETRIES) {
        captchaData = null;
        const nextCaptchaPromise = interceptCaptchaData(page).catch(() => null);
        try { await page.locator('.slide-verify-refresh-icon').click(); }
        catch { try { await page.locator('#formLogin button[type="submit"]').first().click(); } catch {} }
        await page.waitForTimeout(1500);
        captchaData = await nextCaptchaPromise;
      }
    }
    console.log('[login] 滑块验证多次失败，等待手动处理...');
    const readline = require('readline');
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    await new Promise(resolve => rl.question('手动完成后按回车继续...', () => { rl.close(); resolve(); }));
  }

  // Wait for login success
  for (let i = 0; i < 60; i++) {
    await page.waitForTimeout(1000);
    const curUrl = page.url();
    if (curUrl.includes('login=true') || !curUrl.includes('/login')) {
      console.log('[login] 登录成功!');
      return;
    }
  }
  // Check if already on main page
  const curUrl = page.url();
  if (!curUrl.includes('/login') && curUrl.includes('tcm-dc-sit')) {
    console.log('[login] 已进入系统，登录完成');
    return;
  }
  console.log('[login] 登录完成（或跳过检测）');
}

module.exports = { launchBrowser, login };
