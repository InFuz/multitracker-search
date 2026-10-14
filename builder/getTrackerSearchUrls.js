// Адрес поиска и зеркала (search.mirrors) exKit-трекера из текста кода, без его выполнения
const getTrackerSearchUrls = (code) => {
  const searchUrl = /"search"\s*:\s*\{[^}]*?"url"\s*:\s*"([^"]+)"/.exec(code);
  const mirrors = /"mirrors"\s*:\s*\[([^\]]*)\]/.exec(code);
  return {
    searchUrl: searchUrl ? searchUrl[1] : null,
    mirrors: mirrors ? (mirrors[1].match(/"[^"]+"/g) || []).map(item => JSON.parse(item)) : [],
  };
};

module.exports = getTrackerSearchUrls;
