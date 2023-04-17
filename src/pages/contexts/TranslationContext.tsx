import { Children, createContext, Dispatch, SetStateAction, useEffect, useState } from "react";

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
  path: string;
  key: string;
  values: string[];
};

// export type TranslationValue = {
// language: Language;
// value: string;
// };

export type FieldWithSetter<T> = {
  field: T;
  setter: Dispatch<SetStateAction<T>>;
};

export const TranslationContext = createContext<{
  mods: Mod[];
  setMods: Dispatch<SetStateAction<Mod[]>>;
  currentMod: Mod | undefined;
  setCurrentMod: Dispatch<SetStateAction<Mod | undefined>>;
  currentLanguage: Language;
  setCurrentLanguage: Dispatch<SetStateAction<Language>>;
}>(null!);

export const TranslationContextInit = (props: { children: JSX.Element | JSX.Element[] }) => {
  const [mods, setMods] = useState<Mod[]>([]);
  const [currentMod, setCurrentMod] = useState<Mod | undefined>();
  const [currentLanguage, setCurrentLanguage] = useState<Language>(Language.English);

  const addMod = (name: string, id: string, defaultLanguage: Language): Mod => {
    let mod = mods.filter((mod) => mod.id === id)[0];
    if (!mod) {
      mod = { name, id, defaultLanguage, keys: new Map() };
      setMods((prev) => [...prev, mod!]);
    }
    setCurrentMod(mod);

    return mod;
  };

  const addTranslation = (mod: Mod, language: Language, path: string, key: string, values: string[]): void => {
    if (!mod.keys.has(language)) mod.keys.set(language, new Map());
    const languageKeys = mod.keys.get(language)!;

    const translationKey = languageKeys.get(path + key);
    if (!translationKey) {
      languageKeys.set(path + key, { key, path, values });
    } else {
      translationKey.values.push(...values);
    }
  };

  useEffect(() => {
    const dummyMod = addMod("DummyMod", "Dummy.ModId", Language.English);

    addTranslation(dummyMod, Language.English, "some/path/File.xml", "DefDummyOne.label", ["Dummy label one"]);
    addTranslation(dummyMod, Language.Russian, "some/path/File.xml", "DefDummyOne.label", [
      "Пустышка с названием одинПустышка с названием одинПустышка с названием одинПустышка с названием одинПустышка с названием одинПустышка с названием одинПустышка с названием одинПустышка с названием одинПустышка с названием одинПустышка с названием одинПустышка с названием один",
    ]);
    addTranslation(dummyMod, Language.Russian, "some/path/File.xml", "DefDummyOne.label", ["Первая пустышка"]);

    addTranslation(dummyMod, Language.English, "some/path/File.xml", "DefDummySecond.label", [
      "Dummy label second",
      "Other text",
    ]);

    addTranslation(dummyMod, Language.English, "some/path/OtherFile.xml", "DefDummyOtherFile.label", [
      "Label in other file",
    ]);
  }, []);

  return (
    <TranslationContext.Provider
      value={{
        mods,
        setMods,
        currentMod,
        setCurrentMod,
        currentLanguage,
        setCurrentLanguage,
      }}
    >
      {props.children}
    </TranslationContext.Provider>
  );
};
