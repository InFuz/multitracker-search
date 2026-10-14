// Проверка встроенных трекеров на живых сайтах: тот же код exKit, что и в песочнице расширения,
// исполняется в Node на jsdom. Для каждого трекера два поиска:
// - по тестовому запросу — сколько строк найдено и разобрано, какие поля пустые, есть ли следующая страница;
// - по бессмысленному запросу — распознаётся ли пустая выдача (selectors.noResults).
// Трекеры со входом и за Cloudflare без кук браузера не проверить: они помечаются, но не считаются ошибкой.
//
//   npm run checkTrackers                    — все трекеры
//   npm run checkTrackers -- --tracker rutor,megapeer
//   npm run checkTrackers -- --query "Дюна"  — свой тестовый запрос
//   npm run checkTrackers -- --save          — сохранить ответы сайтов в .cache/trackerPages
//   npm run checkTrackers -- --offline       — разобрать сохранённые ответы без сети (проверка правок exKit)
//   npm run checkTrackers -- --system-dns    — без DNS-over-HTTPS

// В расширении import() подгружает чанки webpack; в Node заменяем его на require
const dynamicImportToRequire = ({template}) => {
  const buildRequire = template.expression(`Promise.resolve().then(() => {
    const m = require(SOURCE);
    return m && m.__esModule ? m : Object.assign({default: m}, m);
  })`);
  return {
    inherits: require('@babel/plugin-syntax-dynamic-import').default,
    visitor: {
      CallExpression(path) {
        if (path.node.callee.type === 'Import') {
          path.replaceWith(buildRequire({SOURCE: path.node.arguments[0]}));
        }
      },
    },
  };
};

require("@babel/register")({
  presets: [["@babel/preset-env", {targets: {node: 'current'}}]],
  plugins: ['@babel/plugin-proposal-class-properties', dynamicImportToRequire],
  cache: false,
});

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const crypto = require('crypto');
const {JSDOM} = require('jsdom');
const getArgvValue = require('./getArgvValue');

// sizzle и exKit рассчитаны на браузер: глобальные window/document нужны до их загрузки
const {window} = new JSDOM('<!doctype html><html><head></head><body></body></html>', {url: 'https://localhost/'});
Object.assign(global, {
  self: global, // whatwg-fetch (Headers в exKitRequestOptionsNormalize)
  window,
  document: window.document,
  DOMParser: window.DOMParser,
  Node: window.Node,
  Element: window.Element,
});

const getTrackerCodeMeta = require('../src/tools/getTrackerCodeMeta').default;
const exKitRequestOptionsNormalize = require('../src/tools/exKitRequestOptionsNormalize').default;
const exKitBuildConnectRe = require('../src/tools/exKitBuildConnectRe').default;
const exKitGetDoc = require('../src/tools/exKitGetDoc').default;
const exKitNormalizeUrl = require('../src/tools/exKitNormalizeUrl').default;
const {StatusCodeError, ErrorWithCode} = require('../src/tools/errors');
const {exKit, API_exKit} = require('../src/sandbox/exKit');

const rootPath = path.join(__dirname, '..');
const pagesPath = path.join(rootPath, '.cache/trackerPages');

const offline = process.argv.includes('--offline');
const save = process.argv.includes('--save');
const useDoh = !process.argv.includes('--system-dns');
const trackerFilter = (getArgvValue('--tracker') || '').split(',').filter(Boolean);
const customQuery = getArgvValue('--query');

// Тестовые запросы, по которым у трекера заведомо есть раздачи
const defaultQuery = 'matrix';
const trackerQuery = {
  booktracker: 'Толстой',
  rgfootball: 'Спартак',
  tapochek: 'Fallout',
};
const nonsenseQuery = 'qzxvjwkq';

const userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
const requestTimeout = 30 * 1000;

// --- Сеть ---

// Корпоративный DNS не резолвит часть трекеров, поэтому адреса берутся через DNS-over-HTTPS (как в профиле браузера для проверок)
const dohCache = {};
const resolveDoh = (hostname) => {
  if (!dohCache[hostname]) {
    dohCache[hostname] = new Promise((resolve, reject) => {
      const req = https.get(`https://1.1.1.1/dns-query?name=${encodeURIComponent(hostname)}&type=A`, {
        headers: {accept: 'application/dns-json'},
        timeout: 10 * 1000,
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const answer = (JSON.parse(data).Answer || []).find(item => item.type === 1);
            answer ? resolve(answer.data) : reject(new Error(`DoH: ${hostname} не резолвится`));
          } catch (err) {
            reject(err);
          }
        });
      });
      req.on('timeout', () => req.destroy(new Error('DoH timeout')));
      req.on('error', reject);
    });
  }
  return dohCache[hostname];
};

