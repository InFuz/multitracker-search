# Chrome Web Store Listing — Torrents MultiSearch (TMS)

> Last Updated: 2026-10-14

Форк multitracker-search (оригинал — Feverqwe/tSearch, архивирован в 2022).
Используется как распакованное расширение в Vivaldi (сборка `dist/dist`); в Chrome Web Store не публикуется.

## Store Listing

**Extension Name**
Torrents MultiSearch (из `_locales/*/messages.json` → `extName`)

**Short Description**
Ищет раздачи сразу на нескольких торрент-трекерах и показывает результаты в одной таблице с фильтрами.

**Detailed Description**
Torrents MultiSearch ищет раздачи одновременно на нескольких торрент-трекерах и собирает результаты в одну таблицу.

Возможности:
Поиск сразу по Рутрекеру, NNM-Club, Кинозалу, Рутору, MegaPeer, The Pirate Bay, LimeTorrents, rgFootball, Книжному трекеру, Tapochek и Piratbit.
Фильтры по категории, размеру, дате, сидам и пирам; подсветка совпадений; сортировка по релевантности.
Профили с собственными наборами трекеров.
Главная страница с подборками фильмов, сериалов и игр (Кинопоиск, IMDb, GameGuru) — клик по постеру запускает поиск.
Поиск из адресной строки (ключевое слово «tms») и из контекстного меню по выделенному тексту.

Как пользоваться:
Нажмите на значок расширения, введите запрос и нажмите «Найти». Для трекеров с регистрацией войдите на сайт трекера в этом же браузере — значок «Войти» рядом с трекером ведёт на нужную страницу.

**Category**
Search Tools

**Single Purpose**
Поиск раздач одновременно на нескольких торрент-трекерах с объединением результатов.

**Primary Language**
Russian (также English, Ukrainian)

## Graphics & Assets

| Asset | Dimensions | Status | Filename |
|-------|-----------|--------|----------|
| Store Icon | 128×128 PNG | ✅ Ready | src/assets/icons/icon_128.png |
| Screenshot 1 | 1280×800 | ⬜ Not created | |
| Screenshot 2 | 1280×800 | ⬜ Not created | |
| Small Promo Tile | 440×280 | ⬜ Not created | |

### Screenshot Notes
1. Страница результатов по запросу с несколькими трекерами и фильтрами.
2. Главная страница с подборками фильмов/сериалов.

## Permissions Justification

| Permission | Type | Justification |
|------------|------|---------------|
| storage | permissions | Хранит настройки, профили трекеров, историю запросов и кэш подборок главной страницы. |
| unlimitedStorage | permissions | Код трекеров и кэш подборок с постерами превышают стандартную квоту хранилища. |
| contextMenus | permissions | Пункт «Искать в TMS» для выделенного на странице текста. |
| tabs (optional) | permissions | Запрашивается только если пользователь включил режим «через вкладку» для трекера: запрос выполняется во вкладке сайта трекера. |
| http://\*/\*, https://\*/\* | host_permissions | Расширение отправляет поисковый запрос на сайты выбранных трекеров и в источники подборок (Кинопоиск, IMDb, GameGuru); набор трекеров настраивается пользователем, в т.ч. можно добавить свой трекер. |

## Privacy & Data Use

### Data Collection

**Does the extension collect user data?** Yes (оригинальный код содержит Google Analytics)

| Data Type | Collected? | Transmitted Off-Device? | Purpose | Shared with Third Parties? |
|-----------|-----------|------------------------|---------|---------------------------|
| Web history | No | — | — | — |
| User activity | Yes | Yes (Google Analytics) | Статистика использования оригинального расширения | Google |
| Website content | No | — | Результаты поиска обрабатываются локально | — |
| Authentication info | No | — | Используются куки сайтов трекеров самого браузера, расширение их не читает и не хранит | — |

История запросов хранится только локально.

### Data Use Certification
- [x] Data is NOT sold to third parties
- [x] Data is NOT used for purposes unrelated to the extension's core functionality
- [x] Data is NOT used for creditworthiness or lending purposes

## Privacy Policy

**Privacy Policy URL**
Не опубликована (расширение не публикуется в магазине).

## Distribution

**Visibility**: Private (распакованное расширение)

## Developer Info

**Publisher Name**: —
**Contact Email**: —

## Version History

| Version | Date | Changes | Status |
|---------|------|---------|--------|
| 3.2.0 | 2026-10-14 | Повтор сетевых запросов при сбое первого соединения; Рутрекер, Кинозал (зеркало kinozal.me), rgFootball, Книжный трекер, Tapochek — новые селекторы и определение «нужна авторизация»; The Pirate Bay через JSON API; добавлены MegaPeer и LimeTorrents; удалены мёртвые трекеры (brodim, extratorrent, filebase, inmac, megashara, opentorrent, tfile) — в т.ч. из кэша и профилей; при 403 (Cloudflare) у трекера показывается ссылка на сайт; починены подборки Кинопоиска (в кино, сериалы), IMDb и GameGuru; пустой кэш подборок больше не используется; при защите IMDb от ботов секция показывает ссылку на сайт | Draft |
| 3.1.2 | 2020 | Последняя версия оригинального расширения | Published (original) |

## Review Notes

### Known Issues / Limitations
- Manifest V2. Chrome и большинство Chromium-браузеров MV2 больше не загружают; работает в Vivaldi. Для публикации в Chrome Web Store нужна миграция на Manifest V3 (фоновая страница → service worker, `browser_action` → `action`, разбор HTML вне service worker через offscreen document).
- Рутрекер, Кинозал, Piratbit закрыты Cloudflare: поиск работает, только если сайт открыт в этом браузере и проверка пройдена (куки браузера используются запросами расширения).
- Рутрекер, Книжный трекер, Tapochek, Piratbit требуют входа на сайт.
- Piratbit (pb.wtf) не проверен — сайт недоступен без прохождения проверки Cloudflare.
- «Кинопоиск: Избранное» требует входа на Кинопоиск, не проверялся.
- Подборки IMDb иногда требуют один раз открыть imdb.com в браузере (защита от ботов).

### Rejection History
—
