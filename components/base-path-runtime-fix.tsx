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
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
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

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.target instanceof Element) {
          patchElement(mutation.target);
          return;
        }

        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          patchElement(node);
          node.querySelectorAll?.('[src], [href], [poster]').forEach((el) => patchElement(el));
        });
      });
    });

    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['src', 'href', 'poster'],
    });

    return () => observer.disconnect();
  }, []);

  return null;
}

