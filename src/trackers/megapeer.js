// ==UserScript==
// @name MegaPeer
// @description Открытый русскоязычный торрент-трекер: фильмы, сериалы, музыка, игры, программы.
// @icon data:image/x-icon;base64,AAABAAEAEBAAAAEAIABWBAAAFgAAACgAAAAQAAAAIAAAAAEAIAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAACfn5//n5+f/5+fn/+fn5//np6e/56env+enp7/np6e/56env+enp7/np6e/56env+enp7/n5+f/5+fn/+fn5//n5+f/0BAZf8kJFn/JCRh/yQkaf8kJHD/JCR3/yQkef8kJHn/JCR3/yQkcP8kJGn/JCRh/yQkWf9AQGX/n5+f/56env8kJFn/AABN/wAAWv8AAGb/AABy/wAAev8xNob/MTaG/wAAev8AAHL/AABm/wAAWv8AAE3/JCRZ/5+fn/+enp7/JCRh/wAAWv8AAGn/AAB3/wAAhv8pKY//cHac/3B2nP8pKY//AACG/wAAd/8AAGn/AABa/yQkYf+fn5//np6e/yQkaf8AAGb/AAB3/wAAhv8MDJf/h4me/56foP+foKD/iIme/wwMl/8AAIb/AAB3/wAAZv8kJGn/n5+f/5+fn/8kJHD/AABy/wAAhv8MDJf/n6Cg/5+foP+fn6D/n6Cg/5+foP+fn6D/DAyX/wAAhv8AAHL/JCRw/5+fn/+fn5//JCR3/wAAev8hIYb/bW6D/4SEhP+EhIT/g4SE/4OEhP+DhIT/g4SE/21ug/8hIYb/AAB6/yQkd/+enp7/n5+f/ygoiP8/QZj/goWq/6anp/+mp6f/pqen/6SnqP+kp6j/pqen/6anp/+mp6f/hIWq/0FBl/8nJ4f/np6e/5+fn/8qKpH/QkSj/3Z4uP94eL//eHjF/7O1wP+8wMH/vMDB/7S1wP94eMX/eHi//3h4uP9DRKP/KSmR/52dnf+fn5//KiqQ/wcHmf8HB6r/Bwe7/wcHzP+ho8L/vb/A/76/wP+io8H/BwfM/wcHu/8HB6r/BweZ/ykpkP+cnJz/n5+f/yoqiv8HB5H/Bwei/wcHsP8HB8H/oaHB/729wf+9vcD/oqLA/wcHwf8HB7D/Bwei/wcHkf8pKYn/nJyc/5+fn/8qKoP/BweG/wcHlP8HB6P/Bwew/6GhvP++vr7/vb2+/6Cguv8HB7D/Bwej/wcHlP8HB4b/KSmD/5ycnP+fn5//Kip8/wcHe/8HB4j/BweU/wcHov+iorr/vr6//76+v/+hobr/Bwei/wcHlP8HB4j/Bwd7/ykpfP+dnZ3/n5+f/yoqdP8HB3D/Bwd7/wcHhv8HB5H/Wlql/2pqqP9paqj/Wlql/wcHkf8HB4b/Bwd7/wcHcP8pKXT/np6e/5+fn/9FRXr/Kip0/yoqfP8qKoP/KiqK/yoqkP8qKpH/KiqR/yoqkP8qKor/KiqD/yoqfP8qKnT/RER6/56env+fn5//n5+f/5+fn/+fn5//n5+f/5+fn/+fn5//n5+f/5+fn/+fn5//n5+f/5+fn/+fn5//n5+f/5+fn/+fn5//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==
// @trackerURL https://megapeer.vip
// @version 1.0.0
// @connect *://megapeer.vip/*
// @require exKit
// ==/UserScript==

