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
  // 切换前记录滚动位置，避免浅/深色模式内容高度差导致页面跳动
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;
  currentTheme = t;
  snapshot = { theme: t }; // 重建快照（新引用）
  writeDom(t);
  persist(t);
  // 下一帧恢复滚动位置（在 writeDom 造成的 DOM 重排之后）
  requestAnimationFrame(() => {
    window.scrollTo(scrollX, scrollY);
  });
  listeners.forEach(fn => fn());
}

export function toggleTheme() {
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;
  const next = currentTheme === 'dark' ? 'light' : 'dark';
  currentTheme = next;
  snapshot = { theme: next };
  writeDom(next);
  persist(next);
  requestAnimationFrame(() => {
    window.scrollTo(scrollX, scrollY);
  });
  listeners.forEach(fn => fn());
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
