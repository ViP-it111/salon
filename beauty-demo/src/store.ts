import { useEffect, useState } from 'react';
import type { DB } from './types';
import { buildSeed } from './seed';

const KEY = 'beauty_salon_db_v1';

export function loadDB(): DB {
  const raw = localStorage.getItem(KEY);
  if (!raw) {
    const seed = buildSeed();
    localStorage.setItem(KEY, JSON.stringify(seed));
    return seed;
  }
  try {
    return JSON.parse(raw) as DB;
  } catch {
    const seed = buildSeed();
    localStorage.setItem(KEY, JSON.stringify(seed));
    return seed;
  }
}

export function saveDB(db: DB) {
  localStorage.setItem(KEY, JSON.stringify(db));
  // уведомляем подписчиков
  window.dispatchEvent(new CustomEvent('db-changed'));
}

// Простой «стор» на useState + событие. Для демо — идеально.
let _cache: DB | null = null;

export function useDB() {
  const [db, setDb] = useState<DB>(() => {
    if (_cache) return _cache;
    _cache = loadDB();
    return _cache;
  });

  useEffect(() => {
    const onChange = () => {
      _cache = loadDB();
      setDb(_cache);
    };
    window.addEventListener('db-changed', onChange);
    return () => window.removeEventListener('db-changed', onChange);
  }, []);

  const update = (fn: (draft: DB) => void) => {
    const draft: DB = JSON.parse(JSON.stringify(db));
    fn(draft);
    _cache = draft;
    saveDB(draft);
    setDb(draft);
  };

  return { db, update };
}

export function nextId(db: DB, entity: keyof DB['nextIds']): number {
  const id = db.nextIds[entity] ?? 1;
  db.nextIds[entity] = id + 1;
  return id;
}

export function resetDB() {
  localStorage.removeItem(KEY);
  _cache = null;
  window.dispatchEvent(new CustomEvent('db-changed'));
}