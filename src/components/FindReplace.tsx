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
  ignoreCase: boolean;
};

export const FindReplace = () => {
  const { currentMod, currentLanguage, triggerUpdate, onTableUpdated } = useContext(TranslationContext);
  const [find, setFind] = useState<string[]>([]);
  const [replace, setReplace] = useState<string[]>([]);
  const [dbKeys, setDbKeys] = useState<DbKey[]>([]);
  const [settings, setSettings] = useState<FRSettings>({
    useRegex: false,
    onlyFullKeys: false,
    onlyUntranslated: false,
    ignoreCase: false,
  });
  const [busy, setBusy] = useState(true);

  const findDbKeys = () => {
    setBusy(true);
    const findStr = find[0];
    const defaultKeys = currentMod?.keys.get(currentMod.defaultLanguage);
    if (!currentMod || !findStr || !defaultKeys) {
      setDbKeys([]);
      return;
    }
    let req = keysDb.keys.where({ modId: currentMod.id, language: Language[currentLanguage] });

    if (settings.onlyUntranslated) {
      req = req.filter(
        (k) => k.translationKey.values.filter((v) => v !== defaultKeys.get(k.hash)?.values[0]).length === 0
      );
    }

    if (settings.useRegex) {
      const regex = new RegExp(findStr, settings.ignoreCase ? "gi" : "g");
      if (settings.onlyFullKeys) {
        req = req.filter(
          (k) => k.translationKey.values.filter((v) => v.match(regex)?.[0].length === v.length).length > 0
        );
      } else {
        req = req.filter((k) => k.translationKey.values.filter((v) => v.match(findStr)).length > 0);
      }
    } else {
      const match = settings.ignoreCase ? findStr.toLocaleLowerCase() : findStr;
      if (settings.ignoreCase) {
        if (settings.onlyFullKeys) {
          req = req.filter((k) => k.translationKey.values.filter((v) => v.toLocaleLowerCase() === match).length > 0);
        } else {
          req = req.filter(
            (k) => k.translationKey.values.filter((v) => v.toLocaleLowerCase().includes(findStr)).length > 0
          );
        }
      } else {
        if (settings.onlyFullKeys) {
          req = req.filter((k) => k.translationKey.values.filter((v) => v === match).length > 0);
        } else {
          req = req.filter((k) => k.translationKey.values.filter((v) => v.includes(findStr)).length > 0);
        }
      }
    }

    void req.toArray().then((arr) => {
      setDbKeys(arr);
      setBusy(arr.length === 0);
    });
  };

  const performReplace = () => {
    const findStr = find[0];
    const replaceStr = replace[0];
    const currentKeys = currentMod?.keys.get(currentLanguage);
    if (!findStr || !replaceStr || !currentKeys) return;

    const regex = new RegExp(findStr, settings.ignoreCase ? "gi" : "g");
    for (const dbKey of dbKeys) {
      dbKey.translationKey.values = dbKey.translationKey.values.map((v) => v.replaceAll(regex, replaceStr));
      currentKeys.set(dbKey.hash, dbKey.translationKey);
    }

    void keysDb.keys.bulkPut(dbKeys).then(() => {
      findDbKeys();
      triggerUpdate();
    });
  };

  useEffect(findDbKeys, [currentMod, currentLanguage, settings, onTableUpdated]);

  return (
    <div className="flex max-w-[32vw]">
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
        <span>{dbKeys.length} rows will be affected</span>
      </div>
      <div className="ml-2 flex flex-col justify-center gap-2">
        <Button onClick={performReplace} disabled={busy}>
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
            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
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
            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Only full keys
          </label>
        </div>
        <div className="flex items-center gap-1">
          <Checkbox
            id="ignore_case"
            onCheckedChange={(state) => {
              setSettings((prev) => {
                prev.ignoreCase = state == true;
                return { ...prev };
              });
            }}
          />
          <label
            htmlFor="ignore_case"
            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Ignore case
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
          />
          <label
            htmlFor="use_regex"
            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Use regex
          </label>
        </div>
      </div>
    </div>
  );
};
