import { Language, Mod, TranslationKey } from "~/contexts/TranslationContext";
import JSZip from "jszip";
import { saveAs } from "file-saver";

const langDataStart = `<?xml version="1.0" encoding="UTF-8"?>
<LanguageData>\n`;
const langDataEnd = `</LanguageData>`;

export function compileTranslations(mod: Mod) {
  const zip = new JSZip();

  const aboutFolder = zip.folder("About");
  const languagesFolder = zip.folder("Languages");
  if (!aboutFolder || !languagesFolder) throw new Error("Failed to create folders in zip file.");

  const aboutText = `<?xml version="1.0" encoding="utf-8"?>
<ModMetaData>
  <name>${mod.name} Translation</name>
  <packageId>Community.Translation.${mod.id}</packageId>
  <author>Community</author>
  <url>\${site_url}</url>
  <supportedVersions>
    <li>1.0</li>
    <li>1.2</li>
    <li>1.3</li>
    <li>1.4</li>
  </supportedVersions>
  <modDependencies>
    <li>
      <packageId>${mod.id}</packageId>
      <displayName>${mod.name}</displayName>
    </li>
  </modDependencies>
  <loadAfter>
    <li>${mod.id}</li>
  </loadAfter>
  <description>Translation of ${mod.name} via \${site_name}</description>
</ModMetaData>`;
  aboutFolder.file("About.xml", aboutText);

  const defaultLanguageKeys = mod.keys.get(mod.defaultLanguage);
  if (!defaultLanguageKeys) throw new Error("Mod does not have default language.");

  for (const [language, keyMap] of mod.keys) {
    if (language === mod.defaultLanguage) continue;

    const langName: string = Language[language];
    const langFolder = languagesFolder.folder(langName)!;
    const defInjectedFolder = langFolder.folder("DefInjected")!;

    let keyed = langDataStart;
    let hasKeyed = false;
    const defTextMap = new Map<string, string>();
    for (const [hash, key] of keyMap) {
      if (key.values.length != 1) continue;
      const defaultKey = defaultLanguageKeys.get(hash);
      if (!defaultKey || defaultKey.values.length != 1 || defaultKey.values[0] === key.values[0]) continue;

      if (key.defType === "Keyed" && key.defName === "") {
        keyed += `\t<${key.key}>${key.values[0]!.replaceAll("\n", "\\n")}</${key.key}>\n`;
        hasKeyed = true;
      } else {
        if (!defTextMap.has(key.defType)) defTextMap.set(key.defType, langDataStart);
        defTextMap.set(
          key.defType,
          `${defTextMap.get(key.defType)!}\t<${key.defName}${key.key}>${key.values[0]!.replaceAll("\n", "\\n")}</${
            key.defName
          }${key.key}>\n`
        );
      }
    }

    if (hasKeyed) langFolder.folder("Keyed")!.file("Keys.xml", keyed + langDataEnd);
    for (const [key, value] of defTextMap) {
      defInjectedFolder.file(`${key}.xml`, value + langDataEnd);
    }
  }

  void zip.generateAsync({ type: "blob" }).then(function (content) {
    saveAs(content, `${mod.name}_translation.zip`);
  });
}
