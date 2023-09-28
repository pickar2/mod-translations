import Dexie, { type Table } from "dexie";
import { type TranslationKey } from "~/contexts/TranslationContext";

export interface DbKey {
  id?: number;
  modId: string;
  language: string;
  hash: string;
  translationKey: TranslationKey;
}

export class KeysDb extends Dexie {
  // 'friends' is added by dexie when declaring the stores()
  // We just tell the typing system this is the case
  keys!: Table<DbKey>;

  constructor() {
    super("translations");
    this.version(1).stores({
      keys: "++id, hash, translationKey, [modId+language+hash]",
    });
  }
}

export const keysDb = new KeysDb();

export interface DbMod {
  id?: number;
  modId: string;
  defaultLanguage: string;
}

export class ModsDb extends Dexie {
  // 'friends' is added by dexie when declaring the stores()
  // We just tell the typing system this is the case
  mods!: Table<DbMod>;

  constructor() {
    super("mods");
    this.version(1).stores({
      mods: "++id, mod", // Primary key and indexed props
    });
  }
}

export const modsDb = new ModsDb();
