import * as cheerio from "cheerio";
import fetch from "node-fetch";

async function debug() {
  console.log("Fetching https://soystories.jp/ ...");
  try {
    const res = await fetch("https://soystories.jp/");
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
