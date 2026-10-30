export const REQUEST_TIMEOUT_MS = 15000;

export async function api(path, options = {}) {
  const controller = new AbortController();
  const method = (options.method || 'GET').toUpperCase();
  const reading = method === 'GET' || method === 'HEAD';
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(path, {
      ...options,
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...options.headers },
    });
    let data;
    try {
      data = await response.json();
    } catch (error) {
      if (timedOut) throw error;
      throw new Error(reading
        ? 'The server returned an unreadable response. Refresh data to try again.'
        : 'The server returned an unreadable response. Refresh data to check whether the change was saved before trying again.');
    }
    if (!response.ok) throw new Error(data?.error?.message || 'The request failed.');
    return data;
  } catch (error) {
    if (timedOut) throw new Error(reading
      ? 'The request timed out. Use Refresh data to try again.'
      : 'The request timed out. The change may have been saved. Refresh data to check before trying again.');
    if (error instanceof TypeError) throw new Error(reading
      ? 'Could not reach the server. Check your connection and use Refresh data.'
      : 'Could not confirm the save. Check your connection and refresh data before trying again.');
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
