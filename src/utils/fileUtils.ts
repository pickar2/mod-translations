/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Language, Mod } from "~/contexts/TranslationContext";
import { XmlParser } from "./xmlUtils";
import semver from "semver";
import { keysOfEnum } from "~/utils/enumUtils";

export function fileAsPromise(entry: FileSystemFileEntry) {
  return new Promise<File>((resolve, reject) => {
    entry.file(resolve, reject);
  });
}

// Adapted code from https://stackoverflow.com/a/53058574/18346347
// Drop handler function to get all files
export async function getAllFileEntries(
  dataTransferItemList: DataTransferItemList,
  filter?: { (value: FileSystemEntry): boolean }
) {
  const fileEntries = [];
  // Use BFS to traverse entire directory/file structure
  const queue: FileSystemEntry[] = [];
  // Unfortunately dataTransferItemList is not iterable i.e. no forEach
  for (let i = 0; i < dataTransferItemList.length; i++) {
    // Note webkitGetAsEntry a non-standard feature and may change
    // Usage is necessary for handling directories
    const item = dataTransferItemList[i];
    if (!item) continue;
    const entry = item.webkitGetAsEntry();
    if (!entry) continue;
    queue.push(entry);
  }
  while (true) {
    const entry = queue.shift();
    if (!entry) break;

    if (filter && !filter(entry)) continue;

    if (entry.isFile) {
      fileEntries.push(entry);
    } else if (entry.isDirectory) {
      const directory = entry as FileSystemDirectoryEntry;
      const entries = await readAllDirectoryEntries(directory.createReader());
      queue.push(...entries);
    }
  }
  return fileEntries;
}

export async function parseRimworldModDirectory(mod: Mod, directory: Directory, version: string) {
  // find folders with defs
  const foldersWithDefs: Directory[] = [];

  let parsed = false;
  const loadOrderFile = directory.files.find((f) => f.name === "LoadOrder.xml" || f.name === "LoadFolders.xml");
  if (loadOrderFile) {
    const xml = XmlParser.parse(await loadOrderFile.text());
    const loadFolders = xml.loadFolders;
    if (loadFolders) {
      if (version === "@latest") {
        const keys = Object.keys(xml.loadFolders);
        const versions = keys.map((s) => ({ name: s, version: semver.coerce(s) })).filter((v) => v.version != null);
        versions.sort((a, b) => semver.compareBuild(b.version!, a.version!));

        const first = versions[0]?.name ?? "1.0";
        let toLoad: string[] = ["/"];
        if (Array.isArray(loadFolders[first].li)) {
          toLoad = (loadFolders[first].li as object[]).map((a) => a.toString());
        } else {
          toLoad = [(loadFolders[first].li as object).toString()];
        }

        if (toLoad.includes("/")) {
          foldersWithDefs.push(...directory.directories);
        } else {
          foldersWithDefs.push(...directory.directories.filter((d) => toLoad.includes(d.name)));
        }

        parsed = true;
      } else if (xml.loadFolders[version]?.li) {
        const toLoad: string[] = (loadFolders[version].li as object[]).map((a) => a.toString());
        foldersWithDefs.push(...directory.directories.filter((d) => toLoad.includes(d.name)));

        parsed = true;
      }
    }
  }
  if (!parsed) {
    if (version === "@latest") {
      const versions = directory.directories
        .map((s) => ({ name: s.name, version: semver.coerce(s.name) }))
        .filter((v) => v.version != null);

      versions.sort((a, b) => semver.compareBuild(b.version!, a.version!));

      foldersWithDefs.push(...directory.directories.filter((d) => d.name === versions[0]?.name));
    } else {
      foldersWithDefs.push(...directory.directories.filter((d) => d.name === version));
    }
  }

  //find folders with translations
  const foldersWithDefTranslations: { language: Language; directory: Directory }[] = [];
  const foldersWithKeyedTranslations: { language: Language; directory: Directory }[] = [];
  const languagesFolder = directory.directories.find((d) => d.name === "Languages");
  if (languagesFolder) {
    const languages = keysOfEnum(Language).map((k) => ({ name: k.toString(), lang: k }));
    for (const folder of languagesFolder.directories) {
      const currentLang = languages.find((l) => l.name === folder.name);
      if (!currentLang) continue;
      for (const dir of folder.directories) {
        if (dir.name === "Keyed") {
          foldersWithKeyedTranslations.push({ language: Language[currentLang.lang], directory: dir });
        } else if (dir.name === "DefInjected") {
          foldersWithDefTranslations.push({ language: Language[currentLang.lang], directory: dir });
        }
      }
    }
  }

  return { foldersWithDefs, foldersWithDefTranslations, foldersWithKeyedTranslations };
}

