import Dexie, { type Table } from "dexie";
import { type Language } from "~/contexts/TranslationContext";

export interface ModRecord {
  id?: number;

  modId: string;
  modName: string;
  defaultLanguage: Language;
}

export interface TranslationRecord {
  id?: number;

  modId: string;
  defType: string;
  defName: string;
  key: string;
  language: Language;

  values: string[];
}

export class TranslationsDb extends Dexie {
  mods!: Table<ModRecord>;
  translations!: Table<TranslationRecord>;

  constructor() {
    super("myDatabase");
    this.version(1).stores({
      mods: "++id, modId, modName, defaultLanguage",
      translations: "++id, modId, defType, defName, key, language",
    });
  }
}

export const dexieDb = new TranslationsDb();
