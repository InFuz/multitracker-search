// ==UserScript==
// @name LimeTorrents
// @description Международный публичный торрент-трекер: фильмы, сериалы, музыка, игры, программы.
// @icon data:image/x-icon;base64,AAABAAEAEBAAAAEAIABoBAAAFgAAACgAAAAQAAAAIAAAAAEAIAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADAAAADgAAACAAAAA7AAAAXwAAAHwAAwCKAAYAfAAAAFEAAAAWAAAAAAAAAAAAAAAAAAAAAAAAAAMAAAARAAAAJgAAADoAAABNAhADeQxfFdwPdx36EHsf/Q96H/4Obxr3C1wTyA1xEyoAAAAAAAAAAAAAAAAAAAAMAAAAGQAAACcAAAA3BSYIWRWJJuYZmTv/GpxE/xqbRf8ZmEL/FpA5/xOGLf8QfCD5DnUWbAAAAAAAAAAAAAAAAgAAAAsAAAAXAAAAIxePKb8fqkr/IrNd/yS3Y/8kt2T/I7Vh/yGtWv8coEz/Fo85/xF/JP4OdRZcAAAAAAAAAAAAAAAAAAAAABuiKScgrkP9J8Fo/yrJdf8rzXn/LM97/yvMdv8qw2X/J7hW/yGqSf8ZlTr/EX8h7A94Fg0AAAAAAAAAAAAAAAAerTNxJsBb/y3Re/8u037/L8to/1fMcv9exWj/TrhQ/1+4Vv9QskX/W7xX/0q2Vv8XiyFiAAAAAAAAAAAAAAAAI7g9nC3Naf8x0nP/U8lo/1nJdf8gynr/FM+J/07Iff8cx3n/GcNt/z2xR/9TwGL/ScBWpQAAAAAAAAAAAAAAAC3DQKk0zl7/WsNh/0m0Tf8szon/BPLj/wP37/9B6Mv/Bfnz/y/nyv8Y6Mv/F8+D/2DMb6cAAAAAAAAAAAAAAAA6zz6ZcNJ6/53PlP9OxHX/KN6y/zXt1/8u0pj/TMuJ/z7QlP8m6s//KOO9/1TJdPxr0Hc+AAAAAAAAAAAAAAAAO803ZrPjtf+84br/t+/a/5f59P9u8d//gM+V/5jNkv9w5sX/ZPjx/4Tis/yL1pJsAAAAAAAAAAAAAAAAAAAAAD3MNhKp467mzO3U/8X26//A/Pr/yPjx/8P79v/L+PD/tPjt/6jowdSm4a5AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAATcVZIa7luKLB7tDpz/DY/MXu0/m+7MzbrujBn5bnukrR7tYCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACG3OQkZsi0EAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//8AAP9/AAD8DwAA+AcAAPADAADwAQAA8AEAAOAAAADgAAAA4AEAAPADAADwBwAA+B8AAP//AAD//wAA//8AAA==
// @trackerURL https://www.limetorrents.fun
// @downloadURL https://raw.githubusercontent.com/InFuz/multitracker-search/master/src/trackers/limetorrents.js
// @version 1.0.1
// @connect *://www.limetorrents.fun/*
// @require exKit
// ==/UserScript==

const code = {
  "version": 3,
  "type": "kit",
  "search": {
    "url": "https://www.limetorrents.fun/search/all/%search%/",
    "method": "GET"
  },
  "selectors": {
    "row": {"selector": ".table2 > tbody > tr[bgcolor]:has(div.tt-name)"},
    "categoryTitle": {"selector": "td:eq(1)", "pipeline": [{"name": "getText"}]},
    "categoryId": {"selector": "td:eq(1)", "pipeline": [{"name": "getText"}]},
    "title": {"selector": "div.tt-name > a[href^=\"/\"]", "pipeline": [{"name": "getAttr", "args": ["href"]}]},
    "url": {"selector": "div.tt-name > a[href^=\"/\"]", "pipeline": [{"name": "getProp", "args": ["href"]}]},
    "size": {"selector": "td:eq(2)", "pipeline": [{"name": "getText"}, {"name": "legacySizeFormat"}]},
    "downloadUrl": {"selector": "div.tt-name > a:eq(0)", "pipeline": [{"name": "getAttr", "args": ["href"]}]},
    "seeds": {"selector": "td.tdseed", "pipeline": [{"name": "getText"}, {"name": "replace", "args": [",", ""]}, {"name": "toInt"}]},
    "peers": {"selector": "td.tdleech", "pipeline": [{"name": "getText"}, {"name": "replace", "args": [",", ""]}, {"name": "toInt"}]},
    "date": {"selector": "td:eq(1)", "pipeline": [{"name": "getText"}]},
    "nextPageUrl": {"selector": "div.search_stat a:contains(\"Next\")", "pipeline": [{"name": "getProp", "args": ["href"]}]}
  }
};

code.hooks = {};
code.hooks.transform = {};

// Название в ссылке обрезано "..", полное берём из адреса: /Some-Name-torrent-123.html
code.hooks.transform.title = (session, href) => {
  let path = href;
  try { path = decodeURIComponent(new URL(href, 'https://www.limetorrents.fun/').pathname); } catch (err) {}
  const m = /^\/(.+?)-torrent-\d+\.html$/.exec(path);
  return m ? m[1].replace(/-/g, ' ') : '';
};
// "2 days ago - in Movies", "Last Month - in TV shows", "1 Year+ - in Movies"
code.hooks.transform.categoryTitle = (session, text) => {
  const m = / in (.+?)\.?$/.exec(text);
  return m ? m[1] : '';
};
const CATEGORY_IDS = {'TV shows': 0, 'Music': 1, 'Games': 2, 'Movies': 3, 'Books': 5, 'Applications': 6, 'Anime': 7};
code.hooks.transform.categoryId = (session, text) => {
  const m = / in (.+?)\.?$/.exec(text);
  return m && CATEGORY_IDS[m[1]] !== undefined ? CATEGORY_IDS[m[1]] : -1;
};
const UNITS = {second: 1, minute: 60, hour: 3600, day: 86400, week: 604800, month: 2592000, year: 31536000};
code.hooks.transform.date = (session, text) => {
  const now = Math.round(Date.now() / 1000);
  const age = text.split(' - ')[0].toLowerCase();
  if (/yesterday/.test(age)) return now - UNITS.day;
  if (/last month/.test(age)) return now - UNITS.month;
  if (/last year/.test(age)) return now - UNITS.year;
  const m = /(\d+)\s*(second|minute|hour|day|week|month|year)/.exec(age);
  return m ? now - parseInt(m[1], 10) * UNITS[m[2]] : -1;
};
// Ссылка ведёт на itorrents.net/torrent/<HASH>.torrent — собираем magnet по хешу
code.hooks.transform.downloadUrl = (session, href) => {
  const m = /([0-9A-F]{40})/i.exec(href || '');
  return m ? 'magnet:?xt=urn:btih:' + m[1] + '&tr=' + encodeURIComponent('udp://tracker.opentrackr.org:1337/announce') +
    '&tr=' + encodeURIComponent('udp://open.stealth.si:80/announce') : href;
};

API_exKit(code);
