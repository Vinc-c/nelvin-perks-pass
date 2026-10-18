import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Runs an async loader and tracks { data, loading, error }. `reload()`
 * re-runs it. Results from a stale run (deps changed meanwhile) are ignored.
 */
export function useAsync(loader, deps = [], { initial = null, enabled = true } = {}) {
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);
  const seq = useRef(0);

  const run = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    const id = ++seq.current;
    setLoading(true);
    setError(null);
    try {
      const result = await loader();
      if (id === seq.current) setData(result);
    } catch (e) {
      if (id === seq.current) setError(e);
    } finally {
      if (id === seq.current) setLoading(false);
    }
  }, [enabled, ...deps]);

  useEffect(() => {
    run();
  }, [run]);

  return { data, loading, error, reload: run, setData };
}
