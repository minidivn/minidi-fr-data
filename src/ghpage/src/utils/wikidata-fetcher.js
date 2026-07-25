/**
 * Wikidata & Wikipedia enrichment fetcher.
 */
import { extractGalleries, extractThumbs } from "./gallery-utils.js";

const CACHE = new Map();

export async function fetchWikidataEntity(id) {
  const cacheKey = "wd:" + id;
  if (CACHE.has(cacheKey)) return CACHE.get(cacheKey);
  try {
    const resp = await fetch(
      "https://www.wikidata.org/wiki/Special:EntityData/" + id + ".json",
    );
    if (!resp.ok) throw new Error("HTTP " + resp.status);
    const data = await resp.json();
    const entity = data.entities[id];
    if (!entity) throw new Error("Entity not found");
    const result = {
      labels: entity.labels || {},
      descriptions: entity.descriptions || {},
      claims: entity.claims || {},
      sitelinks: entity.sitelinks || {},
      image: null,
      enLabel:
        (entity.labels && entity.labels.en && entity.labels.en.value) || null,
      enDesc:
        (entity.descriptions &&
          entity.descriptions.en &&
          entity.descriptions.en.value) ||
        null,
      viLabel:
        (entity.labels && entity.labels.vi && entity.labels.vi.value) || null,
      viDesc:
        (entity.descriptions &&
          entity.descriptions.vi &&
          entity.descriptions.vi.value) ||
        null,
    };
    const imageClaims = entity.claims && entity.claims.P18;
    if (imageClaims && imageClaims.length > 0) {
      const fn =
        imageClaims[0].mainsnak &&
        imageClaims[0].mainsnak.datavalue &&
        imageClaims[0].mainsnak.datavalue.value;
      if (fn)
        result.image =
          "https://commons.wikimedia.org/wiki/Special:FilePath/" +
          encodeURIComponent(fn) +
          "?width=600";
    }
    CACHE.set(cacheKey, result);
    return result;
  } catch (err) {
    console.warn("WD fetch:", err && err.message);
    return null;
  }
}

export async function fetchWikipediaSummary(title, lang) {
  lang = lang || "en";
  const cacheKey = "wp:" + lang + ":" + title;
  if (CACHE.has(cacheKey)) return CACHE.get(cacheKey);
  try {
    const resp = await fetch(
      "https://" +
        lang +
        ".wikipedia.org/api/rest_v1/page/summary/" +
        encodeURIComponent(title),
      { headers: { "User-Agent": "MiniDi/1.0" } },
    );
    if (!resp.ok) throw new Error("HTTP " + resp.status);
    const data = await resp.json();
    const result = {
      title: data.title || title,
      extract: data.extract || null,
      description: data.description || null,
      thumbnail: (data.thumbnail && data.thumbnail.source) || null,
      originalImage: (data.originalimage && data.originalimage.source) || null,
      url:
        (data.content_urls &&
          data.content_urls.desktop &&
          data.content_urls.desktop.page) ||
        null,
    };
    CACHE.set(cacheKey, result);
    return result;
  } catch (err) {
    console.warn("WP summary:", err && err.message);
    return null;
  }
}

function stripTag(html, tag) {
  var re = new RegExp(
    "<" + tag + "\\b[^>]*>[\\s\\S]*?<\\/" + tag + ">",
    "gi",
  );
  return html.replace(re, "");
}

function stripDivWithClass(html, cls) {
  var re = new RegExp(
    '<div\\s+class="' + cls + '[^"]*"[^>]*>[\\s\\S]*?<\\/div>',
    "gi",
  );
  return html.replace(re, "");
}

function sanitizeTags(html, allowed) {
  var allowSet = {};
  allowed.forEach(function (t) {
    allowSet[t.toLowerCase()] = true;
    allowSet["/" + t.toLowerCase()] = true;
  });
  return html.replace(/<(\/?)(\w+)[^>]*>/gi, function (m, slash, tag) {
    return allowSet[slash + tag.toLowerCase()] ? m : "";
  });
}

