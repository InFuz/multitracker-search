class StatusCodeError extends Error {
  constructor(statusCode, body, options, response) {
    const message = statusCode + ' - ' + JSON.stringify(body);
    super(message);

    this.name = 'StatusCodeError';
    this.statusCode = statusCode;
    this.options = options;
    this.response = response;
    // Cloudflare отвечает на запрос проверкой (403/503 с заголовком cf-mitigated: challenge):
    // это не выход из аккаунта, а истёкшая проверка браузера (кука cf_clearance)
    const headers = response && response.headers;
    this.cloudflareChallenge = Boolean(headers && typeof headers.get === 'function' &&
      headers.get('cf-mitigated') === 'challenge');
  }
}

class AbortError extends Error {
  constructor(message) {
    super(message);

    this.name = 'AbortError';
    this.code = 'EABORT';
  }
}

class ErrorWithCode extends Error {
  constructor(message, code) {
    super(message);

    this.code = code;
  }
}

export {StatusCodeError, AbortError, ErrorWithCode};