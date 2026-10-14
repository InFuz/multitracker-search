// ==UserScript==
// @name __MSG_name__
// @connect *://*.kinopoisk.ru/*
// @version 2.0
// @cacheTTL 86400
// @locale ru {"name": "Сериалы"}
// @locale en {"name": "Series"}
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

// Списки Кинопоиска /lists/movies/...: [data-test-id="movie-list-item"]
const parseKpList = response => {
  const doc = API_getDoc(response.body, response.url);
  const results = [];
  Array.from(doc.querySelectorAll('[data-test-id="movie-list-item"]')).forEach(item => {
    try {
      const linkNode = item.querySelector('a[data-test-id="next-link"]') || item.querySelector('a[href^="/film/"], a[href^="/series/"]');
      // alt постера — чистое название, без бейджей вроде "Промо"
      const img = item.querySelector('img[src*="kinopoisk-image"]');
      let title = img && img.getAttribute('alt') || normText(item.querySelector('span[class*="mainTitle"]'));
      // "Original title, 2021, 2 ч 10 мин" | "2026" | "2026–..."
      const secondary = normText(item.querySelector('[class*="secondaryText"]'));
      const m = /^(?:(.*?),\s*)?(\d{4})/.exec(secondary);
      let titleOriginal = m && m[1] || '';
      const year = m && m[2];
      if (year) {
        title += ' ' + year;
        if (titleOriginal) titleOriginal += ' ' + year;
      }
      const result = {title: title, url: linkNode && linkNode.href};
      if (titleOriginal) result.titleOriginal = titleOriginal;
      if (img) {
        result.poster = 'https:' + img.getAttribute('src').replace(/^https?:/, '').replace(/\/\d+x\d+$/, '/300x450');
      }
      results.push(result);
    } catch (err) {
      console.error('Parse item error', err);
    }
  });
  return results;
};

registerGetItems(() => loadPages([1, 2, 3].map(page => 'https://www.kinopoisk.ru/lists/movies/popular-series/?page=' + page), parseKpList));
