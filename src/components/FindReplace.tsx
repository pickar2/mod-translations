import { useContext, useEffect, useState } from "react";
import { AutoHeightTextArea } from "./AutoHeightTextArea";
import { Button } from "./ui/button";
import { Language, TranslationContext } from "~/contexts/TranslationContext";
import { DbKey, keysDb } from "~/utils/db";

// const type FRSettings {

// }

export const FindReplace = () => {
  const { currentMod, currentLanguage, triggerUpdate } = useContext(TranslationContext);
  const [changeCount, setChangeCount] = useState(0);
  const [find, setFind] = useState<string[]>([]);
  const [replace, setReplace] = useState<string[]>([]);
  const [dbKeys, setDbKeys] = useState<DbKey[]>([]);

  const findDbKeys = () => {
    const str = find[0];
    if (!currentMod || !str) {
      setDbKeys([]);
      return;
    }
    void keysDb.keys
      .where({ modId: currentMod.id, language: Language[currentLanguage] })
      .filter((k) => k.translationKey.values.filter((v) => v.includes(str)).length > 0)
      .toArray()
      .then((arr) => {
        setDbKeys(arr);
      });
  };

  useEffect(findDbKeys, [currentMod, currentLanguage]);

  return (
    <div className="absolute left-8 top-24 flex w-[20vw]">
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
      <div className="ml-2 flex items-center">
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
      </div>
    </div>
  );
};
