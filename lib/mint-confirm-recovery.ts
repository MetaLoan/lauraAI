type PendingMintConfirm = {
  orderId: string;
  txHash: string;
  characterId?: string;
  updatedAt: number;
};

const STORAGE_KEY = 'laura_pending_mint_confirms_v1';

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readAll(): PendingMintConfirm[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((it) => it && typeof it.orderId === 'string' && typeof it.txHash === 'string');
  } catch {
    return [];
  }
}

function writeAll(items: PendingMintConfirm[]) {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore storage failure
  }
}

export function upsertPendingMintConfirm(item: Omit<PendingMintConfirm, 'updatedAt'>) {
  const now = Date.now();
  const all = readAll();
  const idx = all.findIndex((it) => it.orderId === item.orderId);
  const next: PendingMintConfirm = { ...item, updatedAt: now };
  if (idx >= 0) all[idx] = next;
  else all.push(next);
  writeAll(all);
}

export function removePendingMintConfirm(orderId: string) {
  const all = readAll().filter((it) => it.orderId !== orderId);
  writeAll(all);
}

export function getPendingMintConfirm(orderId: string): PendingMintConfirm | null {
  return readAll().find((it) => it.orderId === orderId) ?? null;
}

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export async function confirmWithRecovery(
  orderId: string,
  txHash: string,
  confirmFn: (orderId: string, txHash: string) => Promise<any>,
  maxAttempts: number = 4
): Promise<boolean> {
  upsertPendingMintConfirm({ orderId, txHash });
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const result = await confirmFn(orderId, txHash);
      const status = String(result?.order?.status || '').toLowerCase();
      if (status === 'confirmed') {
        removePendingMintConfirm(orderId);
        return true;
      }
    } catch {
      if (i < maxAttempts - 1) {
        await delay(1200 * (i + 1));
      }
    }
  }
  return false;
}

export async function flushPendingMintConfirms(
  confirmFn: (orderId: string, txHash: string) => Promise<any>
) {
  const all = readAll();
  for (const item of all) {
    try {
      const result = await confirmFn(item.orderId, item.txHash);
      const status = String(result?.order?.status || '').toLowerCase();
      if (status === 'confirmed') {
        removePendingMintConfirm(item.orderId);
      }
    } catch {
      // keep item for next retry
    }
  }
}
