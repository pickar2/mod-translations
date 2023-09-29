import { createContext, type Dispatch, type SetStateAction, useState, useEffect } from "react";
import { keysDb, modsDb, updateTranslationInDb } from "~/utils/db";
import { keysOfEnum } from "~/utils/enumUtils";
import { getFromLocalStorage, setToLocalStorage } from "~/utils/localStorageUtils";

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
  startPage: number;
}>(null!);

export const TranslationContextInit = (props: { children: JSX.Element | JSX.Element[] }) => {
  const [updateOnTrigger, setUpdateOnTrigger] = useState<unknown>({});
  const [mods, setMods] = useState<Mod[]>([]);
  const [currentMod, setCurrentMod] = useState<Mod | undefined>();
  const [currentLanguage, setCurrentLanguage] = useState<Language>(Language.English);
  const [startPage, setStartPage] = useState<number>(0);

  const triggerUpdate = () => setUpdateOnTrigger({});

  const addMod = (name: string, id: string, defaultLanguage: Language, fromDb = false): Mod => {
    let mod = mods.find((mod) => mod.id === id);
    if (!mod) {
      const map = new Map<Language, Map<string, TranslationKey>>();
      keysOfEnum(Language).map((k) => map.set(Language[k], new Map()));
      mod = { name, id, defaultLanguage, keys: map };
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      setMods((prev) => [...prev, mod!]);

      if (!fromDb) void modsDb.mods.add({ modId: id, defaultLanguage: Language[defaultLanguage] });
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
    values: string[],
    fromDb = false
  ): void => {
    if (!mod.keys.has(language)) mod.keys.set(language, new Map());
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const languageKeys = mod.keys.get(language)!;
    const hash = `${defType}${defName}${key}`;

    const translationKey = languageKeys.get(hash);
    if (!translationKey) {
      languageKeys.set(hash, { key, defType, defName, values });
      if (!fromDb)
        void keysDb.keys.add({
          hash: hash,
          modId: mod.id,
          language: Language[language],
          translationKey: { key, defType, defName, values },
        });
    } else {
      for (const value of values) {
        if (translationKey.values.find((v) => v === value)) continue;
        translationKey.values.push(value);
      }
      if (!fromDb) updateTranslationInDb(mod, language, hash, translationKey.values);
    }
  };

  useEffect(() => {
    const addedMods: Mod[] = [];
    const page: number = getFromLocalStorage("currentPage") || 0;
    const currentModId: string | undefined = getFromLocalStorage("currentModId");
    const currentLanguageString: string | undefined = getFromLocalStorage("currentLanguage");
    if (currentLanguageString) {
      setCurrentLanguage(Language[currentLanguageString as keyof typeof Language]);
    }

    void modsDb.mods
      .each((mod) => {
        addedMods.push(addMod(mod.modId, mod.modId, Language[mod.defaultLanguage as keyof typeof Language], true));
      })
      .then(async () => {
        if (currentModId) {
          const selectedMod = addedMods.find((mod) => mod.id === currentModId);
          if (selectedMod) setCurrentMod(selectedMod);
        }
        await keysDb.keys.each((key) => {
          const mod = addedMods.find((mod) => mod.id === key.modId);
          if (!mod) return;
          addTranslation(
            mod,
            Language[key.language as keyof typeof Language],
            key.translationKey.defType,
            key.translationKey.defName,
            key.translationKey.key,
            key.translationKey.values,
            true
          );
        });
        setStartPage(page);
        triggerUpdate();
      });
  }, []);

  useEffect(() => {
    setToLocalStorage("currentModId", currentMod?.id);
  }, [currentMod]);

  useEffect(() => {
    setToLocalStorage("currentLanguage", Language[currentLanguage]);
  }, [currentLanguage]);

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
        startPage,
      }}
    >
      {props.children}
    </TranslationContext.Provider>
  );
};
