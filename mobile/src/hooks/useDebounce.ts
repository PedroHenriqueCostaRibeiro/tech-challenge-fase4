import { useEffect, useState } from 'react';

/** Devolve `value` só depois que ele parar de mudar por `delay` ms (ex.: busca ao digitar). */
export function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
