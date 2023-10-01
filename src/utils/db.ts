import Dexie, { type Table } from "dexie";
import { Language, Mod, type TranslationKey } from "~/contexts/TranslationContext";

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
    this.version(2).stores({
      keys: "++id, hash, modId, language, [modId+language+hash]",
    });
    this.version(3).stores({
      keys: "++id, hash, modId, language, [modId+language+hash], [modId+language]",
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

export const updateTranslationInDb = (mod: Mod, language: Language, hash: string, values: string[]) => {
  void keysDb.keys
    .where("[modId+language+hash]")
    .equals([mod.id, Language[language], hash])
    .modify((value, ref) => {
      ref.value.translationKey.values = values;
    });
};

export const removeKeyFromDb = (mod: Mod, language: Language, hash: string) => {
  void keysDb.keys.where("[modId+language+hash]").equals([mod.id, Language[language], hash]).delete();
};

export const removeModFromDb = (mod: Mod) => {
  void keysDb.keys.where({ modId: mod.id }).delete();
  void modsDb.mods.filter((dbMod) => dbMod.modId == mod.id).delete();
};

export const clearLanguageInDb = (mod: Mod, language: Language) => {
  void keysDb.keys.where({ modId: mod.id, language: Language[language] }).delete();
};
