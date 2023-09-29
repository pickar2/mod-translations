/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { useContext, useState } from "react";
import { parseFiles, type Directory, findRimworldMods, parseRimworldModDirectory } from "~/utils/fileUtils";
import { findDefs, findAllTranslatableKeys, XmlParser } from "~/utils/xmlUtils";
import { Language, type Mod, TranslationContext, type TranslationKey } from "../contexts/TranslationContext";
import { cn } from "~/lib/utils";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";

export const verifyZoneOnFileDrop = (event: React.DragEvent<HTMLElement>) => {
  if ((event.target as HTMLElement).matches(".dropzone")) {
    event.stopPropagation();
  } else {
    event.preventDefault();
    event.dataTransfer.effectAllowed = "none";
    event.dataTransfer.dropEffect = "none";
  }
};

const Loading = () => {
  return <div className="absolute right-6 top-6 text-2xl text-slate-100">Loading...</div>;
};

type Settings = {
  loadIntoCurrent: boolean;
  deleteDuplicateMods: boolean;
};

export const DropZone = () => {
  const { mods, addMod, addTranslation, triggerUpdate, currentMod } = useContext(TranslationContext);
  const [dropping, setDropping] = useState(false);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<Settings>({ loadIntoCurrent: false, deleteDuplicateMods: false });

  async function processDrop(e: React.DragEvent<HTMLElement>) {
    e.preventDefault();
    setDropping(false);

    setLoading(true);

    const root: Directory = await parseFiles(e.dataTransfer.items);
    const modDirectories = await findRimworldMods(root, "default");
    const modsWithDir: { mod: Mod; directory: Directory }[] = modDirectories.map((mDir) => {
      let mod = mods.find((m) => m.id === mDir.modId);
      if (!mod) mod = (settings.loadIntoCurrent && currentMod) || addMod(mDir.modId, mDir.modId, Language.English);
      return { mod: mod, directory: mDir.directory };
    });

    for (const modEntry of modsWithDir) {
      const modOverride = (settings.loadIntoCurrent && currentMod) || modEntry.mod;
      const parsed = await parseRimworldModDirectory(modOverride, modEntry.directory, "@latest");
      const queue: File[] = [];

      function addFilesToQueue(directory: Directory) {
        queue.push(...directory.files);
        for (const subDir of directory.directories) {
          addFilesToQueue(subDir);
        }
      }

      for (const folder of parsed.foldersWithDefs) {
        addFilesToQueue(folder);
      }
      const newTranslationKeys: TranslationKey[] = [];
      for (const file of queue) {
        if (!file.name.endsWith(".xml")) continue;
        try {
          const text = await file.text();
          const xml = XmlParser.parse(text);
          const defs = findDefs(xml, "defaultDefName");
          for (const def of defs) {
            const keys = findAllTranslatableKeys(def.defXml, "");
            const translationKeysArray: TranslationKey[] = keys.map((k) => {
              return { defType: def.defType, defName: def.defName, key: k.key, values: k.values };
            });
            newTranslationKeys.push(...translationKeysArray);
          }
        } catch (err) {
          console.log(`Failed to parse file ${file.webkitRelativePath}/${file.name}`);
          console.log(err);
        }
      }
      for (const key of newTranslationKeys) {
        addTranslation(modOverride, modOverride.defaultLanguage, key.defType, key.defName, key.key, key.values);
      }

      for (const folder of parsed.foldersWithDefTranslations) {
        for (const defFolder of folder.directory.directories) {
          const defType = defFolder.name;

          newTranslationKeys.length = 0;
          queue.length = 0;
          addFilesToQueue(defFolder);

          for (const file of queue) {
            try {
              const text = await file.text();
              const xml = XmlParser.parse(text);
              const languageData = xml.LanguageData;
              if (languageData) {
                const translationKeysArray: TranslationKey[] = Object.keys(languageData).map((key: string) => {
                  const indexOfDot = key.indexOf(".");
                  return {
                    defType: defType,
                    defName: key.substring(0, indexOfDot),
                    key: key.substring(indexOfDot),
                    values: [languageData[key]],
                  };
                });
                newTranslationKeys.push(...translationKeysArray);
              }
            } catch (err) {
              console.log(`Failed to parse file ${file.webkitRelativePath}/${file.name}`);
              console.log(err);
            }
          }

          for (const key of newTranslationKeys) {
            addTranslation(modOverride, folder.language, key.defType, key.defName, key.key, key.values);
          }
        }
      }

      for (const folder of parsed.foldersWithKeyedTranslations) {
        newTranslationKeys.length = 0;
        queue.length = 0;
        addFilesToQueue(folder.directory);

        for (const file of queue) {
          try {
            const text = await file.text();
            const xml = XmlParser.parse(text);
            const languageData = xml.LanguageData;
            if (languageData) {
              const translationKeysArray: TranslationKey[] = Object.keys(languageData).map((key: string) => {
                return { defType: "Keyed", defName: "", key: key, values: [languageData[key]] };
              });
              newTranslationKeys.push(...translationKeysArray);
            }
          } catch (err) {
            console.log(`Failed to parse file ${file.webkitRelativePath}/${file.name}`);
            console.log(err);
          }
        }

        for (const key of newTranslationKeys) {
          addTranslation(modOverride, folder.language, key.defType, key.defName, key.key, key.values);
        }
      }
    }
    triggerUpdate();
    setLoading(false);
  }

  return (
    <>
      {loading && <Loading />}
      <div className={`relative flex items-center p-0`}>
        <div
          className={cn(
            `dropzone flex items-center rounded-2xl border-[1px] border-[hsl(var(--border))] bg-slate-800 p-14`,
            "after:content-['Drop_mod_folder(s)_here']",
            dropping && "bg-slate-700"
          )}
          onDragOver={(e) => {
            e.preventDefault();
            setDropping(true);
          }}
          onDragLeave={() => setDropping(false)}
          onDrop={(e) => {
            void processDrop(e);
          }}
        ></div>
        <div className="absolute right-[-69%] flex flex-col space-y-1">
          <div className="flex items-center space-x-2">
            <Switch
              id="load-into-current"
              onCheckedChange={(state) => {
                setSettings((prev) => {
                  prev.loadIntoCurrent = state;
                  return prev;
                });
              }}
            />
            <Label htmlFor="load-into-current">Load into current mod</Label>
          </div>
          {/* <div className="flex items-center space-x-2">
            <Switch
              id="delete-duplicate-mods"
              onCheckedChange={(state) => {
                setSettings((prev) => {
                  prev.deleteDuplicateMods = state;
                  return prev;
                });
              }}
            />
            <Label htmlFor="delete-duplicate-mods">Delete duplicate mods</Label>
          </div> */}
        </div>
      </div>
    </>
  );
};
