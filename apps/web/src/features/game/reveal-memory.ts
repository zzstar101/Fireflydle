/**
 * 结算演出记忆：同一局第二次打开结算（刷新、返回再进）直接跳到终态，
 * 不重复播放揭晓与推理回放（README §3 结算要求）。
 *
 * 用 sessionStorage 而不是模块级变量：设计文档说的是「同一天第二次打开」，
 * 刷新也算第二次；用 localStorage 又会让第二天的同一局……不，对局 id 本来就一局一个，
 * sessionStorage 足够，且关掉标签页就清掉。
 * 环境没有 sessionStorage（SSR、node 测试）时退回进程内的 Set。
 */
const STORAGE_KEY = "fireflydle:result-reveal-seen";

const memory = new Set<string>();

function storage(): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    return window.sessionStorage ?? null;
  } catch {
    // 隐私模式下访问 sessionStorage 会抛异常，降级到进程内记忆。
    return null;
  }
}

function readAll(): string[] {
  const store = storage();
  if (!store) return [...memory];
  try {
    const raw = store.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

export function hasSeenResultReveal(key: string): boolean {
  const store = storage();
  if (!store) return memory.has(key);
  return readAll().includes(key);
}

export function markResultRevealSeen(key: string): void {
  const store = storage();
  if (!store) {
    memory.add(key);
    return;
  }
  const seen = readAll();
  if (seen.includes(key)) return;
  seen.push(key);
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(seen));
  } catch {
    memory.add(key);
  }
}

/** 仅供测试重置模块级状态。 */
export function resetResultRevealMemory(): void {
  memory.clear();
  storage()?.removeItem(STORAGE_KEY);
}
