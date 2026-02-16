const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const config = require('./config');
const fs = require('fs-extra');

function randomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function humanType(page, selector, text) {
  await page.waitForSelector(selector);
  await page.click(selector);
  for (const char of text) {
    await page.keyboard.type(char, { delay: randomDelay(config.TYPE_DELAY_MIN, config.TYPE_DELAY_MAX) });
  }
}

async function postToFacebook(content, imagePath = null) {
  const browser = await puppeteer.launch({
    headless: false,               // غيّر إلى false أول مرة لتسجيل الدخول
    userDataDir: './fb-session',  // يحفظ الجلسة
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-blink-features=AutomationControlled",
          "--start-maximized",
          "--disable-web-security",
          "--disable-features=IsolateOrigins,site-per-process",
          "--disable-infobars",
          "--window-size=1366,768",
          "--disable-extensions-except",
          "--disable-dev-shm-usage",
          "--disable-gpu",
          "--disable-software-rasterizer",
          "--ignore-certificate-errors",
          "--disable-features=TranslateUI",
          "--metrics-recording-only",
          "--disable-default-apps",
          "--mute-audio"
        ]
  });

  try {
    const page = await browser.newPage();
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'ar,en-US;q=0.9' });
    await page.setViewport({ width: 1366, height: 768 });

    console.log('فتح فيسبوك...');
    await page.goto('https://www.facebook.com', { waitUntil: 'networkidle2', timeout: 45000 });

    await page.waitForTimeout(randomDelay(3000, 7000));

    console.log('الذهاب للصفحة...');
    await page.goto(config.FACEBOOK_PAGE_URL, { waitUntil: 'networkidle2' });

    // فتح صندوق المنشور
    const createPostSel = [
      '[aria-label="ما الذي يدور في بالك؟"]',
      '[aria-label="أنشئ منشورًا"]',
      '[role="button"][aria-label*="post"]'
    ].join(',');

    await page.waitForSelector(createPostSel, { timeout: 45000 });
    await page.click(createPostSel);

    await page.waitForTimeout(randomDelay(1800, 4200));

    // كتابة النص بشكل بشري
    await humanType(page, '[role="textbox"][contenteditable="true"]', content);

    await page.waitForTimeout(randomDelay(...config.AFTER_TYPE_WAIT));

    // رفع صورة إذا وُجدت
    if (imagePath && await fs.pathExists(imagePath)) {
      const input = await page.$('input[type="file"][accept*="image"]');
      if (input) {
        await input.uploadFile(imagePath);
        console.log('جاري رفع الصورة...');
        await page.waitForTimeout(randomDelay(...config.AFTER_UPLOAD_WAIT));
      }
    }

    // النقر على "نشر"
    console.log('جاري النشر...');
    const publishBtnSel = [
      'div[aria-label="نشر"]:not([aria-disabled="true"])',
      'div[aria-label="Post"]:not([aria-disabled="true"])',
      '[role="button"][aria-label*="نشر"]'
    ].join(',');

    const btn = await page.waitForSelector(publishBtnSel, { visible: true, timeout: 20000 });
    await page.evaluate(el => el.click(), btn);

    await page.waitForTimeout(randomDelay(...config.AFTER_CLICK_PUBLISH_WAIT));

    console.log('تم المحاولة → يُفترض النشر (تحقق يدوياً أول مرات)');

  } catch (err) {
    console.error('نشر خطأ:', err.message);
  } finally {
    await browser.close();
  }
}

module.exports = { postToFacebook };