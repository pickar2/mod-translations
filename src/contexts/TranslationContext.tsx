import { Children, createContext, Dispatch, SetStateAction, useEffect, useState } from "react";
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
  updateOnTrigger: {};
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
  const [updateOnTrigger, setUpdateOnTrigger] = useState<{}>({});
  const [mods, setMods] = useState<Mod[]>([]);
  const [currentMod, setCurrentMod] = useState<Mod | undefined>();
  const [currentLanguage, setCurrentLanguage] = useState<Language>(Language.English);

  const triggerUpdate = () => setUpdateOnTrigger({});

  const addMod = (name: string, id: string, defaultLanguage: Language): Mod => {
    let mod = mods.find((mod) => mod.id === id);
    if (!mod) {
      const map = new Map<Language, Map<string, TranslationKey>>();
      keysOfEnum(Language).map((k) => map.set(Language[k], new Map()));
      mod = { name, id, defaultLanguage, keys: map };
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
