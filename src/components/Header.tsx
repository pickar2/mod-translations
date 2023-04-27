import { useContext, useEffect, useState } from "react";
import { keysOfEnum } from "~/utils/enumUtils";
import { TranslationContext, Language, TranslationKey } from "../contexts/TranslationContext";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "./ui/select";
import { cn } from "~/lib/utils";
import { compileTranslations } from "~/utils/zipUtils";

export const Header = () => {
  const { setCurrentLanguage, currentMod, currentLanguage, triggerUpdate, setCurrentMod, mods } =
    useContext(TranslationContext);

  const copyNotTranslated = () => {
    if (!currentMod || currentLanguage == currentMod.defaultLanguage) return;
    if (!currentMod.keys.has(currentLanguage)) currentMod.keys.set(currentLanguage, new Map());

    const defaultKeys = currentMod.keys.get(currentMod.defaultLanguage);
    if (!defaultKeys) return;

    const currentKeys = currentMod.keys.get(currentLanguage)!;
    for (const [hash, key] of defaultKeys) {
      if (key.values.length !== 1 || currentKeys.has(hash)) continue;

      const copy: TranslationKey = {
        key: key.key,
        defType: key.defType,
        defName: key.defName,
        values: [...key.values],
      };
      currentKeys.set(hash, copy);
    }

    triggerUpdate();
  };

  return (
    <header className="fixed top-0 flex w-full flex-row gap-2 border-b-[1px] border-[hsl(var(--border))] bg-slate-900 p-3">
      <Button onClick={copyNotTranslated}>[ Copy ]</Button>
      <Button
        onClick={(e): void => {
          if (!currentMod) return;
          compileTranslations(currentMod);
        }}
      >
        [ Save ]
      </Button>

      <Select
        value={Language[currentLanguage]}
        onValueChange={(v) => {
          setCurrentLanguage(() => Language[keysOfEnum(Language).find((k) => k.toString() === v)!]);
        }}
      >
        <SelectTrigger className={cn("w-auto min-w-[180px]")}>
          <SelectValue placeholder="Choose language" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {keysOfEnum(Language).map((lang) => {
              return (
                <SelectItem value={lang} key={lang}>
                  {lang}
                </SelectItem>
              );
            })}
          </SelectGroup>
        </SelectContent>
      </Select>

      <Select
        value={currentMod?.id}
        onValueChange={(v) => {
          const mod = mods.find((m) => m.id === v);
          setCurrentMod(mod);
        }}
      >
        <SelectTrigger className={cn("w-auto min-w-[180px]")}>
          <SelectValue placeholder="Select a mod" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {mods.map((m) => {
              return (
                <SelectItem value={m.id} key={m.id}>
                  {m.name}
                </SelectItem>
              );
            })}
          </SelectGroup>
        </SelectContent>
      </Select>
    </header>
  );
};
