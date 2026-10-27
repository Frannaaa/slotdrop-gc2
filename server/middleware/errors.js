// Keep parser and server failures in the same JSON format as route errors.
export function errorHandler(error, _req, res, next) {
  if (res.headersSent) return next(error);
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { code: 'INVALID_JSON', message: 'Send a valid JSON object.' } });
  }
  if (error.type === 'entity.too.large') {
    return res.status(413).json({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'Request body exceeds 16 KB.' } });
  }
  // Unexpected internal messages and stack traces never go to the browser.
  return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected server error occurred.' } });
}
