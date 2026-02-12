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
    if (!basePath) return;

    const patchElement = (el: Element) => {
      const attrs = ['src', 'href', 'poster'] as const;
      attrs.forEach((attr) => {
        const raw = el.getAttribute(attr);
        if (!raw) return;
        if (!shouldPatch(raw, basePath)) return;
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
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, []);

  return null;
}
