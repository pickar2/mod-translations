import { useContext, useEffect, useState } from "react";
import { AutoHeightTextArea } from "./AutoHeightTextArea";
import { Button } from "./ui/button";
import { Language, TranslationContext } from "~/contexts/TranslationContext";
import { type DbKey, keysDb } from "~/utils/db";
import { Checkbox } from "./ui/checkbox";

type FRSettings = {
  useRegex: boolean;
  onlyFullKeys: boolean;
  onlyUntranslated: boolean;
};

export const FindReplace = () => {
  const { currentMod, currentLanguage, triggerUpdate } = useContext(TranslationContext);
  const [changeCount, setChangeCount] = useState(0);
  const [find, setFind] = useState<string[]>([]);
  const [replace, setReplace] = useState<string[]>([]);
  const [dbKeys, setDbKeys] = useState<DbKey[]>([]);
  const [settings, setSettings] = useState<FRSettings>({
    useRegex: false,
    onlyFullKeys: false,
    onlyUntranslated: false,
  });

  const findDbKeys = () => {
    const str = find[0];
    const defaultKeys = currentMod?.keys.get(currentMod.defaultLanguage);
    if (!currentMod || !str || !defaultKeys) {
      setDbKeys([]);
      return;
    }
    let req = keysDb.keys.where({ modId: currentMod.id, language: Language[currentLanguage] });

    if (settings.onlyUntranslated) {
      req = req.filter(
        (k) => k.translationKey.values.filter((v) => v !== defaultKeys.get(k.hash)?.values[0]).length === 0
      );
    }

    if (settings.onlyFullKeys) {
      req = req.filter((k) => k.translationKey.values.filter((v) => v === str).length > 0);
    } else {
      req = req.filter((k) => k.translationKey.values.filter((v) => v.includes(str)).length > 0);
    }

    void req.toArray().then((arr) => {
      setDbKeys(arr);
    });
  };

  useEffect(findDbKeys, [currentMod, currentLanguage, settings]);

  return (
    <div className="absolute left-8 top-24 flex w-[30vw]">
      <div className="flex w-[240px] flex-col">
        <div className="border-y-[1px] border-[hsl(var(--border))]">
          <AutoHeightTextArea
            index={0}
            values={find}
            onFinishEditing={(str) => {
              setFind(() => (str && [str]) || []);
              findDbKeys();
            }}
            onTextChange={(str) => {
              setFind(() => (str && [str]) || []);
            }}
            placeholder="Find"
          />
        </div>
        <div className="border-b-[1px] border-[hsl(var(--border))]">
          <AutoHeightTextArea
            index={0}
            values={replace}
            onFinishEditing={(str) => {
              setReplace(() => (str && [str]) || []);
            }}
            onTextChange={(str) => {
              setReplace(() => (str && [str]) || []);
            }}
            placeholder="Replace"
          />
        </div>
        <span>{dbKeys.length} occurrences will be replaced</span>
      </div>
      <div className="ml-2 flex flex-col justify-center gap-2">
        <Button
          onClick={() => {
            const findStr = find[0];
            const replaceStr = replace[0];
            const currentKeys = currentMod?.keys.get(currentLanguage);
            if (!findStr || !replaceStr || !currentKeys) return;

            for (const dbKey of dbKeys) {
              dbKey.translationKey.values = dbKey.translationKey.values.map((v) => v.replaceAll(findStr, replaceStr));
              currentKeys.set(dbKey.hash, dbKey.translationKey);
            }
            void keysDb.keys.bulkPut(dbKeys).then(() => {
              findDbKeys();
              triggerUpdate();
            });
          }}
        >
          Replace
        </Button>
        <div className="flex items-center gap-1">
          <Checkbox
            id="only_untranslated"
            onCheckedChange={(state) => {
              setSettings((prev) => {
                prev.onlyUntranslated = state == true;
                return { ...prev };
              });
            }}
          />
          <label
            htmlFor="only_untranslated"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Only untranslated
          </label>
        </div>
        <div className="flex items-center gap-1">
          <Checkbox
            id="only_full_keys"
            onCheckedChange={(state) => {
              setSettings((prev) => {
                prev.onlyFullKeys = state == true;
                return { ...prev };
              });
            }}
          />
          <label
            htmlFor="only_full_keys"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Only full keys
          </label>
        </div>
        <div className="flex items-center gap-1">
          <Checkbox
            id="use_regex"
            onCheckedChange={(state) => {
              setSettings((prev) => {
                prev.useRegex = state == true;
                return { ...prev };
              });
            }}
            disabled
          />
          <label
            htmlFor="use_regex"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Use regex
          </label>
        </div>
      </div>
    </div>
  );
};
