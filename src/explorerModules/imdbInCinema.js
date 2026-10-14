// ==UserScript==
// @name __MSG_name__
// @connect *://*.imdb.com/*
// @downloadURL https://raw.githubusercontent.com/InFuz/multitracker-search/master/src/explorerModules/imdbInCinema.js
// @version 2.1
// @cacheTTL 86400
// @locale ru {"name": "IMDB: Сейчас в кино"}
// @locale en {"name": "IMDB: Now in movie"}
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

// Новый IMDb (Next.js): данные списка лежат в <script id="__NEXT_DATA__">
const parseImdbSearch = response => {
  const m = /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/.exec(response.body);
  if (!m) {
    if (response.statusCode === 202 || !response.body) {
      // Защита от ботов (AWS WAF): после открытия imdb.com в браузере запросы проходят
      const err = new Error('IMDb bot protection');
      err.code = 'AUTH_REQUIRED';
      err.url = 'https://www.imdb.com/';
      throw err;
    }
    throw new Error('__NEXT_DATA__ is not found');
  }
  const data = JSON.parse(m[1]);
  const list = data.props.pageProps.searchResults.titleResults.titleListItems || [];
  return list.map(item => {
    const year = item.releaseYear ? ' ' + item.releaseYear : '';
    const result = {
      title: (item.titleText || item.originalTitleText) + year,
      url: 'https://www.imdb.com/title/' + item.titleId + '/'
    };
    if (item.originalTitleText && item.originalTitleText !== item.titleText) {
      result.titleOriginal = item.originalTitleText + year;
    }
    if (item.primaryImage && item.primaryImage.url) {
      result.poster = item.primaryImage.url.replace(/\._V1_.*$/, '._V1_SX300_.jpg');
    }
    return result;
  });
};

registerGetItems(() => loadPages(['https://www.imdb.com/search/title/?title_type=feature&groups=now-playing-us'], parseImdbSearch));
