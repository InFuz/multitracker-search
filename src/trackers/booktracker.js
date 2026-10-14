// ==UserScript==
// @name Книжный трекер
// @description Книжный трекер (booktracker.org), рукописи не горят.
// @icon data:image/x-icon;base64,AAABAAEAEBAAAAEAGABoAwAAFgAAACgAAAAQAAAAIAAAAAEAGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/BAX/BAX/BAX/BAX/BAX/BAX/BAX/BAX/BAX/BAX/BAX/BAX/BAX/BAX/BAX/BAX/BAX/BAX/BAX/BAX/BAT/BAXmlZD///HDEg//BwP/AgnyBQj/BAX/BAX/BAX/BAX/BAX/BAX/BAX/BAX3BwL2CQ3+8fPv+/2mTkfzAAD/Agj5BAj/BAX/BAX/BAX/BAX/BAX/BAX/BAX/BAX/AgKSEgf9///++v/43dPrBAD7BAbwBgj/BAX/BAX/BAX/BAX/BAX/BAX/BAX/BAXyAAH7lo7/7+v/2Nf//vHBKiP/BQLtCAT/BAX/BAX/BAX/BAX7BQX/BAX/BQb8BgbBFAz//+f038nvuqX/8Ob//+vJBwD9AAD/BAX/BAX/BAX/BAX/BAX/BAX4BwbyCgilYFbCNjWzCQfzBwf0DAj6BAT7AAD/AQT/BAX/BAX/BAX/BAX7BQX/BAT6AgLRFxHq//PBAgn//fHj+e28gIaSCA/QEBD9AAD/BAX/BAX/BAX/BAXyBwT7BgTJISDQj4f/8ur/5ej/5OLVAAmqBgCWIR7/v8Xp9/P5BQX9BQX/BAX/BAX/BAT/BAXmr6jx8/SlIyTc8eL/9PLx//7u9v//+fHSXUjfFAf0Cwn6Bgb/BAX/BAX5BwH/BAWtY1/z+Pfy9ur+pJm7CwqfMyjp2dLy/v75/v/0//XQKR73DAn/BQLtCAT/BQT/BQL6AAbRloP5/P//9//1+vn///G6XU7/CQ+/CwzRyL7l6M//Aw7/BAX7BgT/BAXyBwX9AgH/BwfWBgDjzcH/+Pvn////9P/y/v7/fYL/AAr/tKT6AAT/BAT0BwT/BAX/BAX/BAX/BAX/BAX/BAX/BAX/BAX/REL0++zu9PnBh4H/BAX/BAX/BAX/BAX/BAX/BAX/BAX/BAX/BAX/BAX/BAX/BAX9Dgv/Bxfu8u3Stqv/BAX/BAX/BAX/BAX/BAX/BAX/BAX/BAX/BAX/BAX/BAX/BAX/BATyBwTskYjyAQr/BAX/BAX/BAX/BAUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
// @trackerURL https://booktracker.org/
// @version 1.1.0
// @connect *://booktracker.org/*
// @require exKit
// ==/UserScript==