const dohLookup = (hostname, options, callback) => {
  resolveDoh(hostname).then((address) => {
    options && options.all ? callback(null, [{address, family: 4}]) : callback(null, address, 4);
  }, callback);
};

const httpRequest = (url, {method = 'GET', headers = [], body}, redirectCount = 0) => {
  return new Promise((resolve, reject) => {
    const uri = new URL(url);
    const transport = uri.protocol === 'http:' ? http : https;
    const requestHeaders = {'user-agent': userAgent, 'accept-language': 'ru-RU,ru;q=0.9,en;q=0.8'};
    headers.forEach(([key, value]) => requestHeaders[key.toLowerCase()] = value);
    const req = transport.request(uri, {
      method,
      headers: requestHeaders,
      timeout: requestTimeout,
      lookup: useDoh ? dohLookup : undefined,
    }, (res) => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location && redirectCount < 5) {
        res.resume();
        const nextUrl = new URL(res.headers.location, url).href;
        const keepMethod = [307, 308].includes(res.statusCode);
        resolve(httpRequest(nextUrl, keepMethod ? {method, headers, body} : {headers}, redirectCount + 1));
        return;
      }
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve({
        url,
        statusCode: res.statusCode,
        statusText: res.statusMessage,
        headers: res.headers,
        buffer: Buffer.concat(chunks),
      }));
      res.on('error', reject);
    });
    req.on('timeout', () => req.destroy(new ErrorWithCode('Request timeout', 'ETIMEDOUT')));
    req.on('error', reject);
    if (body) {
      req.write(body);
    }
    req.end();
  });
};

// Как и в расширении (retryOnNetworkError), первое соединение может оборваться — повторяем
const httpRequestWithRetry = async (url, options) => {
  for (let attempt = 1; ; attempt++) {
    try {
      return await httpRequest(url, options);
    } catch (err) {
      if (attempt >= 3 || err instanceof StatusCodeError) throw err;
    }
  }
};

const getPageFilename = (trackerId, options) => {
  const hash = crypto.createHash('sha1').update(JSON.stringify([options.method, options.url, options.body || ''])).digest('hex').slice(0, 12);
  return path.join(pagesPath, trackerId, `${hash}.json`);
};

const loadResponse = async (trackerId, options) => {
  const filename = getPageFilename(trackerId, options);
  if (offline) {
    if (!fs.existsSync(filename)) {
      throw new ErrorWithCode(`Нет сохранённой страницы ${options.url} (запустите с --save)`, 'NO_SAVED_PAGE');
    }
    const saved = JSON.parse(fs.readFileSync(filename, 'utf8'));
    return Object.assign(saved, {buffer: Buffer.from(saved.body, 'base64')});
  }
  const response = await httpRequestWithRetry(options.url, options);
  if (save) {
    fs.mkdirSync(path.dirname(filename), {recursive: true});
    const {buffer, ...rest} = response;
    fs.writeFileSync(filename, JSON.stringify(Object.assign(rest, {request: options.url, body: buffer.toString('base64')})));
  }
  return response;
};

// Повторяет src/tools/exKitRequest.js: проверка @connect, ошибка на не-2xx, декодирование по charset
const trackerRequest = async (tracker, options) => {
  const {origin} = new URL(options.url);
  if (!tracker.connectRe || !tracker.connectRe.test(origin)) {
    throw new ErrorWithCode(`Connection is not allowed! ${origin} Add url patter in @connect!`, 'ORIGIN_IS_NOT_AVAILABLE');
  }
  let response;
  try {
    response = await loadResponse(tracker.id, options);
  } catch (err) {
    if (err.code === 'NO_SAVED_PAGE') throw err;
    // как fetch в браузере: сетевая ошибка — TypeError (по нему exKit переключается на зеркало)
    const networkError = new TypeError(`Failed to fetch: ${err.code || ''} ${err.message}`.trim());
    networkError.cause = err;
    throw networkError;
  }
  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new StatusCodeError(response.statusCode, null, null, response);
  }
  const contentType = response.headers['content-type'] || '';
  const m = /charset=([^;]+)/i.exec(contentType);
  const body = new TextDecoder(options.charset || (m && m[1].trim()) || 'utf-8').decode(response.buffer);
  return {url: response.url, statusCode: response.statusCode, statusText: response.statusText, body, headers: response.headers};
};

