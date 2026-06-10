/**
 * perform-login-lite.ts
 *
 * 精简版登录模块，供 dom-recorder 使用。
 * 基于 playwright-mind/tests/login/perform-login.ts 精简，
 * 去掉 Midscene aiQuery 依赖，保留滑块验证码（Python OpenCV 主方案 + canvas 备选）。
 */

import { Page } from 'playwright';
import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

const SKILL_DIR = path.resolve(__dirname, '..');
const SKILL_ENV_PATH = path.resolve(SKILL_DIR, '.env');
dotenv.config({ path: SKILL_ENV_PATH });

export const LOGIN_URL            = process.env.LOGIN_URL || '';
export const LOGIN_USERNAME       = process.env.LOGIN_USERNAME || '';
export const LOGIN_PASSWORD        = process.env.LOGIN_PASSWORD || '';
export const LOGIN_WAIT_SELECTOR   = process.env.LOGIN_WAIT_SELECTOR || '';

const MAX_RETRIES = 5;
const AUTH_DIR    = path.resolve(SKILL_DIR, '..', '..', '.auth');
const MATCH_SCRIPT = path.resolve(SKILL_DIR, '..', 'playwright-mind', 'auto-login', 'match_slider.py');

// ─── 人类化滑动轨迹 ───────────────────────────────────────────────────────────

function getTracks(distance: number): number[] {
  const tracks: number[] = [];
  let current = 0;
  let v = 0;
  const t = 0.2;

  while (current < distance) {
    const a = current < distance * 5 / 8
      ? Math.floor(Math.random() * 5) + 1
      : -(Math.floor(Math.random() * 3) + 2);
    let move = Math.round(v * t + 0.5 * a * t * t);
    if (move === 0) { v += a * t; continue; }
    if (current + move > distance) move = distance - current;
    if (move <= 0) break;
    tracks.push(move);
    current += move;
    v += a * t;
  }
  return tracks;
}

// ─── Python OpenCV 匹配 ───────────────────────────────────────────────────────

function matchSliderDistance(bgBuf: Buffer, tpBuf: Buffer, yPos?: number): number {
  const bgPath  = path.join(AUTH_DIR, '_tmp_bg.png');
  const cutPath = path.join(AUTH_DIR, '_tmp_cut.png');
  fs.mkdirSync(AUTH_DIR, { recursive: true });
  fs.writeFileSync(bgPath, bgBuf);
  fs.writeFileSync(cutPath, tpBuf);

  const args = [MATCH_SCRIPT, '--bg', bgPath, '--cut', cutPath];
  if (yPos != null) args.push('--ypos', String(yPos));

  const result = spawnSync('python', args, { timeout: 15000, maxBuffer: 1024 * 1024 * 10 });

  if (result.stderr) {
    const errText = result.stderr.toString().trim();
    if (errText) console.log(errText);
  }

  if (result.status !== 0) {
    throw new Error(`Python 脚本退出码 ${result.status}：${result.stderr?.toString().slice(0, 200)}`);
  }

  const stdout = result.stdout?.toString().trim();
  const x = parseInt(stdout ?? '', 10);
  if (isNaN(x)) throw new Error(`Python 脚本输出无效：${stdout}`);

  console.log(`[slider] Python OpenCV 匹配结果：缺口 X=${x}px`);
  return x;
}

// ─── Playwright 鼠标分步拖动 ──────────────────────────────────────────────────

async function dragSlider(page: Page, distance: number): Promise<void> {
  const btn = page.locator('.slide-verify-slider-mask-item button').first();
  await btn.waitFor({ state: 'visible', timeout: 10000 });
  const box = await btn.boundingBox();
  if (!box) throw new Error('找不到滑块按钮 boundingBox');

  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;
  const tracks = getTracks(distance);

  console.log(`[slider] 开始拖动：距离=${distance}px，轨迹步数=${tracks.length}`);

  await page.mouse.move(startX, startY, { steps: 3 });
  await page.waitForTimeout(80 + Math.random() * 80);
  await page.mouse.down();
  await page.waitForTimeout(60 + Math.random() * 40);

  let curX = startX;
  for (const dx of tracks) {
    curX += dx;
    const curY = startY + (Math.random() * 6 - 3);
    await page.mouse.move(curX, curY, { steps: 1 });
    await page.waitForTimeout(16 + Math.random() * 24);
  }

  await page.waitForTimeout(200 + Math.random() * 200);
  await page.mouse.up();
  console.log('[slider] 拖动完成');
}

