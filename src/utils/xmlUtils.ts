/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { TranslationKey } from "~/contexts/TranslationContext";
import { XMLParser } from "fast-xml-parser";

export const XmlParser = new XMLParser();

export type XMLDef = { defXml: any; defName: string; defType: string };
export function findDefs(xml: any, defType: string): XMLDef[] {
  const defsArray: XMLDef[] = [];

  const keys = Object.keys(xml);
  for (const key of keys) {
    const value = xml[key];
    if (!value) continue;
    if (key === "Defs") {
      if (Object.keys(value).length == 0) continue;
      for (const v of Object.keys(value)) {
        defsArray.push(...findDefs(value, v));
      }
    } else {
      const defName = Object.keys(value).find((k) => k === "defName");
      if (defName) {
        defsArray.push({ defXml: value, defName: value[defName], defType: defType });
      } else {
        if (typeof value === "string") continue;
        if (Object.keys(value).length == 0) continue;
        defsArray.push(...findDefs(value, defType));
      }
    }
  }

  return defsArray;
}

export const translatableKeys: Set<string> = new Set([
  "label",
  "description",
  "descriptionDialogue",
  "letterLabel",
  "letterText",
  "arrivedLetter",
  "approachOrderString",
  "approachingReportString",
  "theme",
  "themeDesc",
  "outComeFirstPlace",
  "outcomeFirstLoser",
  "outComeFirstOther",
  "labelMechanoids",
  "labelMale",
  "labelFemale",
  "labelShort",
  "skillLabel",
  "text",
  "rejectInputMessage",
  "adjective",
  "pawnLabel",
  "gerundLabel",
  "reportString",
  "verb",
  "gerund",
  "deathMessage",
  "pawnsPlural",
  "leaderTitle",
  "jobString",
  "quotation",
  "beginLetterLabel",
  "beginLetter",
  "recoveryMessage",
  "baseInspectLine",
  "graphLabelY",
  "fixedName",
  "letterLabelEnemy",
  "arrivalTextEnemy",
  "letterLabelFriendly",
  "arrivalTextFriendly",
  "Description",
  "endMessage",
  "successfullyRemovedHediffMessage",
  "helpText",
  "description",
  "labelTendedWell",
  "labelTended",
  "labelTendedWellInner",
  "labelTendedInner",
  "labelSolidTendedWell",
  "labelSolidTended",
  "oldLabel",
  "discoverLetterLabel",
  "discoverLetterText",
  "letterLabel",
  "letter",
  "labelSocial",
  "customLabel",
  "destroyedLabel",
  "destroyedOutLabel",
  "summary",
  "symbol",
  "customLabel",
  "useLabel",
  "labelShortAdj",
  "descriptionExtra",
  "labelPrefix",
  "notifyMessage",
  "labelNoun",
  "extraTooltip",
  "descriptionShort",
  "labelInBrackets",
  "message",
  "notifyMessage",
  "instantlyPermanentLabel",
  "permanentLabel",
  "labelNounPretty",
  "messageOnDisappear",
  // "rulesStrings",
  "labelMale",
  "labelFemale",
  "labelPlural",
  "jobString",
  "customSummary",
  "arrivalTextExtra",
  "jobReportOverride",
  "name",
  "inspectString",
  "fuelLabel",
  "completedLetterTitle",
  "completedLetterText",
]);

export function findAllTranslatableKeys(xml: any, name: string): TranslationKey[] {
  const pairs: TranslationKey[] = [];

  const keys = Object.keys(xml);
  for (const key of keys) {
    const value = xml[key];
    if (!value) continue;

    const keyName = `${name}.${key}`;
    if (translatableKeys.has(key)) {
      pairs.push({ defType: "default", defName: "default", key: keyName, values: [value] });
    } else {
      if (typeof value === "string") continue;
      if (Object.keys(value).length == 0) continue;
      pairs.push(...findAllTranslatableKeys(value, keyName));
    }
  }

  return pairs;
}