// --- Исполнение трекера ---

// Загружает код трекера в окружение, похожее на песочницу (src/sandbox/index.js, baseApi.js)
const loadTracker = async (id) => {
  const code = fs.readFileSync(path.join(rootPath, 'src/trackers', `${id}.js`), 'utf8');
  const meta = getTrackerCodeMeta(code);
  const tracker = {id, meta, connectRe: exKitBuildConnectRe(meta.connect), events: {}, exKitCode: null};

  const promiseList = [];
  Object.assign(global, {
    API_async: (fn) => {
      const promise = Promise.resolve().then(fn);
      promiseList.push(promise);
      return promise;
    },
    API_event: (name, callback) => {
      tracker.events[name] = (...args) => Promise.resolve().then(() => callback(...args));
    },
    API_request: (rawOptions) => {
      const {options, toJson} = exKitRequestOptionsNormalize(rawOptions);
      return trackerRequest(tracker, options).then((response) => {
        if (toJson) {
          response.body = JSON.parse(response.body);
        }
        return response;
      });
    },
    API_exKit: (exKitCode) => {
      tracker.exKitCode = exKitCode;
      return API_exKit(exKitCode);
    },
    exKit,
    API_getDoc: exKitGetDoc,
    API_normalizeUrl: exKitNormalizeUrl,
    API_getInfo: () => ({}),
  });

  new Function(code)();
  await Promise.all(promiseList);
  return tracker;
};

const fieldCheckers = {
  title: value => typeof value === 'string' && value.trim() !== '',
  url: value => typeof value === 'string' && /^https?:/.test(value),
  size: value => typeof value === 'number' && value > 0,
  seeds: value => typeof value === 'number' && value >= 0,
  peers: value => typeof value === 'number' && value >= 0,
  date: value => typeof value === 'number' && value > 0,
  downloadUrl: value => typeof value === 'string' && value !== '',
  categoryTitle: value => typeof value === 'string' && value.trim() !== '',
  categoryId: value => typeof value === 'number' && value >= 0,
};

// Поля, которые трекер должен заполнять: у exKit — заданные селекторы, у остальных — основные
const getExpectedFields = (tracker) => {
  const selectors = tracker.exKitCode && tracker.exKitCode.version === 3 && tracker.exKitCode.selectors;
  if (selectors) {
    return Object.keys(fieldCheckers).filter(key => selectors[key]);
  }
  return ['title', 'url', 'size', 'seeds', 'peers', 'date'];
};

const describeError = (err) => {
  if (err.code === 'AUTH_REQUIRED') return {kind: 'skip', text: 'нужен вход на сайт'};
  if (err.code === 'LAYOUT_CHANGED') return {kind: 'fail', text: `выдача не разобрана — ${err.message}`};
  if (err.code === 'NO_SAVED_PAGE') return {kind: 'skip', text: err.message};
  if (err instanceof StatusCodeError) {
    if ([403, 503].includes(err.statusCode)) return {kind: 'skip', text: `ответ ${err.statusCode}: вход или защита от ботов (Cloudflare)`};
    return {kind: 'fail', text: `ответ ${err.statusCode}`};
  }
  if (err instanceof TypeError && /^Failed to fetch/.test(err.message)) {
    return {kind: 'skip', text: `сеть: ${err.message}`};
  }
  if (/DoH|ENOTFOUND|ECONN|ETIMEDOUT|EHOSTUNREACH|socket|TLS|certificate/i.test(`${err.code} ${err.message}`)) {
    return {kind: 'skip', text: `сеть: ${err.code || ''} ${err.message}`.trim()};
  }
  return {kind: 'fail', text: `ошибка: ${err.message}`};
};

const checkTracker = async (id) => {
  const lines = [];
  // предупреждения exKit (например, «поле не разобрано ни в одной строке») — в отчёт трекера
  const warnings = [];
  const {warn, debug} = console;
  console.warn = (...args) => warnings.push(args.map(String).join(' '));
  console.debug = () => {};
  try {
    return await checkTrackerInner(id, lines, warnings);
  } finally {
    Object.assign(console, {warn, debug});
  }
};