// ─── canvas 截图匹配（备选） ──────────────────────────────────────────────────

async function canvasMatchDistance(page: Page): Promise<number> {
  const canvasData = await page.evaluate(() => {
    const canvases = document.querySelectorAll('#slideVerify canvas');
    const bgCanvas = canvases[0] as HTMLCanvasElement;
    const tpCanvas = canvases[1] as HTMLCanvasElement;
    if (!bgCanvas || !tpCanvas) return null;

    const tpCtx = tpCanvas.getContext('2d')!;
    const tpData = tpCtx.getImageData(0, 0, tpCanvas.width, tpCanvas.height);
    let minX = tpCanvas.width, maxX = 0, minY = tpCanvas.height, maxY = 0;
    for (let y = 0; y < tpCanvas.height; y++) {
      for (let x = 0; x < tpCanvas.width; x++) {
        if (tpData.data[(y * tpCanvas.width + x) * 4 + 3] > 10) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    const cropW = maxX - minX + 1;
    const cropH = maxY - minY + 1;
    const tmp = document.createElement('canvas');
    tmp.width = cropW; tmp.height = cropH;
    tmp.getContext('2d')!.drawImage(tpCanvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);
    return {
      bg: bgCanvas.toDataURL('image/png').split(',')[1],
      tp: tmp.toDataURL('image/png').split(',')[1],
    };
  });
  if (!canvasData) throw new Error('canvas 截图失败');
  return matchSliderDistance(
    Buffer.from(canvasData.bg, 'base64'),
    Buffer.from(canvasData.tp, 'base64'),
  );
}

// ─── 接口拦截：getImgVerify ───────────────────────────────────────────────────

interface CaptchaData {
  imageId: string;
  bgBase64: string;
  cutBase64: string;
  yPos?: number;
}

async function interceptCaptchaData(page: Page): Promise<CaptchaData> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('等待 getImgVerify 接口超时（15s）')), 15000);

    page.on('response', async function handler(resp) {
      if (!resp.url().includes('getImgVerify')) return;
      try {
        const body = await resp.json() as Record<string, unknown>;
        clearTimeout(timeout);
        page.off('response', handler);

        const bgBase64  = (body.bgImage  || body.backgroundImage || body.bg || body.targetImage || '') as string;
        const cutBase64 = (body.cutImage || body.sliderImage     || body.cut || '') as string;
        const imageId   = (body.imageId  || '') as string;
        const yPos      = body.yPosition != null ? Number(body.yPosition) : undefined;

        console.log(`[captcha] getImgVerify 响应：imageId=${imageId}, bgLen=${bgBase64.length}, cutLen=${cutBase64.length}`);

        if (bgBase64 && process.env.DEBUG_CAPTCHA) {
          fs.mkdirSync(AUTH_DIR, { recursive: true });
          fs.writeFileSync(path.join(AUTH_DIR, 'debug_bg.png'), Buffer.from(bgBase64, 'base64'));
          fs.writeFileSync(path.join(AUTH_DIR, 'debug_cut.png'), Buffer.from(cutBase64, 'base64'));
        }

        resolve({ imageId, bgBase64, cutBase64, yPos });
      } catch (e) {
        clearTimeout(timeout);
        reject(e);
      }
    });
  });
}

// ─── 综合滑块求解 ─────────────────────────────────────────────────────────────

