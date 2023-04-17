import { useContext, useState } from "react";
import { XMLParser } from "fast-xml-parser";
import { getAllFileEntries, fileAsPromise } from "~/utils/fileUtils";
import { string } from "zod";
import { findDefs, findAllTranslatableKeys } from "~/utils/xmlUtils";

const parser = new XMLParser();

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
  // const { translationPairs, setTranslationPairs } = useContext(OldTranslationContext);
  const [dropping, setDropping] = useState(false);
  const bgColor = !dropping ? "bg-slate-300" : "darkened";
  const animated = dropping ? "" : "";
  const [loading, setLoading] = useState(false);

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
          onDrop={(e) => {
            e.preventDefault();
            setDropping(false);

            setLoading(true);
            // getAllFileEntries(e.dataTransfer.items).then(async (entries) => {
            //   const files: File[] = [];
            //   for (const entry of entries) {
            //     if (!entry.name.endsWith(".xml")) continue;

            //     const fileEntry = entry as FileSystemFileEntry;
            //     await fileAsPromise(fileEntry).then((file) => {
            //       files.push(file);
            //     });
            //   }

            //   const newTranslationPairs: TranslationPair[] = [];
            //   for (const file of files) {
            //     try {
            //       const text = await file.text();
            //       const xml = parser.parse(text);

            //       const data = xml.LanguageData;
            //       if (data) {
            //         const dataArr: TranslationPair[] = Object.keys(data).map((key: any) => {
            //           return { key: key, value: data[key] };
            //         });
            //         newTranslationPairs.push(...dataArr);
            //       } else {
            //         const dataArr: TranslationPair[] = [];

            //         const defs = findDefs(xml);

            //         for (const def of defs) {
            //           const keys = findAllTranslatableKeys(def.def, def.defName);
            //           dataArr.push(
            //             ...keys.map((k) => {
            //               return { key: `${file.name}/${k.key}`, value: k.value };
            //             })
            //           );
            //         }

            //         newTranslationPairs.push(...dataArr);
            //       }
            //     } catch (err) {
            //       console.log(err);
            //     }
            //   }
            //   // setTranslationPairs((prev) => [...prev, ...newTranslationPairs]);
            //   setLoading(false);
            // });
          }}
        ></div>
      </div>
    </>
  );
};
