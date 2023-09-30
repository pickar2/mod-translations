export function getFromLocalStorage<T>(key: string): T | undefined {
  if (typeof window === "undefined") return undefined;
  const item = localStorage.getItem(key);
  if (!item || item === "undefined") return undefined;
  return JSON.parse(item) as T | undefined;
}

export function getFromLocalStorageOrDefault<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  const item = localStorage.getItem(key);
  if (!item || item === "undefined") return defaultValue;
  return (JSON.parse(item) as T | undefined) || defaultValue;
}

export function setToLocalStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return undefined;
  localStorage.setItem(key, JSON.stringify(value));
}
