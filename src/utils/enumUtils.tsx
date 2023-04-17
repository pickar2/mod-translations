// adapted from https://stackoverflow.com/a/57755270/18346347
export function keysOfEnum<T extends { [key: number]: string | number }>(e: T): (keyof T)[] {
  return Object.keys(e).filter((v) => isNaN(Number(v))) as (keyof typeof e)[];
}
