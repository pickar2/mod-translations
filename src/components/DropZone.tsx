import { useContext, useEffect, useState } from "react";
import {
  getAllFileEntries,
  fileAsPromise,
  parseFiles,
  Directory,
  findRimworldMods,
  parseRimworldModDirectory,
} from "~/utils/fileUtils";
import { findDefs, findAllTranslatableKeys, XmlParser } from "~/utils/xmlUtils";
import { Language, Mod, TranslationContext, TranslationKey } from "../contexts/TranslationContext";

export const verifyZoneOnFileDrop = (event: any) => {
  if (event.target.matches(".dropzone")) {
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

export const DropZone = () => {
  const { mods, currentMod, addMod, addTranslation, triggerUpdate, currentLanguage } = useContext(TranslationContext);
  const [dropping, setDropping] = useState(false);
  const bgColor = !dropping ? "bg-slate-300" : "darkened";
  const animated = dropping ? "" : "";
  const [loading, setLoading] = useState(false);

  // useEffect(() => {
  //   const dummyMod = addMod("DummyMod", "Dummy.ModId", Language.English);

  //   addTranslation(dummyMod, Language.English, "some/path/File.xml", "DefDummyOne.label", ["Dummy label one"]);
  //   addTranslation(dummyMod, Language.Russian, "some/path/File.xml", "DefDummyOne.label", [
  //     "Пустышка с названием одинПустышка с названием одинПустышка с названием одинПустышка с названием одинПустышка с названием одинПустышка с названием одинПустышка с названием одинПустышка с названием одинПустышка с названием одинПустышка с названием одинПустышка с названием один",
  //   ]);
  //   addTranslation(dummyMod, Language.Russian, "some/path/File.xml", "DefDummyOne.label", ["Первая пустышка"]);

  //   addTranslation(dummyMod, Language.English, "some/path/File.xml", "DefDummySecond.label", [
  //     "Dummy label second",
  //     "Other text",
  //   ]);

  //   addTranslation(dummyMod, Language.English, "some/path/OtherFile.xml", "DefDummyOtherFile.label", [
  //     "Label in other file",
  //   ]);
  // }, []);

  return (
    <>
      {loading && <Loading />}
      <div className={`flex items-center rounded-[18px] border-2 border-purple-200 p-0 ${animated}`}>
        <div
          className={`flex items-center rounded-2xl border-2 border-purple-600 ${bgColor} dropzone p-14`}
          onDragOver={(e) => {
            e.preventDefault();
            setDropping(true);
          }}
          onDragLeave={() => setDropping(false)}
          onDrop={async (e) => {
            e.preventDefault();
            setDropping(false);

            setLoading(true);

            const root: Directory = await parseFiles(e.dataTransfer.items);
            // console.log(root);
            const modDirectories = await findRimworldMods(root, "default");
            // console.log(mods);
            const modsWithDir: { mod: Mod; directory: Directory }[] = modDirectories.map((mDir) => {
              let mod = mods.find((m) => m.id === mDir.modId);
              if (!mod) mod = addMod(mDir.modId, mDir.modId, Language.English);
              return { mod: mod, directory: mDir.directory };
            });

            for (const modEntry of modsWithDir) {
              const parsed = await parseRimworldModDirectory(modEntry.mod, modEntry.directory, "@latest");
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
                addTranslation(
                  modEntry.mod,
                  modEntry.mod.defaultLanguage,
                  key.defType,
                  key.defName,
                  key.key,
                  key.values
                );
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
                    addTranslation(modEntry.mod, folder.language, key.defType, key.defName, key.key, key.values);
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
                  addTranslation(modEntry.mod, folder.language, key.defType, key.defName, key.key, key.values);
                }
              }
            }
            triggerUpdate();
            setLoading(false);
          }}
        ></div>
      </div>
    </>
  );
};
