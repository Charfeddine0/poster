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

    const targetUrl = process.env.FACEBOOK_GROUP_URL || 'https://www.facebook.com/groups/1772001620156113';
    console.log('الذهاب للمجموعة...');
    await page.goto(targetUrl, { waitUntil: 'networkidle2' });

    // الخطوة 1: فتح composer
    await page.waitForSelector('span', { timeout: 45000 });
    const clickedComposer = await page.evaluate(() => {
      const trigger = Array.from(document.querySelectorAll('span')).find(
        el => el.textContent?.trim() === 'Quoi de neuf, Confort ?'
      );

      if (trigger) {
        trigger.click();
        return true;
      }

      return false;
    });

    if (!clickedComposer) {
      throw new Error('لم أجد زر فتح الناشر Quoi de neuf, Confort ?');
    }

    await page.waitForTimeout(randomDelay(1800, 4200));

    // الخطوة 2: اختيار النشر المجهول
    await page.evaluate(() => {
      const anonymousButton = Array.from(document.querySelectorAll('span')).find(
        el => el.textContent?.trim() === 'Envoyer une publication anonyme…'
      );
      anonymousButton?.click();
    });

    await page.waitForTimeout(randomDelay(1200, 2600));

    // الخطوة 3/4: كتابة النص
    await humanType(
      page,
      'div[contenteditable="true"][aria-placeholder="Envoyer une publication anonyme…"], [role="textbox"][contenteditable="true"]',
      content
    );

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

    // الخطوة 5: النقر على "Envoyer"
    console.log('جاري النشر...');
    const clickedPublish = await page.evaluate(() => {
      const sendSpan = Array.from(document.querySelectorAll('span')).find(
        el => el.textContent?.trim() === 'Envoyer'
      );

      if (!sendSpan) {
        return false;
      }

      const buttonRoot = sendSpan.closest('div[role="none"]');
      if (buttonRoot) {
        buttonRoot.click();
        return true;
      }

      const nearestButtonLike = sendSpan.closest('[role="button"], button, div');
      nearestButtonLike?.click();
      return true;
    });

    if (!clickedPublish) {
      throw new Error('لم أجد زر Envoyer لإرسال المنشور');
    }

    await page.waitForTimeout(randomDelay(...config.AFTER_CLICK_PUBLISH_WAIT));

    console.log('تم المحاولة → يُفترض النشر (تحقق يدوياً أول مرات)');

  } catch (err) {
    console.error('نشر خطأ:', err.message);
  } finally {
    await browser.close();
  }
}

module.exports = { postToFacebook };
