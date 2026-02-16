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

async function openLinkedInAndCreatePost(postText = process.env.POST_TEXT || 'منشور تجريبي من السكربت') {
  const browser = await puppeteer.launch({
    headless: false,
    userDataDir: './linkedin-session',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--start-maximized']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });
    await page.goto('https://www.linkedin.com/feed/', { waitUntil: 'domcontentloaded', timeout: 45000 });

    await page.waitForTimeout(randomDelay(1500, 3000));

    // فتح نافذة إنشاء منشور
    await clickFirst(page, [
      'button[aria-label*="Start a post"]',
      'button[aria-label*="ابدأ منشورًا"]',
      'button.share-box-feed-entry__trigger'
    ]);

    await page.waitForTimeout(randomDelay(1200, 2500));

    // كتابة النص
    await humanType(page, 'div[role="textbox"]', postText);

    await page.waitForTimeout(randomDelay(1200, 2500));

    // زر Post
    await clickFirst(page, [
      'button.share-actions__primary-action',
      'button[aria-label="Post"]',
      'button[aria-label="نشر"]'
    ]);

    console.log('تمت محاولة إضافة المنشور على LinkedIn.');
    return { browser, page };
  } catch (error) {
    console.error('فشل نشر LinkedIn:', error.message);
    await browser.close();
    throw error;
  }
}

module.exports = { openLinkedInAndCreatePost };

if (require.main === module) {
  openLinkedInAndCreatePost().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
