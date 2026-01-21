import * as cheerio from "cheerio";
import fetch from "node-fetch";

async function debug() {
  console.log("Fetching https://mr-farmer.jp/ ...");
  try {
    const res = await fetch("https://mr-farmer.jp/");
    const html = await res.text();
    const $ = cheerio.load(html);

    console.log("--- Title ---");
    console.log($("title").text());

    console.log("--- H1-H3 Tags ---");
    $("h1, h2, h3").each((i, el) =>
      console.log($(el).prop("tagName"), $(el).text().trim()),
    );

    console.log("--- Body Text Preview (First 2000 chars) ---");
    const text = $("body").text().replace(/\s+/g, " ").trim();
    console.log(text.substring(0, 2000));

    console.log("--- Image Check ---");
    $("img")
      .slice(0, 20)
      .each((i, el) => {
        const alt = $(el).attr("alt") || "NO_ALT";
        const src = $(el).attr("src") || "NO_SRC";
        console.log(
          `[IMG] Alt: ${alt.substring(0, 30)}, Src: ${src.substring(0, 50)}`,
        );
      });

    console.log("--- PDF Link Check ---");
    $("a[href$='.pdf']").each((i, el) => {
      console.log(`[PDF] Text: ${$(el).text()}, Href: ${$(el).attr("href")}`);
    });

    console.log("--- Menu Link Check ---");
    $("a").each((i, el) => {
      const t = $(el).text();
      if (t.match(/menu|メニュー/i)) {
        console.log(`[MENU-LINK] Text: ${t}, Href: ${$(el).attr("href")}`);
      }
    });

    console.log("--- Price Pattern Check ---");
    const priceMatches = text.match(/([¥￥]?\s*(\d{1,3}(,\d{3})*|\d+)\s*円?)/g);
    console.log(
      "Price matches found:",
      priceMatches ? priceMatches.slice(0, 10) : "None",
    );
  } catch (e) {
    console.error(e);
  }
}

debug();
