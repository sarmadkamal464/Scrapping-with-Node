const URL = require("./urls.js");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

puppeteer.use(StealthPlugin());

async function start() {
  try {
    const browser = await puppeteer.launch({
      headless: false,
      channel: "chrome",
      args: [`--proxy-server=http://80.92.206.140:30207`],
    });

    const page = await browser.newPage();

    for (let i = 0; i < 1; i++) {
      let cookies = await page.cookies();
      for (let cookie of cookies) {
        await page.deleteCookie(cookie);
      }

      const HTTPResponse = await page.goto(URL[i], {
        waitUntil: "load",
        waitUntil: "domcontentloaded",
        waitUntil: "networkidle2",
        timeout: 1000 * 120,
      });

      const status = await HTTPResponse.status();
      const title = await page.title();

      if (!title || status != 200) {
        await page.waitForTimeout(1000 * 15);
        i--;
        continue;
      }

      let selector;

      try {
        selector = ".ds-close-lightbox-icon.hc-back-to-list";
        await page.waitForSelector(selector);
        await page.hover(selector);
        await page.click(selector, {
          delay: 500,
          clickCount: 2,
        });
        await page.waitForTimeout(5000);
      } catch (error) {
        console.log(error.message);
      }

      try {
        selector =
          ".PaginationReadoutItem-c11n-8-85-1__sc-18an4gi-0.blgxcD span";
        const pagination = await page.$eval(selector, (el) => {
          const text = el.innerText;
          if (text) {
            return text.split(" ");
          }
          return [];
        });
        let current_page = (total_pages = 0);
        if (pagination.length == 4) {
          current_page = +pagination[1];
          total_pages = +pagination[3];
        }

        selector = ".PaginationList-c11n-8-85-1__sc-14rlw6v-0.dVmjCE";
        for (; current_page <= total_pages; current_page++) {
          await page.waitForTimeout(5000);
          await page.waitForSelector(selector);
          await page.$eval(selector, (el) => {
            el.scrollIntoView();
            return new Promise((resolve) =>
              setTimeout(() => {
                el.lastChild.firstChild.click();
                resolve();
              }, 5000)
            );
          });
        }
      } catch (error) {
        console.log(error.message);
        await page.waitForTimeout(5000);
        i--;
        continue;
      }
    }
    await page.close();
    await browser.close();
  } catch (err) {
    console.log(err.message);
  }
}

start();