async function solveSlider(
  page: Page,
  attempt: number,
  captchaData: CaptchaData | null,
): Promise<{ success: boolean; xPosition?: number }> {
  await page.locator('#slideVerify').waitFor({ state: 'visible', timeout: 15000 });
  await page.waitForTimeout(800);

  let distance: number;

  if (captchaData && captchaData.bgBase64 && captchaData.cutBase64) {
    console.log(`[slider] 第${attempt}次：接口图片 + Python OpenCV 匹配`);
    try {
      const bgBuf = Buffer.from(captchaData.bgBase64, 'base64');
      const tpBuf = Buffer.from(captchaData.cutBase64, 'base64');
      const imgPixelX = matchSliderDistance(bgBuf, tpBuf, captchaData.yPos);
      if (imgPixelX < 5 || imgPixelX > 290) throw new Error(`匹配距离 ${imgPixelX}px 超出合理范围`);

      const scaleInfo = await page.evaluate(() => {
        const canvases = document.querySelectorAll('#slideVerify canvas');
        const bgCanvas = canvases[0] as HTMLCanvasElement;
        if (!bgCanvas) return null;
        return { cssWidth: bgCanvas.clientWidth, pixelWidth: bgCanvas.width };
      });
      const scale = scaleInfo ? scaleInfo.cssWidth / scaleInfo.pixelWidth : 1;
      console.log(`[slider] canvas CSS=${scaleInfo?.cssWidth}px, pixel=${scaleInfo?.pixelWidth}px, scale=${scale.toFixed(3)}`);

      distance = Math.round(imgPixelX * scale) + 10;
      console.log(`[slider] 最终拖动距离（+10px 补偿）：${distance}px`);
    } catch (err) {
      console.warn(`[slider] Python 失败（${(err as Error).message}），降级到 canvas 截图`);
      distance = await canvasMatchDistance(page);
    }
  } else if (attempt <= 2) {
    console.log(`[slider] 第${attempt}次：canvas 像素匹配`);
    distance = await canvasMatchDistance(page);
  } else {
    console.log(`[slider] 第${attempt}次：使用固定距离 130px`);
    distance = 130;
  }

  await dragSlider(page, distance);

  let xPosition: number | undefined;
  try {
    const checkResp = await page.waitForResponse(
      r => r.url().includes('checkImgVerify'), { timeout: 5000 }
    );
    const body = await checkResp.json() as Record<string, unknown>;
    console.log(`[slider] checkImgVerify 响应：${JSON.stringify(body).slice(0, 200)}`);
    const data = body.data as Record<string, unknown> | undefined;
    if (data?.xPosition != null) {
      xPosition = Number(data.xPosition);
      console.log(`[slider] 服务端透漏正确 xPosition=${xPosition}`);
    }
  } catch {}

  try {
    await page.waitForURL(url => url.href.includes('login=true'), { timeout: 5000 });
  } catch {}

  const currentUrl = page.url();
  console.log(`[slider] 验证后当前 URL：${currentUrl}`);
  const success = currentUrl.includes('login=true');
  return { success, xPosition: success ? undefined : xPosition };
}

// ─── 登录页导航 ───────────────────────────────────────────────────────────────

async function gotoLoginPage(page: Page, url: string): Promise<void> {
  const targetHash = new URL(url).hash;

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  } catch {
    console.log('[goto] goto 超时，继续等待...');
  }
  console.log(`[goto] 目标 URL：${url}`);

  console.log('[goto] 等待 WAF 挑战完成（unsaFpAV7iKf 消失）...');
  try {
    await page.waitForFunction(
      () => !window.location.href.includes('unsaFpAV7iKf'),
      { timeout: 60000, polling: 500 },
    );
    console.log(`[goto] ✓ WAF 挑战完成，URL：${page.url()}`);
  } catch {
    console.warn(`[goto] WAF 60s 未完成，URL：${page.url()}，继续...`);
  }

  const currentHash = new URL(page.url()).hash;
  if (currentHash !== targetHash) {
    console.log(`[goto] WAF 改变了 hash（${currentHash} → ${targetHash}），重新导航...`);
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      console.log(`[goto] ✓ 重新导航完成，URL：${page.url()}`);
    } catch {
      console.log('[goto] 重新导航超时，继续...');
    }
  }

  try {
    await page.waitForSelector(
      'input[type="password"], input[placeholder*="密码"]',
      { timeout: 30000, state: 'visible' },
    );
    console.log('[goto] ✓ 登录表单已加载');
  } catch {
    throw new Error(`[goto] 登录表单未出现（30s），当前 URL：${page.url()}`);
  }
}

