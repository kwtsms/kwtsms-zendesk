import { useState, useCallback } from 'react';
import { useZafClient } from './useZafClient';

export function useApi() {
  const client = useZafClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const request = useCallback(async (method, path, data = null) => {
    if (!client) return null;
    setLoading(true);
    setError(null);

    try {
      const metadata = await client.metadata();
      const backendUrl = metadata.settings.backend_url;
      const context = await client.context();

      const options = {
        url: `${backendUrl}${path}`,
        type: method,
        contentType: 'application/json',
        headers: {
          Authorization: `Bearer ${context.encodedToken || ''}`,
        },
        secure: true,
      };

      if (data) {
        options.data = JSON.stringify(data);
      }

      const response = await client.request(options);
      setLoading(false);
      return response;
    } catch (err) {
      const message = err.responseJSON?.error || err.message || 'Request failed';
      setError(message);
      setLoading(false);
      throw err;
    }
  }, [client]);

  const get = useCallback((path) => request('GET', path), [request]);
  const put = useCallback((path, data) => request('PUT', path, data), [request]);
  const post = useCallback((path, data) => request('POST', path, data), [request]);
  const del = useCallback((path) => request('DELETE', path), [request]);

  return { get, put, post, del, loading, error };
}