export async function fetchWikipediaFull(title, lang) {
  lang = lang || "en";
  const cacheKey = "wpf:" + lang + ":" + title;
  if (CACHE.has(cacheKey)) return CACHE.get(cacheKey);
  try {
    const resp = await fetch(
      "https://" +
        lang +
        ".wikipedia.org/w/api.php?action=parse&page=" +
        encodeURIComponent(title) +
        "&prop=text&format=json&origin=*",
      { headers: { "User-Agent": "MiniDi/1.0" } },
    );
    const json = await resp.json();
    var html = (json.parse && json.parse.text && json.parse.text["*"]) || "";
    var langHost = "https://" + lang + ".wikipedia.org";

    const infobox = _extractInfobox(html);

    html = stripTag(html, "table");
    html = stripTag(html, "style");
    html = stripTag(html, "sup");
    html = stripTag(html, "span");
    html = stripDivWithClass(html, "hatnote");
    html = stripDivWithClass(html, "shortdescription");
    html = stripDivWithClass(html, "mw-authority-control");
    html = stripDivWithClass(html, "navbox");

    html = html.replace(/\s(class|style|id|role|aria-\w+)="[^"]*"/gi, "");

    var kw = [
      "References",
      "Notes",
      "Bibliography",
      "External links",
      "Further reading",
      "See also",
    ];
    for (var ki = 0; ki < kw.length; ki++) {
      var sr = new RegExp(
        "<h2[^>]*>(?:(?!<\\/h2>)[\\s\\S])*?" +
          kw[ki] +
          "(?:(?!<\\/h2>)[\\s\\S])*?<\\/h2>[\\s\\S]*?(?=<h[234]\\b|$)",
        "gi",
      );
      html = html.replace(sr, "");
    }

    html = extractGalleries(html);
    html = extractThumbs(html);

    html = html.replace(
      /<a\s[^>]*href="\/\/([^"]+)"[^>]*>/gi,
      '<a href="https://$1">',
    );
    html = html.replace(
      /<a\s[^>]*href="\/wiki\/([^"]+)"[^>]*>/gi,
      function (m, path) {
        if (
          path.match(
            /^(Template|Help|Category|File|Portal|Special|Wikipedia):/i,
          )
        )
          return "";
        return '<a href="' + langHost + "/wiki/" + path + '">';
      },
    );
    html = html.replace(/<a[^>]*><\/a>/gi, "");

    html = html.replace(/src="\/\//gi, 'src="https://');
    html = html.replace(
      /<a\s[^>]*href="[^"]*\/wiki\/File:([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi,
      function (m, fn) {
        return (
          '<img src="https://commons.wikimedia.org/wiki/Special:FilePath/' +
          encodeURIComponent(fn) +
          '" alt="' +
          fn +
          '" />'
        );
      },
    );
    html = html.replace(
      /<a\s[^>]*href="https:\/\/[^\/]+\/wiki\/File:([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi,
      function (m, fn) {
        return (
          '<img src="https://commons.wikimedia.org/wiki/Special:FilePath/' +
          encodeURIComponent(fn) +
          '" alt="' +
          fn +
          '" />'
        );
      },
    );

    html = sanitizeTags(html, [
      "p",
      "h2",
      "h3",
      "h4",
      "b",
      "i",
      "u",
      "strong",
      "em",
      "a",
      "img",
      "br",
      "ul",
      "ol",
      "li",
      "blockquote",
      "figure",
      "figcaption",
    ]);

    html = html.replace(/<p[^>]*><\/p>/gi, "").replace(/<li[^>]*><\/li>/gi, "");
    html = html
      .replace(/\[[\d\w]+\]/g, "")
      .replace(/\s{3,}/g, " ")
      .trim();

    var paragraphs = [];
    var pRe = /<p\b[^>]*>([\s\S]*?)<\/p>/gi;
    var pm;
    while ((pm = pRe.exec(html)) !== null) {
      var text = pm[1]
        .replace(/<[^>]+>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#(\d+);/g, function (_, n) {
          return String.fromCharCode(n);
        })
        .replace(/\[\d+\]/g, "")
        .replace(/\s+/g, " ")
        .trim();
      if (text.length > 20) paragraphs.push(text);
    }

    html = html
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"');

    const result = {
      title: title,
      paragraphs: paragraphs.length ? paragraphs : null,
      rich: html.length > 100 ? html : null,
      infobox: infobox,
      totalChars: paragraphs.length
        ? paragraphs.reduce(function (s, p) {
            return s + p.length;
          }, 0)
        : 0,
    };
    CACHE.set(cacheKey, result);
    return result;
  } catch (err) {
    console.warn("WP full:", err && err.message);
    return null;
  }
}

