// На некоторых сетях первое соединение с хостом обрывается (например, QUIC_NETWORK_IDLE_TIMEOUT:
// HTTP/3 не проходит, и браузер переключается на TCP только со следующего запроса), а повтор проходит
const NETWORK_RETRY_COUNT = 3;
const NETWORK_RETRY_DELAY = 700;

/**
 * @param {function:Promise} request
 * @param {AbortSignal} [signal]
 * @return {Promise}
 */
const retryOnNetworkError = (request, signal) => {
  const attempt = (retryCount) => {
    return request().catch((err) => {
      // fetch отдаёт TypeError на сетевую ошибку, отмена — AbortError
      if (retryCount > 0 && !(signal && signal.aborted) && err instanceof TypeError) {
        return new Promise(resolve => setTimeout(resolve, NETWORK_RETRY_DELAY)).then(() => attempt(retryCount - 1));
      }
      throw err;
    });
  };
  return attempt(NETWORK_RETRY_COUNT);
};

export default retryOnNetworkError;
