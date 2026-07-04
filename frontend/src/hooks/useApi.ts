import { useState, useEffect } from 'react';
import mockData from '../data/mock-data.json';
import { getApiUrl } from '../config';

export function useApi<T>(
  endpoint: string,
  mockFallbackKey: string,
  pollIntervalMs?: number
): { data: T | null; loading: boolean; error: Error | null } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let active = true;

    const fetchData = async (isInitial = false) => {
      if (isInitial) setLoading(true);
      try {
        const response = await fetch(getApiUrl(endpoint));
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const json = await response.json();
        if (active) {
          setData(json);
          setError(null);
        }
      } catch (e) {
        if (active) {
          setData((mockData as Record<string, any>)[mockFallbackKey] as unknown as T ?? null);
          setError(e instanceof Error ? e : new Error(String(e)));
        }
      } finally {
        if (active && isInitial) {
          setLoading(false);
        }
      }
    };

    fetchData(true);

    let intervalId: any;
    if (pollIntervalMs) {
      intervalId = setInterval(() => {
        fetchData(false);
      }, pollIntervalMs);
    }

    return () => {
      active = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [endpoint, mockFallbackKey, pollIntervalMs]);

  return { data, loading, error };
}
