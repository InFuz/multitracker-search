// Cloudflare и другие сайты кладут куки (например, cf_clearance) в «разделённое» хранилище
// (атрибут Partitioned): браузер отправляет их только запросам со страниц самого сайта.
// Запросы расширения идут со страницы расширения, поэтому такие куки берём через chrome.cookies
// и добавляем в заголовок Cookie сессионным правилом declarativeNetRequest для хоста запроса.

const RESOURCE_TYPES = ['xmlhttprequest', 'other'];

const isSameSite = (hostname, topLevelSite) => {
  let siteHost = null;
  try {
    siteHost = new URL(topLevelSite).hostname;
  } catch (err) {
    return false;
  }
  return hostname === siteHost || hostname.endsWith('.' + siteHost);
};

const getCookies = (details) => {
  return new Promise((resolve) => {
    try {
      chrome.cookies.getAll(details, (cookies) => {
        resolve(chrome.runtime.lastError || !cookies ? [] : cookies);
      });
    } catch (err) {
      // браузер без поддержки partitionKey
      resolve([]);
    }
  });
};

const getPartitionedCookieHeader = async (url) => {
  if (!chrome.cookies || !chrome.cookies.getAll) return '';

  const {hostname} = new URL(url);
  // partitionKey: {} — вернуть куки из всех разделов; без него — только обычные
  const [allCookies, regularCookies] = await Promise.all([
    getCookies({url, partitionKey: {}}),
    getCookies({url}),
  ]);
  const regularNames = regularCookies.map(cookie => cookie.name);

  return allCookies.filter((cookie) => {
    const key = cookie.partitionKey;
    return key && key.topLevelSite && !key.hasCrossSiteAncestor && isSameSite(hostname, key.topLevelSite) &&
      regularNames.indexOf(cookie.name) === -1;
  }).map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
};

// Стабильный id правила для хоста: одно правило на хост, обновляется перед каждым запросом.
// Id до RULE_ID_OFFSET заняты служебными правилами (см. stripPreloadHeaders)
const RULE_ID_OFFSET = 1000;
const getRuleId = (hostname) => {
  let hash = 0;
  for (let i = 0; i < hostname.length; i++) {
    hash = (hash * 31 + hostname.charCodeAt(i)) | 0;
  }
  return RULE_ID_OFFSET + (hash & 0x3fffffff);
};

const updateSessionRules = (options) => {
  return new Promise((resolve, reject) => {
    chrome.declarativeNetRequest.updateSessionRules(options, () => {
      const err = chrome.runtime.lastError;
      err ? reject(err) : resolve();
    });
  });
};

const applyPartitionedCookies = async (url) => {
  if (!chrome.declarativeNetRequest) return;

  const {hostname} = new URL(url);
  const value = await getPartitionedCookieHeader(url);
  const id = getRuleId(hostname);
  const rules = !value ? [] : [{
    id,
    priority: 1,
    action: {
      type: 'modifyHeaders',
      requestHeaders: [{header: 'cookie', operation: 'append', value}],
    },
    condition: {
      requestDomains: [hostname],
      initiatorDomains: [chrome.runtime.id],
      resourceTypes: RESOURCE_TYPES,
    },
  }];

  await updateSessionRules({removeRuleIds: [id], addRules: rules});
};

export {applyPartitionedCookies};
