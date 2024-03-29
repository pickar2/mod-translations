import React, { useContext, type Dispatch, type SetStateAction, useState, useEffect, RefObject } from "react";
import { type TranslationKey, type Mod, TranslationContext, Language } from "../contexts/TranslationContext";
import { Button } from "./ui/transparentButton";
import { X, Trash2, BookTemplate, Book, Copy } from "lucide-react";
import { cn } from "~/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { DbKey, keysDb, removeKeyFromDb, updateTranslationInDb } from "~/utils/db";
import { getFromLocalStorage, setToLocalStorage } from "~/utils/localStorageUtils";
import { useLocalStorage } from "@uidotdev/usehooks";
import { Virtuoso, Components } from "react-virtuoso";
import { AutoHeightTextArea } from "./AutoHeightTextArea";

const TranslationRow = (props: {
  currentKey: TranslationKey;
  defaultKey: TranslationKey | undefined;
  index: number;
  mod: Mod;
  removeKey: { (): void };
  onKeyUpdate: { (): void };
}) => {
  const { currentKey, index, mod, removeKey, onKeyUpdate } = props;
  const { currentLanguage, triggerUpdate, triggerTableUpdate } = useContext(TranslationContext);
  const isDefaultLang = currentLanguage == mod.defaultLanguage;
  const defaultKey = props.defaultKey || props.currentKey;
  const hasNoParent = props.defaultKey === undefined;

  const invalid = () => currentKey.values.length > 1;
  function isChangedFromDefault(currentValue: string | undefined): boolean {
    if (isDefaultLang || invalid()) return false;
    return currentValue !== defaultKey.values[0];
  }

  const [changedFromDefault, setChangedFromDefault] = useState(isChangedFromDefault(currentKey.values[0]));

  const [showingDefault, setShowingDefault] = useState(false);

  const [selectingKey, setSelectingKey] = useState(false);
  const [selectingValue, setSelectingValue] = useState(-1);

  const initial = `${currentKey.defType}:${currentKey.defName}${currentKey.key}`;
  const keyStrings = [initial];
  let last = keyStrings[keyStrings.length - 1];
  while (last && last.length > 64) {
    let dotLocation = -1;
    for (let i = 64; i > 0; i--) {
      if (last.charAt(i) === ".") {
        dotLocation = i;
        break;
      }
    }
    if (dotLocation == -1) break;
    keyStrings[keyStrings.length - 1] = last.substring(0, dotLocation);
    keyStrings.push(last.substring(dotLocation));
    last = keyStrings[keyStrings.length - 1];
  }

  return (
    <div
      className={cn(
        "relative flex border-b-[1px] border-l-[1px] border-b-[hsl(var(--border))]",
        !isDefaultLang && "border-l-red-600",
        invalid() && "border-l-blue-600",
        changedFromDefault && "border-l-green-600",
        hasNoParent && "border-l-purple-600"
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute z-[5] h-full w-full bg-red-800 opacity-0 transition-opacity",
          selectingKey && "opacity-[0.15]"
        )}
      />
      <div className="relative flex min-w-[30%] max-w-[30%]">
        <div className="ml-1 flex w-[38px] items-center">
          <span>{index}</span>
        </div>
        <div className="scrollbar-hide flex w-[calc(100%-110px)] items-center overflow-x-scroll">
          <span className="text-md">{keyStrings.join("\n")}</span>
        </div>
        <div className={cn("absolute right-1 flex", currentKey.values.length > 1 && "right-[36px]")}>
          {currentLanguage != mod.defaultLanguage && (
            <div className="mt-1 flex">
              <TooltipProvider delayDuration={400}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => {
                        setShowingDefault((prev) => !prev);
                      }}
                    >
                      {!showingDefault && <BookTemplate />}
                      {showingDefault && <Book />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <span>
                      {!showingDefault && "Show original text"}
                      {showingDefault && "Show translation"}
                    </span>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}

          {currentKey.values.length <= 1 && (
            <div className="flex w-full">
              <div className="mt-1 flex flex-col items-start">
                <TooltipProvider delayDuration={400}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={removeKey}
                        onMouseEnter={() => {
                          setSelectingKey(true);
                        }}
                        onMouseLeave={() => {
                          setSelectingKey(false);
                        }}
                        onFocus={() => {
                          setSelectingKey(true);
                        }}
                        onBlur={() => {
                          setSelectingKey(false);
                        }}
                      >
                        <X />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <span>Remove key</span>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="flex w-full flex-col">
        {showingDefault && (
          <span className={cn("border-[hsl(var(--border)] w-full border-x-[1px] p-2")}>{defaultKey.values[0]}</span>
        )}
        {!showingDefault &&
          currentKey.values.map((text, i) => (
            <div className="relative h-full" key={`${i}${text}`}>
              {currentKey.values.length > 1 && (
                <>
                  <div
                    className={cn(
                      "pointer-events-none absolute z-[5] h-full w-full bg-red-800 opacity-0 transition-opacity",
                      selectingValue == i && "opacity-[0.15]"
                    )}
                  />
                  <div className="absolute left-[-36px] mt-1">
                    <TooltipProvider delayDuration={400}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={() => {
                              currentKey.values.splice(i, 1);
                              currentKey.values = [...currentKey.values];
                              updateTranslationInDb(
                                mod,
                                currentLanguage,
                                `${currentKey.defType}${currentKey.defName}${currentKey.key}`,
                                currentKey.values
                              );
                              onKeyUpdate();
                              triggerTableUpdate();
                            }}
                            onMouseEnter={() => {
                              setSelectingValue(i);
                            }}
                            onMouseLeave={() => {
                              setSelectingValue(-1);
                            }}
                            onFocus={() => {
                              setSelectingValue(i);
                            }}
                            onBlur={() => {
                              setSelectingValue(-1);
                            }}
                          >
                            <Trash2 />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <span>Remove item</span>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </>
              )}
              <AutoHeightTextArea
                index={i}
                values={currentKey.values}
                onTextChange={(s) => {
                  setChangedFromDefault(isChangedFromDefault(s));
                }}
                onFinishEditing={(s) => {
                  currentKey.values[i] = s ?? "";
                  updateTranslationInDb(
                    mod,
                    currentLanguage,
                    `${currentKey.defType}${currentKey.defName}${currentKey.key}`,
                    currentKey.values
                  );
                  onKeyUpdate();
                  triggerTableUpdate();
                }}
                placeholder="Translation"
              />
            </div>
          ))}
      </div>
    </div>
  );
};

enum PageState {
  HasUntranslatedKeys, // red
  HasInvalidKeys, // purple
  HasConflicts, // blue
  AllTranslated, // green
  NoState,
}

const PaginationButtons = (props: {
  page: number;
  setPage: Dispatch<SetStateAction<number>>;
  states: PageState[];
  topDivRef: RefObject<HTMLDivElement>;
  isTop: boolean;
}) => {
  const { page, setPage, states, topDivRef, isTop } = props;
  return (
    <div className="flex flex-row flex-wrap" ref={(isTop && topDivRef) || undefined}>
      {states.map((state, i) => (
        <button
          key={i}
          className={cn(
            `mb-1 mr-1 flex w-8 cursor-pointer select-none items-center justify-center border-[1px] border-[hsl(var(--border))]
             bg-slate-900 px-2 py-1 text-slate-50 outline-none transition-colors hover:bg-slate-800 focus-visible:bg-slate-800`,
            page == i && "border-b-slate-200",
            state == PageState.AllTranslated && "border-t-green-700",
            state == PageState.HasConflicts && "border-t-blue-700",
            state == PageState.HasInvalidKeys && "border-t-purple-700",
            state == PageState.HasUntranslatedKeys && "border-t-red-700"
          )}
          onClick={() => {
            setPage(i);
            // const offset: number = topDivRef.current?.offsetTop || 75;
            // window.scrollTo(0, offset - 75);
          }}
        >
          {i + 1}
        </button>
      ))}
    </div>
  );
};

const TranslationTableControls = (props: {
  mod: Mod;
  langMap: Map<string, TranslationKey>;
  defaultLangMap: Map<string, TranslationKey>;
}) => {
  const { currentLanguage, updateOnTrigger, triggerUpdate, startPage } = useContext(TranslationContext);
  const { mod, langMap, defaultLangMap } = props;
  const [page, setPage] = useState(startPage);
  const [keysPerPage] = useLocalStorage("keysPerPage", 25);

  const [pageStates, setPageStates] = useState<PageState[]>([]);

  const from = page * keysPerPage;
  const to = (page + 1) * keysPerPage;

  useEffect(() => {
    setPage((p) => Math.max(Math.min(p, Math.floor(langMap.size / keysPerPage)), 0));
  }, [mod, currentLanguage, page, langMap.size, keysPerPage]);

  useEffect(() => {
    setToLocalStorage("currentPage", page);
  }, [page]);

  useEffect(() => {
    setPage(startPage);
  }, [startPage]);

  useEffect(() => {
    const isDefaultLang = currentLanguage == mod.defaultLanguage;
    const initialState = (isDefaultLang && PageState.NoState) || PageState.AllTranslated;
    const states = new Array<PageState>(Math.ceil(langMap.size / keysPerPage)).fill(initialState);
    let currentPage = 0;
    let i = 0;
    for (const [hash, key] of langMap) {
      if (!defaultLangMap.has(hash)) {
        states[currentPage] = Math.min(states[currentPage]!, PageState.HasInvalidKeys);
      }
      if (key.values.length !== 1) {
        states[currentPage] = Math.min(states[currentPage]!, PageState.HasConflicts);
      }
      if (!isDefaultLang && key.values.filter((k) => k !== defaultLangMap.get(hash)?.values[0]).length == 0) {
        states[currentPage] = Math.min(states[currentPage]!, PageState.HasUntranslatedKeys);
      }

      if (++i == keysPerPage) {
        i = 0;
        currentPage++;
      }
    }
    setPageStates(states);
  }, [mod, currentLanguage, defaultLangMap, langMap, langMap.size, keysPerPage, updateOnTrigger]);

  const array = new Array<[string, TranslationKey]>();

  let i = 0;
  for (const entry of langMap) {
    if (i >= from) {
      array.push(entry);
    }
    i++;
    if (i >= to) break;
  }

  const topDiv = React.createRef<HTMLDivElement>();
  return (
    <>
      <PaginationButtons page={page} setPage={setPage} states={pageStates} topDivRef={topDiv} isTop={true} />

      <div className="flex flex-col content-center items-center bg-slate-900 text-slate-50">
        <span>
          {mod.name} @ {Language[currentLanguage]}
        </span>
        {
          <Virtuoso
            className="w-[80vw] border-t-[1px] border-[hsl(var(--border))]"
            useWindowScroll={true}
            data={array}
            increaseViewportBy={600}
            itemContent={(index, [hash, key]) => {
              return (
                <TranslationRow
                  key={`${hash}${currentLanguage}`}
                  currentKey={key}
                  defaultKey={defaultLangMap.get(hash)}
                  index={index + from + 1}
                  mod={mod}
                  removeKey={() => {
                    langMap.delete(hash);
                    removeKeyFromDb(mod, currentLanguage, hash);
                    triggerUpdate();
                  }}
                  onKeyUpdate={() => {
                    const states = pageStates;
                    const isDefaultLang = currentLanguage == mod.defaultLanguage;
                    const initialState = (isDefaultLang && PageState.NoState) || PageState.AllTranslated;
                    states[page] = initialState;

                    let i = 0;
                    for (const [hash, key] of langMap) {
                      if (i >= from) {
                        if (!defaultLangMap.has(hash)) {
                          states[page] = Math.min(states[page]!, PageState.HasInvalidKeys);
                        }
                        if (key.values.length !== 1) {
                          states[page] = Math.min(states[page]!, PageState.HasConflicts);
                        }
                        if (
                          !isDefaultLang &&
                          key.values.filter((k) => k !== defaultLangMap.get(hash)?.values[0]).length == 0
                        ) {
                          states[page] = Math.min(states[page]!, PageState.HasUntranslatedKeys);
                        }
                      }
                      i++;
                      if (i >= to) break;
                    }

                    setPageStates([...states]);
                  }}
                />
              );
            }}
          />
        }
      </div>

      <PaginationButtons page={page} setPage={setPage} states={pageStates} topDivRef={topDiv} isTop={false} />
    </>
  );
};

export const TranslationTable = () => {
  const { currentMod, currentLanguage } = useContext(TranslationContext);
  if (!currentMod) return <></>;

  const langMap = currentMod.keys.get(currentLanguage);
  const defaultLangMap = currentMod.keys.get(currentMod.defaultLanguage);
  if (!langMap || !defaultLangMap) return <></>;

  return <TranslationTableControls mod={currentMod} langMap={langMap} defaultLangMap={defaultLangMap} />;
};
