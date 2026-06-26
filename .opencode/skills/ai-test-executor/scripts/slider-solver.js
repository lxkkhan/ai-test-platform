/**
 * slider-solver.js
 * 滑块验证码自动求解器，从 perform-login-lite.ts 提取
 * 供所有 Skill 共享使用。依赖 Python + OpenCV。
 */
const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');

const AUTH_DIR = path.resolve(__dirname, '..', '..', '..', '..', '.auth');
const MATCH_SCRIPT = path.resolve(__dirname, '..', '..', 'playwright-mind', 'auto-login', 'match_slider.py');

function getTracks(distance) {
  const tracks = [];
  let current = 0, v = 0, t = 0.2;
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

function matchSliderDistance(bgBuf, tpBuf, yPos) {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
  const bgPath = path.join(AUTH_DIR, '_tmp_bg.png');
  const cutPath = path.join(AUTH_DIR, '_tmp_cut.png');
  fs.writeFileSync(bgPath, bgBuf);
  fs.writeFileSync(cutPath, tpBuf);

  const args = [MATCH_SCRIPT, '--bg', bgPath, '--cut', cutPath];
  if (yPos != null) args.push('--ypos', String(yPos));

  const result = spawnSync('python', args, { timeout: 15000, maxBuffer: 1024 * 1024 * 10 });
  if (result.status !== 0) {
    throw new Error(`Python 滑块匹配失败: ${result.stderr?.toString().slice(0, 200)}`);
  }
  const x = parseInt(result.stdout?.toString().trim(), 10);
  if (isNaN(x)) throw new Error(`Python 输出无效: ${result.stdout?.toString().trim()}`);
  return x;
}

async function dragSlider(page, distance) {
  const btn = page.locator('.slide-verify-slider-mask-item button').first();
  await btn.waitFor({ state: 'visible', timeout: 10000 });
  const box = await btn.boundingBox();
  if (!box) throw new Error('找不到滑块');

  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;
  const tracks = getTracks(distance);

  await page.mouse.move(startX, startY, { steps: 3 });
  await page.waitForTimeout(80 + Math.random() * 80);
  await page.mouse.down();
  await page.waitForTimeout(60 + Math.random() * 40);

  let curX = startX;
  for (const dx of tracks) {
    curX += dx;
    await page.mouse.move(curX, startY + (Math.random() * 6 - 3), { steps: 1 });
    await page.waitForTimeout(16 + Math.random() * 24);
  }
  await page.waitForTimeout(200 + Math.random() * 200);
  await page.mouse.up();
}

async function interceptCaptchaData(page) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('等待验证码接口超时')), 15000);
    page.on('response', async function handler(resp) {
      if (!resp.url().includes('getImgVerify')) return;
      try {
        const body = await resp.json();
        clearTimeout(timeout);
        page.off('response', handler);
        const bgBase64 = body.bgImage || body.backgroundImage || body.bg || body.targetImage || '';
        const cutBase64 = body.cutImage || body.sliderImage || body.cut || '';
        const imageId = body.imageId || '';
        const yPos = body.yPosition != null ? Number(body.yPosition) : undefined;
        resolve({ imageId, bgBase64, cutBase64, yPos });
      } catch (e) { reject(e); }
    });
  });
}

async function solveSlider(page, captchaData) {
  if (!captchaData) {
    captchaData = await interceptCaptchaData(page).catch(() => null);
  }
  await page.locator('#slideVerify').waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(800);

  let distance;
  if (captchaData && captchaData.bgBase64 && captchaData.cutBase64) {
    const bgBuf = Buffer.from(captchaData.bgBase64, 'base64');
    const tpBuf = Buffer.from(captchaData.cutBase64, 'base64');
    const imgPixelX = matchSliderDistance(bgBuf, tpBuf, captchaData.yPos);
    const scaleInfo = await page.evaluate(() => {
      const c = document.querySelector('#slideVerify canvas');
      return c ? { cssWidth: c.clientWidth, pixelWidth: c.width } : null;
    });
    const scale = scaleInfo ? scaleInfo.cssWidth / scaleInfo.pixelWidth : 1;
    distance = Math.round(imgPixelX * scale) + 10;
  } else {
    // Fallback: fixed distance
    distance = 130;
  }

  await dragSlider(page, distance);
  await page.waitForTimeout(2000);
  return page.url().includes('login=true');
}

module.exports = { solveSlider, interceptCaptchaData, dragSlider, matchSliderDistance };