// ─── 主登录函数 ───────────────────────────────────────────────────────────────

export interface PerformLoginOptions {
  loginUrl?: string;
  username?: string;
  password?: string;
  tag?: string;
}

export async function performLogin(
  page: Page,
  options: PerformLoginOptions = {},
): Promise<void> {
  const url      = options.loginUrl  ?? LOGIN_URL;
  const username = options.username  ?? LOGIN_USERNAME;
  const password = options.password  ?? LOGIN_PASSWORD;
  const tag      = options.tag       ?? '[login]';

  await gotoLoginPage(page, url);

  await page.fill('#userCode', username);
  await page.fill('#pwd', password);
  console.log(`${tag} 账号密码填写完成`);

  const captchaPromise = interceptCaptchaData(page).catch(() => null);

  const loginBtn = page.locator('#formLogin button[type="submit"]');
  const count = await loginBtn.count();
  if (count > 0) {
    await loginBtn.first().click();
  } else {
    await page.click('button:has-text("登录")');
  }

  let captchaData = await captchaPromise;
  let loginSuccess = false;
  let knownXPosition: number | undefined;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    console.log(`${tag} 第 ${attempt}/${MAX_RETRIES} 次尝试...`);

    if (knownXPosition != null) {
      console.log(`[slider] 第${attempt}次：使用服务端 xPosition=${knownXPosition} 精确拖动`);
      try {
        await page.locator('#slideVerify').waitFor({ state: 'visible', timeout: 10000 });
        await dragSlider(page, knownXPosition);
        try {
          await page.waitForURL(url => url.href.includes('login=true'), { timeout: 5000 });
        } catch {}
        loginSuccess = page.url().includes('login=true');
      } catch (err) {
        console.log(`${tag} ✗ 第 ${attempt} 次异常：${(err as Error).message?.split('\n')[0]}`);
        loginSuccess = false;
      }
    } else {
      try {
        const result = await solveSlider(page, attempt, captchaData);
        loginSuccess = result.success;
        if (!loginSuccess && result.xPosition != null) {
          knownXPosition = result.xPosition;
        }
      } catch (err) {
        console.log(`${tag} ✗ 第 ${attempt} 次异常：${(err as Error).message?.split('\n')[0]}`);
        loginSuccess = false;
      }
    }

    if (loginSuccess) {
      if (LOGIN_WAIT_SELECTOR) {
        console.log(`${tag} 等待目标元素出现：${LOGIN_WAIT_SELECTOR}`);
        try {
          await page.waitForSelector(LOGIN_WAIT_SELECTOR, { state: 'visible', timeout: 30000 });
          console.log(`${tag} ✓ 目标元素已出现，登录完成`);
        } catch {
          console.warn(`${tag} ⚠ 等待目标元素超时（30s），当前 URL：${page.url()}，继续执行`);
        }
      } else {
        console.log(`${tag} ✓ 第 ${attempt} 次成功，登录完成`);
      }
      return;
    }

    console.log(`${tag} ✗ 第 ${attempt} 次失败`);

    if (attempt < MAX_RETRIES) {
      captchaData = null;
      knownXPosition = undefined;
      const nextCaptchaPromise = interceptCaptchaData(page).catch(() => null);
      try {
        await page.locator('.slide-verify-refresh-icon').click();
        console.log(`${tag} 已刷新验证码`);
      } catch {
        console.log(`${tag} 未找到刷新按钮，尝试重新点登录`);
        try {
          const btn = page.locator('#formLogin button[type="submit"]');
          if (await btn.count() > 0) {
            await btn.first().click();
          } else {
            await page.click('button:has-text("登录")');
          }
        } catch {}
      }
      await page.waitForTimeout(1500);
      captchaData = await nextCaptchaPromise;
    }
  }

  throw new Error(`${tag} 自动登录失败，已重试 ${MAX_RETRIES} 次`);
}