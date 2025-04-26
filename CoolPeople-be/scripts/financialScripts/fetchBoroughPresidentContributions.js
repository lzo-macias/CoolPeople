const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  const downloadPath = path.resolve(__dirname, 'downloads');
  const finalPath = path.resolve(__dirname, '../data/2025_BoroughPresidentContributions.csv');

  if (!fs.existsSync(downloadPath)) fs.mkdirSync(downloadPath);
  if (!fs.existsSync(path.dirname(finalPath))) fs.mkdirSync(path.dirname(finalPath), { recursive: true });

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  const client = await page.target().createCDPSession();
  await client.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: downloadPath,
  });

  await page.goto('https://www.nyccfb.info/FTMSearch/Candidates/Contributions?ec=2025&rt=can&ofc=4%2C44', {
    waitUntil: 'networkidle2',
  });

  await new Promise(res => setTimeout(res, 1000)); // let UI settle

  await page.evaluate(() => {
    document.getElementById('exportToExcel').click();
  });

  const waitForDownload = async () => {
    const timeout = 20000;
    const pollingInterval = 500;
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const files = fs.readdirSync(downloadPath).filter(f =>
        f.endsWith('.csv') || f.endsWith('.xls') || f.endsWith('.xlsx')
      );
      if (files.length > 0) return path.join(downloadPath, files[0]);
      await new Promise(res => setTimeout(res, pollingInterval));
    }
    throw new Error('⛔️ Download timed out.');
  };

  const downloadedFile = await waitForDownload();

  // Rename and move to final path
  fs.renameSync(downloadedFile, finalPath);

  console.log(`✅ Saved as ${finalPath}`);

  await browser.close();
})();
