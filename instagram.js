const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

function randomDelay(min = 20, max = 80) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function humanType(page, selector, text) {
  await page.waitForSelector(selector, { timeout: 30000 });
  await page.click(selector);
  for (const char of text) {
    await page.keyboard.type(char, { delay: randomDelay() });
  }
}

async function clickFirst(page, selectors) {
  for (const selector of selectors) {
    const el = await page.$(selector);
    if (el) {
      await el.click();
      return selector;
    }
  }
  throw new Error(`لم أجد أي زر مطابق: ${selectors.join(' | ')}`);
}

async function clickButtonByText(page, labels) {
  const clicked = await page.evaluate((texts) => {
    const targets = Array.from(document.querySelectorAll('button, div[role="button"]'));
    const lower = texts.map(t => t.toLowerCase());
    const node = targets.find(el => {
      const value = (el.innerText || el.textContent || '').trim().toLowerCase();
      return lower.some(t => value.includes(t));
    });
    if (node) {
      node.click();
      return true;
    }
    return false;
  }, labels);

  if (!clicked) {
    throw new Error(`لم أجد زر بالنص: ${labels.join(' | ')}`);
  }
}

async function openInstagramAndCreatePost(postText = process.env.POST_TEXT || 'منشور تجريبي من السكربت') {
  const browser = await puppeteer.launch({
    headless: false,
    userDataDir: './instagram-session',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--start-maximized']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });
    await page.goto('https://www.instagram.com/', { waitUntil: 'domcontentloaded', timeout: 45000 });

    await page.waitForTimeout(randomDelay(1500, 3000));

    // فتح نافذة إنشاء منشور (قد يتطلب صورة ليكتمل النشر)
    await clickFirst(page, [
      'svg[aria-label="New post"]',
      'svg[aria-label="منشور جديد"]'
    ]).catch(() => clickButtonByText(page, ['create', 'new post', 'إنشاء']));

    await page.waitForTimeout(randomDelay(1200, 2500));

    // كتابة الكابشن - يتطلب غالبًا رفع صورة أولاً
    await humanType(
      page,
      'textarea[aria-label*="Write a caption"], textarea[aria-label*="اكتب شرحًا"]',
      postText
    ).catch(() => null);

    // زر Share إن كان متاحًا
    await clickButtonByText(page, ['share', 'مشاركة']).catch(() => {
      console.log('زر Share غير متاح الآن (غالبًا يلزم رفع صورة يدويًا).');
    });

    console.log('تمت محاولة إضافة المنشور على Instagram (قد يلزم رفع صورة يدويًا).');
    return { browser, page };
  } catch (error) {
    console.error('فشل نشر Instagram:', error.message);
    await browser.close();
    throw error;
  }
}

module.exports = { openInstagramAndCreatePost };

if (require.main === module) {
  openInstagramAndCreatePost().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
