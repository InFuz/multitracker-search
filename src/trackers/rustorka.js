// ==UserScript==
// @name Rustorka
// @description Русский торрент-трекер: фильмы, сериалы, игры, программы, музыка.
// @icon data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwwAADsMBx2+oZAAAABp0RVh0U29mdHdhcmUAUGFpbnQuTkVUIHYzLjUuMTFH80I3AAABSUlEQVQ4T2P4TyLAruHGwxdQFgbAouHC7efy/k3T1x2H8lEBuoa3n745ZUwzTejVCG7bsP8iVBQJoGi4ev955dTNTplTz954nNK82jNvBlAEKgcDDJuPXF2z98KSHacnrzic3LDCp2jW6r0ggy/feRpVu9SvaE5G++ruxftmrT8BVAnSMGPN0Zj6ZYEl8+Zvwe7orYevxTUsDiydD1QJ5IKcdPXuE9ecmZHVS8EK0EHphE3WKZNW77kA4UL9cOrqfcXAFr2ITggXDnK71wk6Vc7bdBLKR/Z0UMk8Jf9WKAcGMjvWyHo1QDlggNCgF9Fjmzx5w4ELUTULZX2bHTMmr9h1rnzKZm77YqgKMEBokPVtFHaukPNp9i2cOWn5gYT6pSqBraKuNVzW5VAVYIDQkNK6HBKgyODg+Xu5vauhHDBAaCAS0FrD//8AwGeYuQ79m24AAAAASUVORK5CYII=
// @trackerURL https://rustorka.com/forum/tracker.php
// @version 1.1.1
// @connect *://rustorka.com/*
// @require exKit
// ==/UserScript==

const code = {
  "version": 3,
  "type": "kit",
  "description": {
    "icon": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwwAADsMBx2+oZAAAABp0RVh0U29mdHdhcmUAUGFpbnQuTkVUIHYzLjUuMTFH80I3AAABSUlEQVQ4T2P4TyLAruHGwxdQFgbAouHC7efy/k3T1x2H8lEBuoa3n745ZUwzTejVCG7bsP8iVBQJoGi4ev955dTNTplTz954nNK82jNvBlAEKgcDDJuPXF2z98KSHacnrzic3LDCp2jW6r0ggy/feRpVu9SvaE5G++ruxftmrT8BVAnSMGPN0Zj6ZYEl8+Zvwe7orYevxTUsDiydD1QJ5IKcdPXuE9ecmZHVS8EK0EHphE3WKZNW77kA4UL9cOrqfcXAFr2ITggXDnK71wk6Vc7bdBLKR/Z0UMk8Jf9WKAcGMjvWyHo1QDlggNCgF9Fjmzx5w4ELUTULZX2bHTMmr9h1rnzKZm77YqgKMEBokPVtFHaukPNp9i2cOWn5gYT6pSqBraKuNVzW5VAVYIDQkNK6HBKgyODg+Xu5vauhHDBAaCAS0FrD//8AwGeYuQ79m24AAAAASUVORK5CYII=",
    "name": "Rustorka",
    "description": "Русский торрент-трекер: фильмы, сериалы, игры, программы, музыка.",
    "version": "1.1.1"
  },
  "search": {
    "url": "https://rustorka.com/forum/tracker.php",
    "method": "POST",
    "body": "nm=%search%",
    "encoding": "cp1251",
    "charset": "windows-1251"
  },
  "auth": {
    "url": "https://rustorka.com/forum/login.php",
    "loginForm": {"selector": "#tms-auth-required"}
  },
  "selectors": {
    "row": {"selector": "tr[id^=\"tor_\"]:has(a[href*=\"download.php?id=\"])"},
    "categoryTitle": {"selector": "a[href*=\"tracker.php?f=\"]", "pipeline": [{"name": "getText"}, {"name": "trim"}]},
    "categoryUrl": {"selector": "a[href*=\"tracker.php?f=\"]", "pipeline": [{"name": "getProp", "args": ["href"]}]},
    "categoryId": {"selector": "a[href*=\"tracker.php?f=\"]", "pipeline": [{"name": "getProp", "args": ["href"]}]},
    "title": {"selector": "a[href*=\"viewtopic.php?t=\"]", "pipeline": [{"name": "getText"}, {"name": "trim"}]},
    "url": {"selector": "a[href*=\"viewtopic.php?t=\"]", "pipeline": [{"name": "getProp", "args": ["href"]}]},
    "size": {"selector": "td:eq(6)>u", "pipeline": [{"name": "getText"}, {"name": "toInt"}]},
    "downloadUrl": {"selector": "a[href*=\"download.php?id=\"]", "pipeline": [{"name": "getProp", "args": ["href"]}]},
    "seeds": {"selector": "td.seedmed", "pipeline": [{"name": "getText"}, {"name": "toInt"}]},
    "peers": {"selector": "td.leechmed", "pipeline": [{"name": "getText"}, {"name": "toInt"}]},
    "date": {"selector": "td:last-child>u", "pipeline": [{"name": "getText"}, {"name": "toInt"}]},
    "nextPageUrl": {"selector": "div.nav a:contains(\"След\")", "pipeline": [{"name": "getProp", "args": ["href"]}]}
  }
};

// Поиск защищён собственной капчей сайта (403): пройти её можно на странице tracker.php,
// поэтому trackerURL указывает туда — на неё ведёт значок «Войти».
code.hooks = {};
code.hooks.transform = {};

code.hooks.onGetDoc = (session, doc) => {
  if (/\/login\.php/.test(session.response.url) && doc.body) {
    const marker = doc.createElement('div');
    marker.id = 'tms-auth-required';
    doc.body.appendChild(marker);
  }
};

code.hooks.transform.categoryId = (session, value) => {
  return exKit.funcList.idInCategoryListInt(code, value || '', /f=([0-9]+)/);
};

API_exKit(code);
