import { useSyncExternalStore, useCallback } from 'react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'oi-manager-theme';

type Listener = () => void;
const listeners = new Set<Listener>();

// === useSyncExternalStore 契约：getSnapshot 必须返回稳定引用，未变时 === 相等 ===
let currentTheme: Theme;
let snapshot: { theme: Theme }; // 稳定快照对象

function readInitial(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch { /* ignore */ }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function writeDom(t: Theme) {
  const html = document.documentElement;
  const body = document.body;
  if (t === 'dark') {
    html.classList.add('dark');
    body.classList.add('dark');
  } else {
    html.classList.remove('dark');
    body.classList.remove('dark');
  }
}

function persist(t: Theme) {
  try { localStorage.setItem(STORAGE_KEY, t); } catch { /* ignore */ }
}

export function applyTheme(t: Theme) {
  if (t === currentTheme) return;
  currentTheme = t;
  snapshot = { theme: t }; // 重建快照（新引用）
  writeDom(t);
  persist(t);
  listeners.forEach(fn => fn());
}

export function toggleTheme() {
  applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
}

// 初始化
currentTheme = readInitial();
snapshot = { theme: currentTheme };
writeDom(currentTheme);
persist(currentTheme);

function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

function getSnapshot(): { theme: Theme } {
  return snapshot; // 未变化时永远返回同一引用
}

function getServerSnapshot(): { theme: Theme } {
  return { theme: 'light' };
}

export function useTheme() {
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const toggle = useCallback(() => toggleTheme(), []);
  return { theme: currentTheme, toggle };
}
