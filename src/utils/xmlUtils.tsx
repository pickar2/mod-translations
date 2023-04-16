import { TranslationPair } from "~/pages/components/TranslationTable";

export type XMLDef = { defName: string; def: any };
export function findDefs(xml: any): XMLDef[] {
  const defs: XMLDef[] = [];

  const keys = Object.keys(xml);
  for (const key of keys) {
    const value = xml[key];
    if (!value) continue;
    const defName = Object.keys(value).find((k) => k === "defName");
    if (defName) {
      defs.push({ defName: value[defName], def: value });
    } else {
      if (typeof value === "string") continue;
      if (Object.keys(value).length == 0) continue;
      defs.push(...findDefs(value));
    }
  }

  return defs;
}

export const translatableKeys: Set<string> = new Set([
  "label",
  "description",
  "letterLabel",
  "letterText",
  "theme",
  "themeDesc",
  "outComeFirstPlace",
  "outcomeFirstLoser",
  "outComeFirstOther",
]);

export function findAllTranslatableKeys(xml: any, name: string): TranslationPair[] {
  const pairs: TranslationPair[] = [];

  const keys = Object.keys(xml);
  for (const key of keys) {
    const value = xml[key];
    if (!value) continue;

    const keyName = `${name}.${key}`;
    if (translatableKeys.has(key)) {
      pairs.push({ key: keyName, value: value });
    } else {
      if (typeof value === "string") continue;
      if (Object.keys(value).length == 0) continue;
      pairs.push(...findAllTranslatableKeys(value, keyName));
    }
  }

  return pairs;
}
