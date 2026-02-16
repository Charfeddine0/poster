const watcher = require('./watcher');
const { findAndDownloadImage } = require('./imageFinder');
const { postToFacebook } = require('./facebookPoster');
const fs = require('fs-extra');
const path = require('path');
const config = require('./config');

async function handlePost({ title, content, folder }) {
  try {
    const imagePath = await findAndDownloadImage(title, folder);
    await postToFacebook(content, imagePath);

    const publishedDir = path.join(config.PUBLISHED_FOLDER, path.basename(folder));
    await fs.move(folder, publishedDir, { overwrite: true });
    console.log(`تم نقل → ${publishedDir}`);
  } catch (err) {
    console.error('خطأ كلي:', err);
  }
}

async function start() {
  await Promise.all([
    fs.ensureDir(config.POST_FOLDER),
    fs.ensureDir(config.PROCESSING_FOLDER),
    fs.ensureDir(config.PUBLISHED_FOLDER),
    fs.ensureDir(config.LOGS_FOLDER)
  ]);

  console.log("Auto Publisher 2026 – تلقائي كامل");
  watcher.startWatcher();
}

start().catch(console.error);