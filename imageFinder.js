const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const fs = require('fs-extra');
const path = require('path');

async function findAndDownloadImage(title, targetFolder) {
  const query = encodeURIComponent(title + " high resolution");
  const url = `https://www.google.com/search?q=${query}&tbm=isch&tbs=isz:l`;

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36');
    await page.goto(url, { waitUntil: 'networkidle2' });

    await page.waitForSelector('img[alt][src^="https://"]', { timeout: 12000 });

    const imgSrc = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img[src^="https://encrypted-tbn"], img[src^="https://"]'));
      const good = imgs.find(i => (i.naturalWidth || 0) > 400 && (i.naturalHeight || 0) > 300);
      return good ? good.src : null;
    });

    if (!imgSrc) throw new Error("No suitable image");

    const viewPage = await browser.newPage();
    const response = await viewPage.goto(imgSrc, { waitUntil: 'networkidle0' });
    const buffer = await response.buffer();

    const ext = imgSrc.endsWith('.png') ? '.png' : '.jpg';
    const imgPath = path.join(targetFolder, `featured${ext}`);
    await fs.writeFile(imgPath, buffer);

    return imgPath;

  } catch (e) {
    console.error('Image error:', e.message);
    return null;
  } finally {
    await browser.close();
  }
}

module.exports = { findAndDownloadImage };