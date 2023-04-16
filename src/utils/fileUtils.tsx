export function fileAsPromise(entry: FileSystemFileEntry) {
  return new Promise<File>((resolve, reject) => {
    entry.file(resolve, reject);
  });
}

// Adapted code from https://stackoverflow.com/a/53058574/18346347
// Drop handler function to get all files
export async function getAllFileEntries(dataTransferItemList: DataTransferItemList) {
  let fileEntries = [];
  // Use BFS to traverse entire directory/file structure
  let queue: FileSystemEntry[] = [];
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
    if (entry.isFile) {
      fileEntries.push(entry);
    } else if (entry.isDirectory) {
      const directory = entry as FileSystemDirectoryEntry;
      queue.push(...(await readAllDirectoryEntries(directory.createReader())));
    }
  }
  return fileEntries;
}

// Get all the entries (files or sub-directories) in a directory
// by calling readEntries until it returns empty array
export async function readAllDirectoryEntries(directoryReader: FileSystemDirectoryReader) {
  let entries = [];
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
