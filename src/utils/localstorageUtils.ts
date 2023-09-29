export function getFromLocalStorage<T>(key: string): T | undefined {
  if (typeof window === "undefined") return undefined;
  const item = localStorage.getItem(key);
  if (!item || item === "undefined") return undefined;
  return JSON.parse(item) as T | undefined;
}

export function setToLocalStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return undefined;
  localStorage.setItem(key, JSON.stringify(value));
}