const code = {
  "version": 3,
  "type": "kit",
  "description": {
    "icon": "data:image/x-icon;base64,AAABAAEAEBAAAAEAGABoAwAAFgAAACgAAAAQAAAAIAAAAAEAGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/BAX/BAX/BAX/BAX/BAX/BAX/BAX/BAX/BAX/BAX/BAX/BAX/BAX/BAX/BAX/BAX/BAX/BAX/BAX/BAX/BAT/BAXmlZD///HDEg//BwP/AgnyBQj/BAX/BAX/BAX/BAX/BAX/BAX/BAX/BAX3BwL2CQ3+8fPv+/2mTkfzAAD/Agj5BAj/BAX/BAX/BAX/BAX/BAX/BAX/BAX/BAX/AgKSEgf9///++v/43dPrBAD7BAbwBgj/BAX/BAX/BAX/BAX/BAX/BAX/BAX/BAXyAAH7lo7/7+v/2Nf//vHBKiP/BQLtCAT/BAX/BAX/BAX/BAX7BQX/BAX/BQb8BgbBFAz//+f038nvuqX/8Ob//+vJBwD9AAD/BAX/BAX/BAX/BAX/BAX/BAX4BwbyCgilYFbCNjWzCQfzBwf0DAj6BAT7AAD/AQT/BAX/BAX/BAX/BAX7BQX/BAT6AgLRFxHq//PBAgn//fHj+e28gIaSCA/QEBD9AAD/BAX/BAX/BAX/BAXyBwT7BgTJISDQj4f/8ur/5ej/5OLVAAmqBgCWIR7/v8Xp9/P5BQX9BQX/BAX/BAX/BAT/BAXmr6jx8/SlIyTc8eL/9PLx//7u9v//+fHSXUjfFAf0Cwn6Bgb/BAX/BAX5BwH/BAWtY1/z+Pfy9ur+pJm7CwqfMyjp2dLy/v75/v/0//XQKR73DAn/BQLtCAT/BQT/BQL6AAbRloP5/P//9//1+vn///G6XU7/CQ+/CwzRyL7l6M//Aw7/BAX7BgT/BAXyBwX9AgH/BwfWBgDjzcH/+Pvn////9P/y/v7/fYL/AAr/tKT6AAT/BAT0BwT/BAX/BAX/BAX/BAX/BAX/BAX/BAX/BAX/REL0++zu9PnBh4H/BAX/BAX/BAX/BAX/BAX/BAX/BAX/BAX/BAX/BAX/BAX/BAX9Dgv/Bxfu8u3Stqv/BAX/BAX/BAX/BAX/BAX/BAX/BAX/BAX/BAX/BAX/BAX/BAX/BATyBwTskYjyAQr/BAX/BAX/BAX/BAUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    "name": "Книжный трекер",
    "description": "Книжный трекер (booktracker.org), рукописи не горят.",
    "version": "1.1.0"
  },
  "search": {
    "url": "https://booktracker.org/tracker.php",
    "method": "GET",
    "query": "nm=%search%"
  },
  "selectors": {
    "row": {"selector": "tr[id^=\"tor_\"]:has(a[href*=\"download.php?id=\"])"},
    "categoryTitle": {"selector": "a.gen", "pipeline": [{"name": "getText"}, {"name": "trim"}]},
    "categoryUrl": {"selector": "a.gen", "pipeline": [{"name": "getProp", "args": ["href"]}]},
    "categoryId": {"selector": "a.gen", "pipeline": [{"name": "getProp", "args": ["href"]}]},
    "title": {"selector": "a.tLink", "pipeline": [{"name": "getText"}, {"name": "trim"}]},
    "url": {"selector": "a.tLink", "pipeline": [{"name": "getProp", "args": ["href"]}]},
    "size": {"selector": "td:eq(5)>u", "pipeline": [{"name": "getText"}, {"name": "toInt"}]},
    "downloadUrl": {"selector": "a[href*=\"download.php?id=\"]", "pipeline": [{"name": "getProp", "args": ["href"]}]},
    "seeds": {"selector": "td.seedmed", "pipeline": [{"name": "getText"}, {"name": "toInt"}]},
    "peers": {"selector": "td.leechmed", "pipeline": [{"name": "getText"}, {"name": "toInt"}]},
    "date": {"selector": "td:last-child>u", "pipeline": [{"name": "getText"}, {"name": "toInt"}]},
    "nextPageUrl": {"selector": "div.nav a:contains(\"След\")", "pipeline": [{"name": "getProp", "args": ["href"]}]}
  },
  "auth": {
    "url": "https://booktracker.org/login.php",
    "loginForm": {"selector": "#tms-auth-required"}
  }
};

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
