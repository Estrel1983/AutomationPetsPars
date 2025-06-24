const puppeteer = require('puppeteer');
const InstagramStats = require('./InstagramStats');

async function getInst(username, password, targetChannel) {
  const browser = await puppeteer.launch({
    headless: true, // без окна
    args: ['--no-sandbox', '--disable-setuid-sandbox','--disable-blink-features=AutomationControlled',
    '--disable-dev-shm-usage']
  });

  const page = await browser.newPage();
    console.log("creating new page");
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36');
  console.log("going to instagram");
  await page.goto('https://www.instagram.com/');
  const title = await page.title();
  console.log("Trying to login");

  //login
  await page.waitForSelector('input[name="username"]');
  console.log("w8 for username");
  await page.waitForSelector('input[name="password"]');
  console.log("w8 for password");
  await page.type('input[name="username"]', username, {delay: 100});
  console.log("Typing username like " + username);
  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log("w8 for typing password");
  await page.type('input[name="password"]', password, {delay: 100});
  console.log("Typing password like " + password);
  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log("log before submiting");
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ timeout: 15000 }).catch(() => {
  console.log('Navigation timeout — fallback to manual wait');
});
//   await Promise.all([
//   page.click('button[type="submit"]'),
//   page.waitForNavigation({ waitUntil: 'networkidle2' }),
// ]);
  console.log("submiting login");

  await page.waitForSelector('button');

  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.innerText, btn);
    if (text.trim() === 'Save info') {
      console.log("Save button pressed");
      await btn.click();
      break;
    }
  }
  
  await new Promise(resolve => setTimeout(resolve, 10000));
  const postStat = await getPostDates(page, targetChannel);
  const reelsStat = await getReelsDatas(page, targetChannel +'reels/');
  await browser.close();
  const instStats = new InstagramStats(postStat, reelsStat);
  return instStats;
}

async function getPostDates(page, link) {
  console.log("in getPostDates " + link);
  await page.goto(link, { timeout: 60000 });
  await new Promise(resolve => setTimeout(resolve, 1000));
  for (let i = 0; i < 5; i++) {
    await page.evaluate(() => {
      window.scrollBy(0, window.innerHeight);
    });
    await new Promise(resolve => setTimeout(resolve, 500));
  };
  await new Promise(resolve => setTimeout(resolve, 10000));
  const data = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('a[href*="/reel/"]'));
    return items.map(a => {
      const img = a.querySelector('img');
      return {
        href: a.href,
        imgSrc: img?.src || null,
        alt: img?.alt || '',
      };
    });
  });
  const hrefArray = data.map(item => item.href);
  
  return hrefArray;
}

async function getReelsDatas(page, link){
  await page.goto(link, { timeout: 60000 });
  await new Promise(resolve => setTimeout(resolve, 1000));
  for (let i = 0; i < 5; i++) {
    await page.evaluate(() => {
      window.scrollBy(0, window.innerHeight);
    });
    await new Promise(resolve => setTimeout(resolve, 500));
  };
  await new Promise(resolve => setTimeout(resolve, 10000));
  const reelsData = await page.$$eval('a[href*="/reel/"]', anchors => {
    return anchors.map(a => {
      // ссылка
      const href = a.getAttribute('href');

      // поиск span с количеством просмотров внутри (с классом html-span)
      const viewsSpan = Array.from(a.querySelectorAll('span')).find(el =>
      /^\d+([.,]?\d+)?[KM]?$/.test(el.textContent.trim())
    );
      const views = viewsSpan ? viewsSpan.textContent.trim() : null;
      return {href, views};
    });
  });
  console.log(reelsData);
  return reelsData;
}

console.log('Экспортируем:', { getInst });
module.exports = { getInst };