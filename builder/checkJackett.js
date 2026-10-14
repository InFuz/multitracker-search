require("@babel/register")({
  "presets": ["@babel/preset-env"],
  cache: false
});

require('./defaultBuildEnv');

// Сверка адресов трекеров с определениями Jackett (https://github.com/Jackett/Jackett), где домены
// трекеров обновляют быстрее всего: подсказывает, что сайт переехал или у него появилось зеркало.
//   npm run checkJackett
// Код 1 — основной адрес в Jackett не совпадает с нашим или наш адрес Jackett считает устаревшим.

const fs = require('fs');
const {execFile} = require('child_process');
const path = require('path');
const getTrackerCodeMeta = require('../src/tools/getTrackerCodeMeta').default;
const getTrackerSearchUrls = require('./getTrackerSearchUrls');

const definitionsUrl = 'https://raw.githubusercontent.com/Jackett/Jackett/master/src/Jackett.Common/Definitions';

// id трекера → определение Jackett. Рутрекер в Jackett описан кодом на C#, The Pirate Bay у нас идёт через API apibay.org
const jackettIds = {
  booktracker: 'booktracker',
  kinozal: 'kinozal',
  limetorrents: 'limetorrents',
  megapeer: 'megapeer',
  nnmclub: 'noname-club',
  rgfootball: 'rgfootball',
  rustorka: 'rustorka',
  rutor: 'rutor',
  tapochek: 'tapochek',
};

const rootPath = path.join(__dirname, '..');

const getHost = url => new URL(url).hostname;

// Через curl: он учитывает прокси из HTTPS_PROXY (Node 18 — нет), а GitHub бывает доступен только через прокси
const getText = url => new Promise((resolve) => {
  execFile('curl', ['-sL', '--max-time', '30', '-w', '\\n%{http_code}', url], {maxBuffer: 10 * 1024 * 1024}, (err, stdout) => {
    const pos = (stdout || '').lastIndexOf('\n');
    resolve({status: err ? 0 : parseInt(stdout.slice(pos + 1), 10), text: (stdout || '').slice(0, pos)});
  });
});

// links: / legacylinks: из YAML-определения (список строк, комментарии после #)
const getYamlList = (yaml, key) => {
  const m = new RegExp(`^${key}:\\s*\\n((?:[ \\t]+-[^\\n]*\\n)+)`, 'm').exec(yaml);
  if (!m) return [];
  return m[1].split('\n').map(line => line.replace(/#.*$/, '').replace(/^\s*-\s*/, '').trim()).filter(Boolean);
};

// хосты из @connect вида *://host/*
const getConnectHosts = connect => (connect || []).map((pattern) => {
  const m = /^[^:]+:\/\/([^/]+)/.exec(pattern);
  return m ? m[1] : null;
}).filter(host => host && host.indexOf('*') === -1);

const checkTracker = async (id, jackettId) => {
  const code = fs.readFileSync(path.join(rootPath, 'src/trackers', `${id}.js`), 'utf8');
  const meta = getTrackerCodeMeta(code);
  const {searchUrl, mirrors} = getTrackerSearchUrls(code);
  const primaryHost = searchUrl ? getHost(searchUrl) : null;
  const ourHosts = new Set([primaryHost, ...mirrors.map(getHost), ...getConnectHosts(meta.connect)].filter(Boolean));

  const response = await getText(`${definitionsUrl}/${jackettId}.yml`);
  if (response.status !== 200) {
    return {id, flagged: false, failed: true, lines: [`определение ${jackettId}.yml недоступно (${response.status})`]};
  }
  const yaml = response.text;
  const links = getYamlList(yaml, 'links').map(getHost);
  const legacyLinks = getYamlList(yaml, 'legacylinks').map(getHost);

  const lines = [];
  let flagged = false;
  if (links[0] && !ourHosts.has(links[0])) {
    flagged = true;
    lines.push(`основной адрес в Jackett — ${links[0]}, у нас его нет`);
  }
  if (primaryHost && legacyLinks.includes(primaryHost) && !links.includes(primaryHost)) {
    flagged = true;
    lines.push(`наш основной адрес ${primaryHost} Jackett считает устаревшим`);
  }
  const otherLinks = links.filter(host => !ourHosts.has(host));
  if (otherLinks.length && !(otherLinks.length === 1 && otherLinks[0] === links[0])) {
    lines.push(`другие адреса в Jackett (могут быть сторонними прокси): ${otherLinks.join(', ')}`);
  }
  if (!lines.length) {
    lines.push(`совпадает: ${links.join(', ')}`);
  }
  return {id, flagged, lines};
};

const main = async () => {
  let flaggedCount = 0;
  for (const [id, jackettId] of Object.entries(jackettIds)) {
    let report;
    try {
      report = await checkTracker(id, jackettId);
    } catch (err) {
      report = {id, flagged: false, failed: true, lines: [`ошибка: ${err.message}`]};
    }
    if (report.flagged) flaggedCount++;
    console.log(`${report.flagged ? '!' : report.failed ? '–' : '✓'} ${id}`);
    report.lines.forEach(line => console.log(`    ${line}`));
  }
  process.exit(flaggedCount ? 1 : 0);
};

main();
