// Cloudflare и другие сайты кладут куки (например, cf_clearance) в «разделённое» хранилище
// (атрибут Partitioned): браузер отправляет их только запросам со страниц самого сайта.
// Запросы расширения идут со страницы расширения, поэтому такие куки берём через chrome.cookies
// и передаём служебным заголовком — фоновая страница переносит его в Cookie (см. background).

const PARTITIONED_COOKIE_HEADER = 'X-TMS-Partitioned-Cookie';

const isSameSite = (hostname, topLevelSite) => {
  let siteHost = null;
  try {
    siteHost = new URL(topLevelSite).hostname;
  } catch (err) {
    return false;
  }
  return hostname === siteHost || hostname.endsWith('.' + siteHost);
};

const getPartitionedCookieHeader = (url) => {
  return new Promise((resolve) => {
    if (!chrome.cookies || !chrome.cookies.getAll) {
      return resolve('');
    }
    const {hostname} = new URL(url);
    try {
      // partitionKey: {} — вернуть куки из всех разделов
      chrome.cookies.getAll({url, partitionKey: {}}, (cookies) => {
        if (chrome.runtime.lastError || !cookies) {
          return resolve('');
        }
        const value = cookies.filter((cookie) => {
          const key = cookie.partitionKey;
          return key && key.topLevelSite && !key.hasCrossSiteAncestor && isSameSite(hostname, key.topLevelSite);
        }).map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
        resolve(value);
      });
    } catch (err) {
      // браузер без поддержки partitionKey
      resolve('');
    }
  });
};

// Фоновая страница: переносим служебный заголовок в Cookie, только для запросов самого расширения
const bindPartitionedCookieForwarding = () => {
  if (!chrome.webRequest || !chrome.webRequest.onBeforeSendHeaders) return;

  const extensionOrigin = chrome.runtime.getURL('').replace(/\/$/, '');
  const headerName = PARTITIONED_COOKIE_HEADER.toLowerCase();

  const listener = (details) => {
    const headers = details.requestHeaders;
    const index = headers.findIndex(header => header.name.toLowerCase() === headerName);
    if (index === -1) return;

    const [extra] = headers.splice(index, 1);
    if (details.initiator !== extensionOrigin || !extra.value) {
      return {requestHeaders: headers};
    }

    const cookieHeader = headers.find(header => header.name.toLowerCase() === 'cookie');
    if (!cookieHeader) {
      headers.push({name: 'Cookie', value: extra.value});
    } else {
      const existingNames = cookieHeader.value.split(';').map(pair => pair.split('=')[0].trim());
      const missing = extra.value.split('; ').filter(pair => existingNames.indexOf(pair.split('=')[0]) === -1);
      if (missing.length) {
        cookieHeader.value = [cookieHeader.value].concat(missing).join('; ');
      }
    }
    return {requestHeaders: headers};
  };

  try {
    chrome.webRequest.onBeforeSendHeaders.addListener(listener, {urls: ['<all_urls>']}, ['blocking', 'requestHeaders', 'extraHeaders']);
  } catch (err) {
    // extraHeaders не поддерживается (не Chromium)
    chrome.webRequest.onBeforeSendHeaders.addListener(listener, {urls: ['<all_urls>']}, ['blocking', 'requestHeaders']);
  }
};

export {PARTITIONED_COOKIE_HEADER, getPartitionedCookieHeader, bindPartitionedCookieForwarding};
