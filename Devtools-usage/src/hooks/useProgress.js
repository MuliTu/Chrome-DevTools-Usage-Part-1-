import { useState, useEffect } from 'react';

const KEY = 'devtools_done_v3';

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
}

export function useProgress() {
  const [done, setDone] = useState(load);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(done));
  }, [done]);

  const markDone = (id) => setDone(prev => prev.includes(id) ? prev : [...prev, id]);
  const reset = () => setDone([]);

  return { done, markDone, reset };
}
