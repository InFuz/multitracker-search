// ==UserScript==
// @name __MSG_name__
// @connect *://gameguru.ru/*
// @downloadURL https://raw.githubusercontent.com/InFuz/multitracker-search/master/src/explorerModules/ggGamesTop.js
// @version 2.1
// @cacheTTL 86400
// @locale ru {"name": "Игры: Лучшие"}
// @locale en {"name": "Games: Best"}
// @defaultLocale en
// ==/UserScript==

const normText = node => {
  return (node && node.textContent || '').replace(/[\s\xA0]+/g, ' ').trim();
};

const uniqByUrl = items => {
  const seen = {};
  return items.filter(item => {
    if (!item.title || !item.url || seen[item.url]) return false;
    seen[item.url] = true;
    return true;
  });
};

const loadPages = (urls, onPageLoad) => {
  const items = [];
  let promise = Promise.resolve();
  urls.forEach(url => {
    promise = promise.then(() => {
      return API_request({method: 'GET', url: url}).then(response => {
        items.push(...onPageLoad(response));
      }, err => {
        console.error('Page load error', url, err);
      });
    });
  });
  return promise.then(() => uniqByUrl(items));
};

const registerGetItems = getItems => {
  API_event('getItems', () => {
    return getItems().then(items => {
      if (!items.length) {
        throw new Error('Items is empty');
      }
      return {success: true, items};
    });
  });
};

const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

// "9 сентября 2026" -> Date, "В 2030 году" -> null
const parseReleaseDate = text => {
  const m = /(\d{1,2})\s+([а-я]+)\s+(\d{4})/i.exec(text);
  if (!m) return null;
  const month = MONTHS.indexOf(m[2].toLowerCase());
  if (month === -1) return null;
  return new Date(parseInt(m[3], 10), month, parseInt(m[1], 10));
};

// Каталог gameguru.ru/games/platform_pc/: карточки div.short-news
const parseGgList = response => {
  const doc = API_getDoc(response.body, response.url);
  const results = [];
  Array.from(doc.querySelectorAll('.short-news')).forEach(item => {
    const linkNode = item.querySelector('.short-news-title a[href*="/game/"]');
    if (!linkNode) return;
    const result = {title: normText(linkNode), url: linkNode.href};
    const img = item.querySelector('.short-news-image img[src]');
    if (img) {
      result.poster = img.src;
    }
    Array.from(item.querySelectorAll('.short-news-play-info')).forEach(info => {
      if (/Дата выхода/.test(normText(info.querySelector('.gray')))) {
        result.releaseDate = parseReleaseDate(normText(info));
      }
    });
    results.push(result);
  });
  return results;
};

const stripDate = item => {
  const result = {title: item.title, url: item.url};
  if (item.poster) result.poster = item.poster;
  return result;
};

const ggPages = (count) => {
  const urls = [];
  for (let page = 1; page <= count; page++) {
    urls.push('https://gameguru.ru/games/platform_pc/' + (page > 1 ? '?page=' + page : ''));
  }
  return urls;
};

// Популярные игры PC, которые уже вышли
registerGetItems(() => loadPages(ggPages(3), parseGgList).then(items => {
  const now = Date.now();
  return items.filter(item => item.releaseDate && item.releaseDate.getTime() <= now).map(stripDate);
}));
