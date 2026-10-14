// Некоторые трекеры (например, LimeTorrents) отдают заголовки Link: rel=preload, и браузер применяет их
// к странице расширения, сделавшей запрос: грузит чужие стили и пишет предупреждения в консоль.
// Убираем Link из ответов на запросы самого расширения.

const RULE_ID = 1;

const bindStripPreloadHeaders = () => {
  if (!chrome.declarativeNetRequest) return;

  chrome.declarativeNetRequest.updateSessionRules({
    removeRuleIds: [RULE_ID],
    addRules: [{
      id: RULE_ID,
      priority: 1,
      action: {
        type: 'modifyHeaders',
        responseHeaders: [{header: 'link', operation: 'remove'}],
      },
      condition: {
        initiatorDomains: [chrome.runtime.id],
        resourceTypes: ['xmlhttprequest'],
      },
    }],
  }, () => {
    const err = chrome.runtime.lastError;
    err && console.error('bindStripPreloadHeaders error', err);
  });
};

export {RULE_ID as STRIP_PRELOAD_RULE_ID};
export default bindStripPreloadHeaders;