const checkTrackerInner = async (id, lines, warnings) => {
  let kind = 'ok';
  const setKind = (value) => {
    const order = ['ok', 'skip', 'warn', 'fail'];
    if (order.indexOf(value) > order.indexOf(kind)) kind = value;
  };

  let tracker;
  try {
    tracker = await loadTracker(id);
  } catch (err) {
    return {id, kind: 'fail', lines: [`код трекера не загружается: ${err.message}`]};
  }

  const query = customQuery || trackerQuery[id] || defaultQuery;
  try {
    const result = await tracker.events.search({query});
    if (!result || !result.success) {
      throw new Error('search вернул неуспешный результат');
    }
    const results = result.results || [];
    const stats = result.stats;
    const rowsInfo = stats ? `, строк ${stats.rows}${stats.failedRows ? `, не разобрано ${stats.failedRows} (${stats.firstRowError})` : ''}` : '';
    lines.push(`«${query}»: результатов ${results.length}${rowsInfo}${result.nextPageRequest ? ', есть следующая страница' : ''}`);
    const searchUrl = tracker.exKitCode && tracker.exKitCode.search && tracker.exKitCode.search.url;
    if (stats && stats.url && searchUrl && new URL(stats.url).origin !== new URL(searchUrl).origin) {
      setKind('warn');
      lines.push(`основной адрес не ответил, ответило зеркало ${new URL(stats.url).origin}`);
    }

    if (!results.length) {
      setKind('fail');
      lines.push('по тестовому запросу ничего не найдено');
    } else {
      const fieldInfo = getExpectedFields(tracker).map((key) => {
        const filled = results.filter(item => fieldCheckers[key](item[key])).length;
        if (!filled) {
          setKind('fail');
        }
        return `${key} ${filled}/${results.length}${filled ? '' : ' ✗'}`;
      });
      lines.push(`поля: ${fieldInfo.join(', ')}`);
    }
  } catch (err) {
    const {kind: errKind, text} = describeError(err);
    setKind(errKind);
    lines.push(`«${query}»: ${text}`);
    if (errKind === 'skip') {
      return {id, kind, lines};
    }
  }

  try {
    const result = await tracker.events.search({query: nonsenseQuery});
    const count = (result && result.results || []).length;
    const hasNoResults = !!(tracker.exKitCode && tracker.exKitCode.selectors && tracker.exKitCode.selectors.noResults);
    if (count) {
      lines.push(`пустой запрос: неожиданно ${count} результатов`);
    } else if (tracker.exKitCode && tracker.exKitCode.version === 3 && !hasNoResults) {
      lines.push('пустой запрос: 0 результатов, но selectors.noResults не задан — сломанную выдачу от пустой не отличить');
    } else {
      lines.push('пустой запрос: распознан');
    }
  } catch (err) {
    const {kind: errKind, text} = describeError(err);
    setKind(errKind);
    lines.push(`пустой запрос: ${text}`);
  }

  Array.from(new Set(warnings)).forEach(text => lines.push(`предупреждение: ${text}`));
  return {id, kind, lines};
};

const main = async () => {
  const ids = fs.readdirSync(path.join(rootPath, 'src/trackers'))
    .filter(name => /\.js$/.test(name)).map(name => path.basename(name, '.js'))
    .filter(id => !trackerFilter.length || trackerFilter.includes(id));

  const marks = {ok: '✓', skip: '–', warn: '!', fail: '✗'};
  // API_* — общие глобальные функции, как window в песочнице, поэтому трекеры проверяются по очереди
  const reports = [];
  for (const id of ids) {
    const report = await checkTracker(id).catch(err => ({id, kind: 'fail', lines: [err.stack]}));
    reports.push(report);
    console.log(`${marks[report.kind]} ${id}`);
    report.lines.forEach(line => console.log(`    ${line}`));
  }

  const count = kind => reports.filter(report => report.kind === kind).length;
  console.log(`\nВ порядке: ${count('ok')}, работают через зеркало: ${count('warn')}, не проверены (вход, защита, сеть): ${count('skip')}, сломаны: ${count('fail')}`);
  process.exit(count('fail') ? 1 : 0);
};

main();
