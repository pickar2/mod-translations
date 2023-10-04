import { useContext } from "react";
import { keysOfEnum } from "~/utils/enumUtils";
import { TranslationContext, Language, type TranslationKey } from "../contexts/TranslationContext";
import { Button } from "./ui/button";
import { Button as TransparentButton } from "./ui/transparentButton";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { cn } from "~/lib/utils";
import { compileTranslations } from "~/utils/zipUtils";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "./ui/tooltip";
import { DbKey, clearLanguageInDb, keysDb, removeKeyFromDb, removeModFromDb, updateTranslationInDb } from "~/utils/db";
import { getFromLocalStorage, setToLocalStorage } from "~/utils/localStorageUtils";
import { useLocalStorage } from "@uidotdev/usehooks";
import { Pin, PinOff } from "lucide-react";
import { FindReplace } from "~/components/FindReplace";

export const Header = () => {
  const {
    setCurrentLanguage,
    currentMod,
    currentLanguage,
    triggerUpdate,
    setCurrentMod,
    mods,
    setMods,
    addTranslation,
  } = useContext(TranslationContext);

  const [keysPerPage, setKeysPerPage] = useLocalStorage("keysPerPage", 25);

  const [pinnedLanguages, setPinnedLanguages] = useLocalStorage<string[]>("pinnedLanguages", [
    Language[Language.English],
  ]);
  const currentLanguagePinned = pinnedLanguages.includes(Language[currentLanguage]);

  const copyNotTranslated = () => {
    if (!currentMod || currentLanguage == currentMod.defaultLanguage) return;
    if (!currentMod.keys.has(currentLanguage)) currentMod.keys.set(currentLanguage, new Map());

    const defaultKeys = currentMod.keys.get(currentMod.defaultLanguage);
    if (!defaultKeys) return;

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const currentKeys = currentMod.keys.get(currentLanguage)!;
    const toDb: DbKey[] = [];
    for (const [hash, key] of defaultKeys) {
      if (key.values.length !== 1 || currentKeys.has(hash)) continue;

      const copy: TranslationKey = {
        key: key.key,
        defType: key.defType,
        defName: key.defName,
        values: [...key.values],
      };

      currentKeys.set(hash, copy);
      toDb.push({ modId: currentMod.id, language: Language[currentLanguage], hash, translationKey: copy });
    }
    void keysDb.keys.bulkPut(toDb);

    triggerUpdate();
  };

  const purgeInvalid = () => {
    if (!currentMod || currentLanguage == currentMod.defaultLanguage) return;
    if (!currentMod.keys.has(currentLanguage)) currentMod.keys.set(currentLanguage, new Map());

    const defaultKeys = currentMod.keys.get(currentMod.defaultLanguage);
    if (!defaultKeys) return;

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const currentKeys = currentMod.keys.get(currentLanguage)!;
    for (const [hash, key] of currentKeys) {
      // remove all unused keys
      if (!defaultKeys.has(hash)) {
        currentKeys.delete(hash);
        removeKeyFromDb(currentMod, currentLanguage, hash);

        continue;
      }

      // remove translations that are the same as original when translated variant exists
      if (key.values.length > 1) {
        const defaultValue = currentMod.keys.get(currentMod.defaultLanguage)?.get(hash)?.values[0];
        if (defaultValue) {
          key.values = key.values.filter((v) => v !== defaultValue);
          if (key.values.length > 0) {
            updateTranslationInDb(currentMod, currentLanguage, hash, key.values);
          } else {
            currentKeys.delete(hash);
            removeKeyFromDb(currentMod, currentLanguage, hash);
          }
        }
      }
    }
    setCurrentMod(currentMod);

    triggerUpdate();
  };

  const deleteCurrentMod = () => {
    if (!currentMod) return;
    setMods((prev) => {
      const newMods = prev.filter((m) => m !== currentMod);
      removeModFromDb(currentMod);
      setCurrentMod(newMods[newMods.length - 1]);
      triggerUpdate();
      return newMods;
    });
  };

  const clearCurrentLanguage = () => {
    if (!currentMod) return;
    currentMod.keys.delete(currentLanguage);
    clearLanguageInDb(currentMod, currentLanguage);
    triggerUpdate();
  };

  return (
    <header className="fixed top-0 z-10 flex w-full flex-row gap-2 border-b-[1px] border-[hsl(var(--border))] bg-slate-900 p-3">
      <FindReplace />
      <TooltipProvider delayDuration={400}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button onClick={copyNotTranslated}>[ Copy ]</Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" align="start">
            <span>{"Copy all non translated keys from default language to current"}</span>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider delayDuration={400}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button onClick={purgeInvalid}>[ Purge ]</Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" align="start">
            <span>{"Purge all invalid keys from current language"}</span>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider delayDuration={400}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={(): void => {
                if (!currentMod) return;
                compileTranslations(currentMod);
              }}
            >
              [ Save ]
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" align="start">
            <span>{"Download current mod's translation"}</span>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

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

      <Select
        value={Language[currentLanguage]}
        onValueChange={(v) => {
          setCurrentLanguage(() => Language[v as keyof typeof Language]);
        }}
      >
        <SelectTrigger className={cn("w-auto min-w-[180px]")}>
          <SelectValue placeholder="Choose language" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {keysOfEnum(Language)
              .filter((lang) => pinnedLanguages.includes(lang))
              .sort()
              .map((lang) => {
                return (
                  <SelectItem value={lang} key={lang}>
                    {lang}
                  </SelectItem>
                );
              })}
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            {keysOfEnum(Language)
              .filter((lang) => !pinnedLanguages.includes(lang))
              .map((lang) => {
                return (
                  <SelectItem value={lang} key={lang}>
                    {lang}
                  </SelectItem>
                );
              })}
          </SelectGroup>
        </SelectContent>
      </Select>

      <TooltipProvider delayDuration={400}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => {
                if (currentLanguagePinned) {
                  setPinnedLanguages((prev) => {
                    prev.splice(prev.indexOf(Language[currentLanguage]), 1);
                    return [...prev];
                  });
                } else {
                  setPinnedLanguages((prev) => {
                    prev.push(Language[currentLanguage]);
                    return [...prev];
                  });
                }
              }}
            >
              {!currentLanguagePinned && <Pin />}
              {currentLanguagePinned && <PinOff />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <span>
              {!currentLanguagePinned && "Pin current language"}
              {currentLanguagePinned && "Unpin current language"}
            </span>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <div className="absolute right-1 flex gap-2">
        <Select value={keysPerPage.toString()} onValueChange={(v) => setKeysPerPage(parseInt(v))}>
          <SelectTrigger className={cn("w-auto")}>
            <span className="mr-1">{"Keys per page:"}</span>
            <SelectValue placeholder="" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {[10, 25, 50, 100, 200, 500, 1000].map((v) => {
                return (
                  <SelectItem value={v.toString()} key={v}>
                    {v}
                  </SelectItem>
                );
              })}
            </SelectGroup>
          </SelectContent>
        </Select>

        <TooltipProvider delayDuration={400}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={clearCurrentLanguage}>[ Clear language ]</Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" align="start">
              <span>{"Remove language from mod's translation"}</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider delayDuration={400}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={deleteCurrentMod}>[ Delete mod ]</Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" align="start">
              <span>{"Delete current mod"}</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </header>
  );
};
