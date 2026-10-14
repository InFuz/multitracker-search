require("@babel/register")({
  "presets": ["@babel/preset-env"],
  cache: false
});

require('./defaultBuildEnv');

// Проверка трекеров и подборок перед сборкой.
// Установленное расширение хранит код модулей у себя и заменяет его только на более новую @version,
// поэтому любое изменение файла должно сопровождаться подъёмом версии относительно:
// - последней сборки (dist/dist) — её код уже загружен в браузер;
// - HEAD и origin/master — оттуда модули приходят автообновлением по @downloadURL.
// Хук pre-push проверяет отправляемый коммит относительно master на сервере:
//   node builder/checkModules.js --current <sha> --baseline <sha>

const fs = require('fs');
const path = require('path');
const {execFileSync} = require('child_process');
const compareVersions = require('compare-versions');
const getTrackerCodeMeta = require('../src/tools/getTrackerCodeMeta').default;
const getExploreModuleCodeMeta = require('../src/tools/getExploreModuleCodeMeta').default;
const removedTrackerIds = require('../src/tools/removedTrackerIds').default;
const {getBuiltInModuleUrl} = require('../src/tools/builtInModules');
const getArgvValue = require('./getArgvValue');

const rootPath = path.join(__dirname, '..');

const moduleTypes = [
  {type: 'trackers', getMeta: getTrackerCodeMeta, removedIds: removedTrackerIds},
  {type: 'explorerModules', getMeta: getExploreModuleCodeMeta, removedIds: null},
];

const git = (args) => {
  try {
    return execFileSync('git', args, {cwd: rootPath, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore']});
  } catch (err) {
    return null;
  }
};

const getGitBaseline = (ref) => {
  if (git(['rev-parse', '--verify', '--quiet', `${ref}^{commit}`]) === null) return null;
  return {
    name: ref,
    listIds: (type) => (git(['ls-tree', '--name-only', `${ref}:src/${type}`]) || '').split('\n')
      .filter(name => /\.js$/.test(name)).map(name => path.basename(name, '.js')),
    getCode: (type, id) => git(['show', `${ref}:src/${type}/${id}.js`]),
  };
};

const getDistBaseline = () => {
  const distPath = path.join(rootPath, 'dist/dist');
  if (!fs.existsSync(distPath)) return null;
  const readCode = (filename) => fs.existsSync(filename) ? fs.readFileSync(filename, 'utf8') : null;
  return {
    name: 'последняя сборка (dist/dist)',
    listIds: (type) => {
      const place = path.join(distPath, type);
      return fs.existsSync(place) ? fs.readdirSync(place).filter(name => /\.js$/.test(name)).map(name => path.basename(name, '.js')) : [];
    },
    getCode: (type, id) => readCode(path.join(distPath, type, `${id}.js`)),
  };
};

const getWorkingTree = () => ({
  name: 'рабочая копия',
  listIds: (type) => fs.readdirSync(path.join(rootPath, 'src', type)).filter(name => /\.js$/.test(name)).map(name => path.basename(name, '.js')),
  getCode: (type, id) => fs.readFileSync(path.join(rootPath, 'src', type, `${id}.js`), 'utf8'),
});

const currentRef = getArgvValue('--current');
const baselineRef = getArgvValue('--baseline');

const current = currentRef ? getGitBaseline(currentRef) : getWorkingTree();
if (!current) {
  console.error(`Коммит ${currentRef} не найден`);
  process.exit(1);
}

const baselines = (baselineRef ? [getGitBaseline(baselineRef)] : [getDistBaseline(), getGitBaseline('HEAD'), getGitBaseline('origin/master')]).filter(Boolean);

const errors = [];
const counts = {};

moduleTypes.forEach(({type, getMeta, removedIds}) => {
  const ids = current.listIds(type);
  counts[type] = ids.length;

  ids.forEach((id) => {
    const file = `src/${type}/${id}.js`;
    const code = current.getCode(type, id);

    let meta = null;
    try {
      meta = getMeta(code);
    } catch (err) {
      errors.push(`${file}: заголовок не разбирается — ${err.message}`);
      return;
    }

    const downloadURL = getBuiltInModuleUrl(type, id);
    if (meta.downloadURL !== downloadURL) {
      errors.push(`${file}: @downloadURL должен быть ${downloadURL}`);
    }

    if (/^\s*"description"\s*:\s*\{/m.test(code)) {
      errors.push(`${file}: уберите блок "description" из кода — название, описание, иконка и версия берутся из заголовка`);
    }

    baselines.forEach((baseline) => {
      const baseCode = baseline.getCode(type, id);
      if (baseCode === null || baseCode === code) return;

      let baseVersion = null;
      try {
        baseVersion = getMeta(baseCode).version;
      } catch (err) {
        return;
      }
      if (compareVersions(meta.version, baseVersion) <= 0) {
        errors.push(`${file}: код отличается от «${baseline.name}», но @version ${meta.version} не выше ${baseVersion}`);
      }
    });
  });

  if (removedIds) {
    baselines.forEach((baseline) => {
      baseline.listIds(type).forEach((id) => {
        if (ids.indexOf(id) === -1 && removedIds.indexOf(id) === -1) {
          errors.push(`src/${type}/${id}.js удалён (есть в «${baseline.name}»): добавьте "${id}" в src/tools/removedTrackerIds.js`);
        }
      });
    });
  }
});

if (errors.length) {
  console.error(`Проверка модулей не пройдена:\n${errors.map(line => `- ${line}`).join('\n')}`);
  process.exit(1);
}

console.log(`Модули в порядке (${current.name}): трекеров ${counts.trackers}, подборок ${counts.explorerModules}; сравнение с: ${baselines.map(b => b.name).join(', ') || '—'}`);