export type ModIdWithDirectory = {
  modId: string;
  directory: Directory;
};

export async function tryFindMod(directory: Directory): Promise<ModIdWithDirectory | null> {
  const aboutFolder = directory.directories.find((dir) => dir.name === "About");
  const aboutFile = aboutFolder?.files.find((f) => f.name === "About.xml");
  if (aboutFolder && aboutFile) {
    const xml = XmlParser.parse(await aboutFile.text());
    const modMetaData = xml.ModMetaData;
    const packageId = modMetaData?.packageId;
    if (modMetaData && packageId) {
      return { modId: packageId, directory: directory };
    }
  }

  return null;
}

export async function findRimworldMods(directory: Directory, defaultModId: string): Promise<ModIdWithDirectory[]> {
  const mod = await tryFindMod(directory);
  if (mod) return [mod];

  const modDirArray: ModIdWithDirectory[] = [];
  const dirsWithNoMods: Directory[] = [];
  for (const subDir of directory.directories) {
    const deepMods = await findRimworldMods(subDir, defaultModId);
    if (deepMods.length != 0) {
      modDirArray.push(...deepMods);
    } else {
      dirsWithNoMods.push(subDir);
    }
  }

  const hasMods = modDirArray.length != 0;
  if (hasMods) {
    for (const subDir of dirsWithNoMods) {
      modDirArray.push({ modId: defaultModId, directory: subDir });
    }
  }

  // if directory is root and no mods was found => add root to default mod
  if (directory.parent == null && !hasMods) {
    modDirArray.push({ modId: defaultModId, directory: directory });
  }

  return modDirArray;
}

export type Directory = {
  parent: Directory | null;
  name: string;
  files: File[];
  directories: Directory[];
};

function createDirectory(name: string, parent: Directory | null): Directory {
  return { parent, name, files: [], directories: [] };
}

export async function parseFiles(dataTransferItemList: DataTransferItemList) {
  const root: Directory = createDirectory("/", null);
  for (let i = 0; i < dataTransferItemList.length; i++) {
    const item = dataTransferItemList[i];
    if (!item) continue;
    const entry = item.webkitGetAsEntry();
    if (!entry) continue;

    await parseDirectory(entry, root);
  }

  return root;
}

async function parseDirectory(entry: FileSystemEntry, parent: Directory) {
  if (entry.isFile) {
    const file = await fileAsPromise(entry as FileSystemFileEntry);
    parent.files.push(file);
  } else {
    const dir = createDirectory(entry.name, parent);
    const reader = (entry as FileSystemDirectoryEntry).createReader();
    const entries = await readAllDirectoryEntries(reader);
    for (const entry of entries) {
      await parseDirectory(entry, dir);
    }
    // skip empty folders
    if (dir.directories.length != 0 || dir.files.length != 0) {
      parent.directories.push(dir);
    }
  }
}

// Get all the entries (files or sub-directories) in a directory
// by calling readEntries until it returns empty array
export async function readAllDirectoryEntries(directoryReader: FileSystemDirectoryReader) {
  const entries = [];
  let readEntries = await readEntriesPromise(directoryReader);
  while (readEntries && readEntries.length > 0) {
    entries.push(...readEntries);
    readEntries = await readEntriesPromise(directoryReader);
  }

  return entries;
}

// Wrap readEntries in a promise to make working with readEntries easier
// readEntries will return only some of the entries in a directory
// e.g. Chrome returns at most 100 entries at a time
export async function readEntriesPromise(
  directoryReader: FileSystemDirectoryReader
): Promise<FileSystemEntry[] | undefined> {
  try {
    return await new Promise((resolve, reject) => {
      directoryReader.readEntries(resolve, reject);
    });
  } catch (err) {
    console.log(err);
  }
}
