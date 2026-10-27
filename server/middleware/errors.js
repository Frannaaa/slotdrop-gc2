// Keep parser and server failures in the same JSON format as route errors.
export function errorHandler(error, _req, res, next) {
  if (res.headersSent) return next(error);
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { code: 'INVALID_JSON', message: 'Send a valid JSON object.' } });
  }
  if (error.type === 'entity.too.large') {
    return res.status(413).json({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'Request body exceeds 16 KB.' } });
  }
  if (error instanceof URIError && error.status === 400) {
    return res.status(400).json({ error: { code: 'INVALID_PATH', message: 'The URL contains an invalid encoded value.' } });
  }
  if (['charset.unsupported', 'encoding.unsupported'].includes(error.type)) {
    return res.status(415).json({ error: { code: 'UNSUPPORTED_MEDIA_TYPE', message: 'Use UTF-8 JSON with a supported content encoding.' } });
  }
  if ([400, 404, 409, 503].includes(error.status) && typeof error.code === 'string') {
    return res.status(error.status).json({ error: { code: error.code, message: error.message } });
  }
  // Unexpected internal messages and stack traces never go to the browser.
  return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected server error occurred.' } });
}
