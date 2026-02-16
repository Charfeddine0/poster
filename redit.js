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

async function openRedditAndCreatePost(postText = process.env.POST_TEXT || 'منشور تجريبي من السكربت') {
  const browser = await puppeteer.launch({
    headless: false,
    userDataDir: './reddit-session',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--start-maximized']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });
    await page.goto('https://www.reddit.com/r/petfood01/submit/?type=TEXT', {
      waitUntil: 'domcontentloaded',
      timeout: 45000
    });

    await page.waitForTimeout(randomDelay(1500, 3000));

    // عنوان المنشور
    await humanType(page, '#innerTextArea, textarea[name="title"]', `Post ${Date.now()}`);

    // اختيار نوع Text post
    await clickFirst(page, [
      'button[id*="-post-type-text"]',
      'button[aria-label*="Text"]',
      'button[role="tab"][id*="text"]'
    ]).catch(() => null);

    // نص المنشور
    await humanType(page, 'div[slot="rte"][name="body"][contenteditable="true"], div[contenteditable="true"]', postText);

    // محاكاة النقر على زر Post
    await page.waitForTimeout(randomDelay(1200, 2500));
    await clickFirst(page, [
      '#inner-post-submit-button',
      'button[type="submit"]',
      'button[data-testid="post-submit-button"]',
      'button[aria-label="Post"]'
    ]);

    console.log('تمت محاولة إضافة المنشور على Reddit.');
    return { browser, page };
  } catch (error) {
    console.error('فشل نشر Reddit:', error.message);
    await browser.close();
    throw error;
  }
}

module.exports = { openRedditAndCreatePost };

if (require.main === module) {
  openRedditAndCreatePost().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
