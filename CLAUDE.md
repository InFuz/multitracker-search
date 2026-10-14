# multitracker-search

Форк заархивированного расширения TMS (Torrents MultiSearch, Feverqwe/tSearch): поиск сразу по нескольким торрент-трекерам. Репозиторий: https://github.com/InFuz/multitracker-search. Сборка и устройство трекеров описаны в `README.md`, статус и известные ограничения — в `CHROMEWEBSTORE.md`.

## Окружение

- Manifest V3: фон — service worker (`src/background`), без `window`/DOM. Пользователь работает в Vivaldi 8.x, расширение подключено как распакованное из `dist/dist`.
- Сборка: Node 18 (`nvm use`), `npm run release` (webpack 4). Скрипт сам пересоздаёт `src/trackers.json` и `src/explorers.json` и собирает `dist/dist`. После сборки расширение перезагружается в `vivaldi://extensions`.
- `gh` залогинен как InFuz, пушить в форк можно.

## Трекеры и подборки

- Трекеры лежат в `src/trackers/*.js`, подборки главной страницы — в `src/explorerModules/*.js`. Сборка копирует их как есть.
- При изменении трекера или модуля обязательно поднимай `@version` (и `version` в описании кода), иначе у установленного расширения останется закэшированная старая версия.
- Удалённые трекеры перечислены в `src/tools/removedTrackerIds.js`: они вычищаются из кэша и профилей.
- Актуальные селекторы удобно сверять с определениями Jackett (`src/Jackett.Common/Definitions`).

## Особенности сети и защиты сайтов

- Первое соединение с сайтом часто обрывается (ERR_SOCKET_NOT_CONNECTED, ERR_QUIC_PROTOCOL_ERROR.QUIC_NETWORK_IDLE_TIMEOUT: HTTP/3 в этой сети не проходит), на этот случай все сетевые запросы идут через `src/tools/retryOnNetworkError.js`. Корпоративный VPN-DNS не резолвит часть трекеров.
- Ответы некоторых трекеров содержат `Link: rel=preload`, браузер применял их к странице расширения; сервис-воркер снимает этот заголовок DNR-правилом (`src/tools/stripPreloadHeaders.js`).
- Cloudflare хранит `cf_clearance` как разделённую (partitioned) куку, и браузер не отправляет её в запросы расширения. Расширение перед запросом читает её через `chrome.cookies` и добавляет в Cookie сессионным правилом `declarativeNetRequest` на хост (`src/tools/partitionedCookies.js`).
- Ответы 403/503 показываются в интерфейсе ссылкой «Войти» на сайт трекера (`src/stores/SearchStore.js`).
- У Rustorka своя капча на `tracker.php`, привязанная к сессии (`PHPSESSID`); пользователь проходит её в браузере. IMDb иногда отвечает 202 с пустым телом (AWS WAF) — такая секция подборок показывает ссылку на сайт.

## Тестирование

- Трекеры со входом (Рутрекер, Книжный трекер, Tapochek, Piratbit, Rustorka) и трекеры за Cloudflare проверить можно только в браузере пользователя.
- Для остального используй отдельный экземпляр Chrome (или Vivaldi) через puppeteer-core: `pipe: true`, `enableExtensions: true`, временный профиль, `browser.installExtension(<путь к dist/dist>)`, DoH в «Local State» профиля. Основной профиль пользователя не трогай.

## Соглашения

- Коммиты и комментарии в коде — на русском.