const code = {
  "version": 3,
  "type": "kit",
  "description": {
    "icon": "data:image/x-icon;base64,AAABAAEAEBAAAAEAIABWBAAAFgAAACgAAAAQAAAAIAAAAAEAIAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAACfn5//n5+f/5+fn/+fn5//np6e/56env+enp7/np6e/56env+enp7/np6e/56env+enp7/n5+f/5+fn/+fn5//n5+f/0BAZf8kJFn/JCRh/yQkaf8kJHD/JCR3/yQkef8kJHn/JCR3/yQkcP8kJGn/JCRh/yQkWf9AQGX/n5+f/56env8kJFn/AABN/wAAWv8AAGb/AABy/wAAev8xNob/MTaG/wAAev8AAHL/AABm/wAAWv8AAE3/JCRZ/5+fn/+enp7/JCRh/wAAWv8AAGn/AAB3/wAAhv8pKY//cHac/3B2nP8pKY//AACG/wAAd/8AAGn/AABa/yQkYf+fn5//np6e/yQkaf8AAGb/AAB3/wAAhv8MDJf/h4me/56foP+foKD/iIme/wwMl/8AAIb/AAB3/wAAZv8kJGn/n5+f/5+fn/8kJHD/AABy/wAAhv8MDJf/n6Cg/5+foP+fn6D/n6Cg/5+foP+fn6D/DAyX/wAAhv8AAHL/JCRw/5+fn/+fn5//JCR3/wAAev8hIYb/bW6D/4SEhP+EhIT/g4SE/4OEhP+DhIT/g4SE/21ug/8hIYb/AAB6/yQkd/+enp7/n5+f/ygoiP8/QZj/goWq/6anp/+mp6f/pqen/6SnqP+kp6j/pqen/6anp/+mp6f/hIWq/0FBl/8nJ4f/np6e/5+fn/8qKpH/QkSj/3Z4uP94eL//eHjF/7O1wP+8wMH/vMDB/7S1wP94eMX/eHi//3h4uP9DRKP/KSmR/52dnf+fn5//KiqQ/wcHmf8HB6r/Bwe7/wcHzP+ho8L/vb/A/76/wP+io8H/BwfM/wcHu/8HB6r/BweZ/ykpkP+cnJz/n5+f/yoqiv8HB5H/Bwei/wcHsP8HB8H/oaHB/729wf+9vcD/oqLA/wcHwf8HB7D/Bwei/wcHkf8pKYn/nJyc/5+fn/8qKoP/BweG/wcHlP8HB6P/Bwew/6GhvP++vr7/vb2+/6Cguv8HB7D/Bwej/wcHlP8HB4b/KSmD/5ycnP+fn5//Kip8/wcHe/8HB4j/BweU/wcHov+iorr/vr6//76+v/+hobr/Bwei/wcHlP8HB4j/Bwd7/ykpfP+dnZ3/n5+f/yoqdP8HB3D/Bwd7/wcHhv8HB5H/Wlql/2pqqP9paqj/Wlql/wcHkf8HB4b/Bwd7/wcHcP8pKXT/np6e/5+fn/9FRXr/Kip0/yoqfP8qKoP/KiqK/yoqkP8qKpH/KiqR/yoqkP8qKor/KiqD/yoqfP8qKnT/RER6/56env+fn5//n5+f/5+fn/+fn5//n5+f/5+fn/+fn5//n5+f/5+fn/+fn5//n5+f/5+fn/+fn5//n5+f/5+fn/+fn5//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==",
    "name": "MegaPeer",
    "description": "Открытый русскоязычный торрент-трекер: фильмы, сериалы, музыка, игры, программы.",
    "version": "1.0.0"
  },
  "search": {
    "url": "https://megapeer.vip/browse.php",
    "method": "GET",
    "query": "search=%search%&cat=0&stype=0",
    "encoding": "cp1251",
    "charset": "windows-1251"
  },
  "selectors": {
    "row": {"selector": "tr.table_fon:has(a[href^=\"/torrent/\"])"},
    "title": {"selector": "a[href^=\"/torrent/\"]", "pipeline": [{"name": "getText"}, {"name": "trim"}]},
    "url": {"selector": "a[href^=\"/torrent/\"]", "pipeline": [{"name": "getProp", "args": ["href"]}]},
    "size": {"selector": "td:eq(-2)", "pipeline": [{"name": "getText"}, {"name": "legacySizeFormat"}]},
    "downloadUrl": {"selector": "a[href^=\"/download/\"]", "pipeline": [{"name": "getProp", "args": ["href"]}]},
    "seeds": {"selector": "td:eq(-1) font:eq(0)", "pipeline": [{"name": "getText"}, {"name": "toInt"}]},
    "peers": {"selector": "td:eq(-1) font:eq(1)", "pipeline": [{"name": "getText"}, {"name": "toInt"}]},
    "date": {"selector": "td:eq(0)", "pipeline": [{"name": "getText"}, {"name": "legacyReplaceMonth"}, {"name": "legacyParseDate", "args": ["1"]}]}
  }
};

code.hooks = {};
code.hooks.transform = {};

API_exKit(code);
