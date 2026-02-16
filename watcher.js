const chokidar = require('chokidar');
const fs = require('fs-extra');
const path = require('path');
const config = require('./config');

async function processNewFolder(folderPath) {
  if (folderPath === config.POST_FOLDER) return;

  try {
    const files = await fs.readdir(folderPath);
    const txtFile = files.find(f => f.toLowerCase().endsWith('.txt'));
    if (!txtFile) return;

    const txtPath = path.join(folderPath, txtFile);
    const content = (await fs.readFile(txtPath, 'utf-8')).trim();
    const titleForImage = path.basename(txtFile, '.txt')
      .replace(/-/g, ' ')
      .replace(/_/g, ' ')
      .trim();

    const processingDir = path.join(config.PROCESSING_FOLDER, path.basename(folderPath));
    await fs.move(folderPath, processingDir, { overwrite: true });

    console.log(`Processing → ${titleForImage}`);

    const main = require('./main');
    await main.handlePost({ title: titleForImage, content, folder: processingDir });

  } catch (err) {
    console.error('Watcher error:', err.message);
  }
}

function startWatcher() {
  console.log(`Watching → ${config.POST_FOLDER}`);
  chokidar.watch(config.POST_FOLDER, {
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 2000 }
  }).on('addDir', p => setTimeout(() => processNewFolder(p), 2500));
}

module.exports = { startWatcher };