function _extractInfobox(html) {
  try {
    var ibMatch = html.match(
      /<table\s+class="infobox[^"]*">([\s\S]*?)<\/table>/i,
    );
    if (!ibMatch) return null;
    var ib = ibMatch[1]
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<mapframe[\s\S]*?<\/mapframe>/gi, "");
    var rows = [];
    var trRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    var tr;
    while ((tr = trRe.exec(ib)) !== null) {
      var thMatch = tr[1].match(/<th[^>]*>([\s\S]*?)<\/th>/i);
      var tdMatch = tr[1].match(/<td[^>]*>([\s\S]*?)<\/td>/i);
      if (thMatch && tdMatch) {
        var label = thMatch[1]
          .replace(/<[^>]+>/g, "")
          .replace(/&amp;/g, "&")
          .replace(/&nbsp;/g, " ")
          .replace(/&#(\d+);/g, function (_, n) {
            return String.fromCharCode(n);
          })
          .replace(/\[\d+\]/g, "")
          .replace(/\s+/g, " ")
          .trim();
        var value = tdMatch[1]
          .replace(/<[^>]+>/g, "")
          .replace(/&amp;/g, "&")
          .replace(/&nbsp;/g, " ")
          .replace(/&#(\d+);/g, function (_, n) {
            return String.fromCharCode(n);
          })
          .replace(/\[\d+\]/g, "")
          .replace(/\s+/g, " ")
          .trim();
        if (label && value && label.length < 80 && value.length < 250)
          rows.push({ label: label, value: value });
      }
    }
    return rows.length ? rows : null;
  } catch (e) {
    return null;
  }
}

export async function enrichEntity(id, existingNode) {
  var results = await Promise.allSettled([
    fetchWikidataEntity(id),
    existingNode && existingNode.l
      ? fetchWikipediaSummary(existingNode.l, "en")
      : Promise.resolve(null),
    existingNode && existingNode.lv
      ? fetchWikipediaSummary(existingNode.lv, "vi")
      : Promise.resolve(null),
  ]);
  return {
    wikidata: results[0].status === "fulfilled" ? results[0].value : null,
    wikipediaEn: results[1].status === "fulfilled" ? results[1].value : null,
    wikipediaVi: results[2].status === "fulfilled" ? results[2].value : null,
  };
}

export async function enrichEntityFull(id, existingNode) {
  var enriched = await enrichEntity(id, existingNode);
  var enTitle =
    (enriched.wikipediaEn && enriched.wikipediaEn.title) ||
    (existingNode && existingNode.l);
  var viTitle =
    (enriched.wikipediaVi && enriched.wikipediaVi.title) ||
    (existingNode && existingNode.lv);
  var fr = await Promise.allSettled([
    enTitle ? fetchWikipediaFull(enTitle, "en") : Promise.resolve(null),
    viTitle ? fetchWikipediaFull(viTitle, "vi") : Promise.resolve(null),
  ]);
  return {
    wikidata: enriched.wikidata,
    wikipediaEn: enriched.wikipediaEn,
    wikipediaVi: enriched.wikipediaVi,
    fullEn: fr[0].status === "fulfilled" ? fr[0].value : null,
    fullVi: fr[1].status === "fulfilled" ? fr[1].value : null,
  };
}
