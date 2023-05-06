import { DBSchema, IDBPDatabase, IDBPObjectStore, deleteDB, openDB } from "idb";
import { createContext, type Dispatch, type SetStateAction, useState, useEffect } from "react";
import { ModRecord, dexieDb } from "~/lib/dexieDb";
import { useLocalStorage } from "~/lib/useLocalStorage";
import { keysOfEnum } from "~/utils/enumUtils";

export enum Language {
  English,
  Ukrainian,
  Russian,
}

export type Mod = {
  name: string;
  id: string;
  defaultLanguage: Language;
  keys: Map<Language, Map<string, TranslationKey>>;
};

export type TranslationKey = {
  defType: string;
  defName: string;
  key: string;
  values: string[];
};

export type FieldWithSetter<T> = {
  field: T;
  setter: Dispatch<SetStateAction<T>>;
};

export const TranslationContext = createContext<{
  updateOnTrigger: unknown;
  triggerUpdate: { (): void };
  mods: Mod[];
  setMods: Dispatch<SetStateAction<Mod[]>>;
  currentMod: Mod | undefined;
  setCurrentMod: Dispatch<SetStateAction<Mod | undefined>>;
  currentLanguage: Language;
  setCurrentLanguage: Dispatch<SetStateAction<Language>>;
  addMod: { (name: string, id: string, defaultLanguage: Language): Mod };
  addTranslation: {
    (mod: Mod, language: Language, defType: string, defName: string, key: string, values: string[]): void;
  };
}>(null!);

export const TranslationContextInit = (props: { children: JSX.Element | JSX.Element[] }) => {
  const [updateOnTrigger, setUpdateOnTrigger] = useState<unknown>({});
  const [mods, setMods] = useLocalStorage<Mod[]>("mods", []);
  const [currentMod, setCurrentMod] = useLocalStorage<Mod | undefined>("currentMod", undefined);
  const [currentLanguage, setCurrentLanguage] = useLocalStorage<Language>("currentLanguage", Language.English);

  const triggerUpdate = () => setUpdateOnTrigger({});

  const addMod = (name: string, id: string, defaultLanguage: Language): Mod => {
    let mod = mods.find((mod) => mod.id === id);
    if (!mod) {
      const map = new Map<Language, Map<string, TranslationKey>>();
      keysOfEnum(Language).map((k) => map.set(Language[k], new Map()));
      mod = { name, id, defaultLanguage, keys: map };
      void dexieDb.mods.add({ modId: mod.id, modName: mod.name, defaultLanguage: mod.defaultLanguage });
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      setMods((prev) => [...prev, mod!]);
    }
    setCurrentMod(mod);

    return mod;
  };

  const addTranslation = (
    mod: Mod,
    language: Language,
    defType: string,
    defName: string,
    key: string,
    values: string[]
  ): void => {
    if (!mod.keys.has(language)) mod.keys.set(language, new Map());
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const languageKeys = mod.keys.get(language)!;

    const translationKey = languageKeys.get(defType + defName + key);
    if (!translationKey) {
      languageKeys.set(defType + defName + key, { key, defType, defName, values });
    } else {
      for (const value of values) {
        if (translationKey.values.find((v) => v === value)) continue;
        translationKey.values.push(value);
      }
    }
    if (!translationKey) return;

    void dexieDb.translations
      .where({
        key: translationKey.key,
        defName: translationKey.defName,
        defType: translationKey.defType,
        modId: mod.id,
        language: language,
      })
      .first()
      .then(async (k) => {
        if (typeof k === "undefined") {
          await dexieDb.translations.add({
            key: translationKey.key,
            defName: translationKey.defName,
            defType: translationKey.defType,
            modId: mod.id,
            language: language,
            values: translationKey.values,
          });
        } else {
          await dexieDb.translations.update(key, { values: translationKey.values });
        }
      });
  };

  return (
    <TranslationContext.Provider
      value={{
        updateOnTrigger,
        triggerUpdate,
        mods,
        setMods,
        currentMod,
        setCurrentMod,
        currentLanguage,
        setCurrentLanguage,
        addMod,
        addTranslation,
      }}
    >
      {props.children}
    </TranslationContext.Provider>
  );
};
