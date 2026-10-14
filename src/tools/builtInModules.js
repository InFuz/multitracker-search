// Встроенные трекеры и подборки обновляются по @downloadURL из master форка:
// исправление, отправленное в master с новой @version, расширение подхватит само (проверка раз в сутки).
const builtInModulesBaseUrl = 'https://raw.githubusercontent.com/InFuz/multitracker-search/master/src';

// type — каталог в src: 'trackers' или 'explorerModules'
const getBuiltInModuleUrl = (type, id) => `${builtInModulesBaseUrl}/${type}/${id}.js`;

// Встроенный трекер форка или оригинального расширения (Feverqwe/tSearch), а не свой или из каталога «Внешние»
const isBuiltInTrackerUrl = url => /\/(feverqwe\/tsearch|infuz\/multitracker-search)\/.*\/src\/trackers\//i.test(url || '');

// Каталог «Внешние» в редакторе профиля
const externalTrackersRepositoryUrl = 'https://api.github.com/repos/InFuz/multitracker-search/contents/external';
const legacyExternalTrackersRepositoryUrl = 'https://api.github.com/repos/feverqwe/tSearch/contents/external';

export {getBuiltInModuleUrl, isBuiltInTrackerUrl, externalTrackersRepositoryUrl, legacyExternalTrackersRepositoryUrl};
