// ==UserScript==
// @name ThePirateBay
// @description Download music, movies, games, software and much more. The Pirate Bay is the world's largest bittorrent tracker.
// @icon data:image/png;base64,Qk04AwAAAAAAADYAAAAoAAAAEAAAABAAAAABABgAAAAAAAAAAADgTAAA4EwAAAAAAAAAAAAA/////////////////////////////////////////////////////v7+/////////////Pz8vb297Ozs////////////////////////////////4uLiSUlJ3d3d////////8/PzEhIScnJy8fHx////////////////////8fHxwsLCWFhYAAAAyMjI////////5+fnEBAQICAgQkJCV1dXZWVli4uLiYmJUlJSKioqPT09bm5uHh4eYWFhwcHBubm5bGxsQEBAp6end3d3FBQUAAAAFBQUOTk5ISEhGRkZPT09WVlZQkJCKioqJycnenp6AAAAQUFBPz8/YGBgjo6O0dHR+/v7////////7+/vxcXFnZ2dg4ODExMTQEBAv7+/AAAAgoKCjo6OpaWltra2qqqqpqampaWlpKSkra2tr6+vsbGx5eXll5eXW1tb1NTUcXFxmJiYAwMDAAAANzc3VFRUGxsbAAAAX19fPDw8ERERAAAAQUFB/v7+/Pz8////////nJycAAAAAAAAAAAAHx8fCwsLAAAAJiYmBQUFAAAAAAAAKysr+vr6////////////nJycAAAAAAAADw8PAAAAAAAAAAAAAAAADQ0NAwMDAAAANjY2+vr6////////////rq6uAAAANjY25eXlWVlZHx8fJycnIyMj0dHRhoaGAAAAV1dX////////////////r6+vAAAALS0t0tLSX19fsrKy2dnZZWVlsrKyiIiIAAAAWVlZ////////////////r6+vAAAAAAAABQUFAgICExMTEBAQAwMDAwMDAQEBAAAAWlpa////////////////q6urAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAVFRU////////////////19fXSUlJQUFBQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQkJCQkJCqKio/////////////////////////v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+////////////AAA%3D
// @trackerURL https://thepiratebay.org
// @version 2.0.0
// @connect *://apibay.org/*
// ==/UserScript==

// Сайт thepiratebay.org стал SPA, данные отдаёт JSON API apibay.org

const TRACKERS = [
  'udp://tracker.opentrackr.org:1337/announce',
  'udp://open.stealth.si:80/announce',
  'udp://tracker.torrent.eu.org:451/announce',
  'udp://tracker.bittor.pw:1337/announce',
  'udp://public.popcorn-tracker.org:6969/announce',
  'udp://tracker.dler.org:6969/announce',
  'udp://exodus.desync.com:6969',
  'udp://open.demonii.com:1337/announce'
];

// Индексы категорий TMS: serials 0, music 1, games 2, films 3, cartoon 4, books 5, soft 6, anime 7, doc 8, sport 9, xxx 10, humor 11
const getCategoryId = (cat) => {
  if (cat === 205 || cat === 208 || cat === 212) return 0;
  if (cat === 601) return 5;
  switch (Math.floor(cat / 100)) {
    case 1: return 1;
    case 2: return 3;
    case 3: return 6;
    case 4: return 2;
    case 5: return 10;
  }
  return -1;
};

const CATEGORY_TITLES = {1: 'Audio', 2: 'Video', 3: 'Applications', 4: 'Games', 5: 'Porn', 6: 'Other'};

const getMagnet = (item) => {
  return 'magnet:?xt=urn:btih:' + item.info_hash + '&dn=' + encodeURIComponent(item.name) +
    TRACKERS.map(tr => '&tr=' + encodeURIComponent(tr)).join('');
};

API_event('search', (request) => {
  return API_request({
    method: 'GET',
    url: 'https://apibay.org/q.php',
    query: {q: request.query, cat: ''},
    json: true
  }).then((response) => {
    const items = Array.isArray(response.body) ? response.body : [];
    const results = items.filter(item => item.id !== '0' && /^[0-9a-f]{40}$/i.test(item.info_hash)).map((item) => {
      const cat = parseInt(item.category, 10);
      return {
        categoryTitle: CATEGORY_TITLES[Math.floor(cat / 100)] || null,
        categoryUrl: 'https://thepiratebay.org/search.php?q=category:' + cat,
        categoryId: getCategoryId(cat),
        title: item.name,
        url: 'https://thepiratebay.org/description.php?id=' + item.id,
        size: parseInt(item.size, 10),
        downloadUrl: getMagnet(item),
        seeds: parseInt(item.seeders, 10),
        peers: parseInt(item.leechers, 10),
        date: parseInt(item.added, 10)
      };
    });
    return {success: true, results: results};
  });
});
