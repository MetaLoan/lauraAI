'use client';

import { useEffect } from 'react';

function shouldPatch(value: string, basePath: string) {
  if (!value) return false;
  if (!value.startsWith('/')) return false;
  if (value.startsWith('//')) return false;
  if (value.startsWith(`${basePath}/`) || value === basePath) return false;
  return true;
}

export function BasePathRuntimeFix() {
  useEffect(() => {
    const debugEnabled =
      typeof window !== 'undefined' &&
      (window.location.search.includes('debug_assets=1') ||
        window.localStorage.getItem('debug_assets') === '1');

    const envBasePath = (process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/\/+$/, '');
    const scriptWithNext = Array.from(document.scripts).find((script) => script.src.includes('/_next/static/'));
    const runtimeBasePath = scriptWithNext
      ? (() => {
          try {
            const pathname = new URL(scriptWithNext.src, window.location.origin).pathname;
            const nextIndex = pathname.indexOf('/_next/');
            return nextIndex > 0 ? pathname.slice(0, nextIndex) : '';
          } catch {
            return '';
          }
        })()
      : '';
    const basePath = (runtimeBasePath || envBasePath).replace(/\/+$/, '');
    if (debugEnabled) {
      console.info('[asset-debug] init', {
        envBasePath,
        runtimeBasePath,
        finalBasePath: basePath,
        scriptSample: scriptWithNext?.src || null,
      });
    }
    if (!basePath) return;

    const patchElement = (el: Element) => {
      const attrs = ['src', 'href', 'poster'] as const;
      attrs.forEach((attr) => {
        const raw = el.getAttribute(attr);
        if (!raw) return;
        if (!shouldPatch(raw, basePath)) return;
        if (debugEnabled) {
          console.info('[asset-debug] patch', {
            tag: el.tagName,
            attr,
            from: raw,
            to: `${basePath}${raw}`,
          });
        }
        el.setAttribute(attr, `${basePath}${raw}`);
      });
    };

    const patchAll = () => {
      const targets = document.querySelectorAll('[src], [href], [poster]');
      targets.forEach((el) => patchElement(el));
    };

    patchAll();
    requestAnimationFrame(() => patchAll());

    const onRouteLikeChange = () => patchAll();
    window.addEventListener('popstate', onRouteLikeChange);
    window.addEventListener('hashchange', onRouteLikeChange);
    const onResourceError = (event: Event) => {
      const target = event.target as HTMLImageElement | HTMLScriptElement | HTMLLinkElement | null;
      if (!target) return;
      if (!debugEnabled) return;
      const src = (target as HTMLImageElement).src || '';
      const href = (target as HTMLLinkElement).href || '';
      const url = src || href || '';
      if (!url) return;
      console.error('[asset-debug] load-error', {
        tag: target.tagName,
        url,
      });
    };
    window.addEventListener('error', onResourceError, true);

    const originalPushState = history.pushState.bind(history);
    const originalReplaceState = history.replaceState.bind(history);

    history.pushState = function pushStateWrapper(...args) {
      originalPushState(...args);
      onRouteLikeChange();
    };
    history.replaceState = function replaceStateWrapper(...args) {
      originalReplaceState(...args);
      onRouteLikeChange();
    };

    return () => {
      window.removeEventListener('popstate', onRouteLikeChange);
      window.removeEventListener('hashchange', onRouteLikeChange);
      window.removeEventListener('error', onResourceError, true);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, []);

  return null;
}
