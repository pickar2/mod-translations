import React, { useContext, type Dispatch, type SetStateAction, createRef, useState, useEffect } from "react";
import { type TranslationKey, type Mod, TranslationContext, Language } from "../contexts/TranslationContext";
import { Button } from "./ui/transparentButton";
import { X, Trash2, BookTemplate, Book } from "lucide-react";
import { cn } from "~/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { keysDb, removeKeyFromDb, updateTranslationInDb } from "~/utils/db";
import { getFromLocalStorage, setToLocalStorage } from "~/utils/localStorageUtils";
import { useLocalStorage } from "@uidotdev/usehooks";

const AutoHeightTextArea = (props: {
  index: number;
  values: string[];
  onTextChange: (value: string | undefined) => void;
  onFinishEditing: (value: string | undefined) => void;
}) => {
  const { index, values, onFinishEditing, onTextChange } = props;
  const textAreaRef = createRef<HTMLTextAreaElement>();
  const defaultHeight = "40px";
  const [editingIndex, setEditingIndex] = useState<number>(-1);

  function updateHeight(element: HTMLTextAreaElement | null): void {
    if (!element) return;

    element.style.height = defaultHeight;
    const newHeight = `${element.scrollHeight}px`;
    element.style.height = newHeight;
  }

  // TODO: update height on table width change
  useEffect((): void => {
    updateHeight(textAreaRef.current);
    onTextChange(textAreaRef.current?.value);
  }, []);

  return (
    <div
      className={cn(
        "transition-border flex h-full w-full items-center border-x-[1px]  border-[hsl(var(--border))]",
        index != values.length - 1 && "border-b-[1px]",
        editingIndex == index && "border-x-slate-200"
      )}
    >
      <textarea
        ref={textAreaRef}
        className={`flex w-full resize-none items-center overflow-hidden bg-slate-900 p-2 outline-none transition-colors hover:bg-slate-800 focus:bg-slate-800 `}
        style={{ height: defaultHeight }}
        placeholder="Translation"
        wrap="soft"
        defaultValue={values[index]}
        rows={1}
        spellCheck={false}
        onChange={(e) => {
          updateHeight(e.currentTarget);
          onTextChange(e.currentTarget.value);
        }}
        onFocus={() => {
          setEditingIndex(index);
          // onUpdate(e.currentTarget.value);
        }}
        onBlur={(e) => {
          setEditingIndex(-1);
          onFinishEditing(e.currentTarget.value);
          // onUpdate(e.currentTarget.value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") e.currentTarget.blur();
        }}
      />
    </div>
  );
};

const TranslationRow = (props: {
  currentKey: TranslationKey;
  defaultKey: TranslationKey | undefined;
  index: number;
  mod: Mod;
  removeKey: { (): void };
  onKeyUpdate: { (): void };
}) => {
  const { currentKey, index, mod, removeKey, onKeyUpdate } = props;
  const { currentLanguage } = useContext(TranslationContext);
  const defaultKey = props.defaultKey || props.currentKey;
  const hasNoParent = props.defaultKey === undefined;

  const [values, setValues] = useState<string[]>(currentKey.values);
  useEffect(() => {
    setValues(currentKey.values);
  }, [currentKey.values, currentLanguage]);

  const invalid = () => values.length > 1;
  function isChangedFromDefault(currentValue: string | undefined): boolean {
    if (currentLanguage == mod.defaultLanguage || invalid()) return false;
    return currentValue !== defaultKey.values[0];
  }

  const [changedFromDefault, setChangedFromDefault] = useState(isChangedFromDefault(values[0]));

  useEffect(() => {
    currentKey.values = values;
    updateTranslationInDb(mod, currentLanguage, `${currentKey.defType}${currentKey.defName}${currentKey.key}`, values);
    if (!invalid()) setChangedFromDefault(isChangedFromDefault(values[0]));
    onKeyUpdate();
  }, [values]);

  const [showingDefault, setShowingDefault] = useState(false);

  const [selectingKey, setSelectingKey] = useState(false);
  const [selectingValue, setSelectingValue] = useState(-1);

  return (
    <>
      <div
        className={cn(
          "relative flex items-center justify-center border-b-[1px] border-l-[1px] border-[hsl(var(--border))]",
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
        <span className="p-1">{index}</span>
      </div>

      <div className="relative flex items-center border-b-[1px] border-[hsl(var(--border))]">
        <div
          className={cn(
            "pointer-events-none absolute z-[5] h-full w-full bg-red-800 opacity-0 transition-opacity",
            selectingKey && "opacity-[0.15]"
          )}
        />
        <span className="text-sm text-slate-500">{currentKey.defType}</span>
        <span className="text-sm text-slate-500">:</span>
        <span>
          {currentKey.defName}
          {currentKey.key}
        </span>
      </div>

      <div className="relative flex flex-row border-b-[1px] border-[hsl(var(--border))]">
        <div
          className={cn(
            "pointer-events-none absolute z-[5] h-full w-full bg-red-800 opacity-0 transition-opacity",
            selectingKey && "opacity-[0.15]"
          )}
        />
        {currentLanguage != mod.defaultLanguage && (
          <div className="mt-1 flex items-start">
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
          {showingDefault && (
            <span className={cn("border-[hsl(var(--border)] w-full border-x-[1px] p-2")}>{defaultKey.values[0]}</span>
          )}
          {!showingDefault && (
            <div className="flex w-full flex-col">
              {values.map((v, i) => {
                return (
                  <div
                    key={v}
                    className={cn(
                      "relative",
                      values.length > 1 && i == 0 && `min-h-[65px]`,
                      values.length > 1 && i !== 0 && `min-h-[64px]`
                    )}
                  >
                    <div
                      className={cn(
                        "pointer-events-none absolute h-full w-full bg-red-800 opacity-0 transition-opacity",
                        selectingValue == i && "opacity-[0.1]"
                      )}
                    />
                    {values.length > 1 && (
                      <div className="absolute bottom-0 left-[-32px]">
                        <TooltipProvider delayDuration={400}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                onClick={() => {
                                  setValues((prev) => {
                                    prev.splice(i, 1);
                                    return [...prev];
                                  });
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
                    )}
                    <AutoHeightTextArea
                      index={i}
                      values={values}
                      onTextChange={(s) => {
                        setChangedFromDefault(isChangedFromDefault(s));
                      }}
                      onFinishEditing={(s) => {
                        setValues((prev) => {
                          prev[i] = s ?? "";
                          return prev;
                        });
                        updateTranslationInDb(
                          mod,
                          currentLanguage,
                          `${currentKey.defType}${currentKey.defName}${currentKey.key}`,
                          values
                        );
                        onKeyUpdate();
                      }}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

enum PageState {
  HasUntranslatedKeys, // red
  HasInvalidKeys, // purple
  HasConflicts, // blue
  AllTranslated, // default
}

const PaginationButtons = (props: { page: number; setPage: Dispatch<SetStateAction<number>>; states: PageState[] }) => {
  const { page, setPage, states } = props;
  return (
    <div className="flex flex-row flex-wrap ">
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
            window.scrollTo(0, 0);
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
    const states = new Array<PageState>(Math.ceil(langMap.size / keysPerPage)).fill(PageState.AllTranslated);
    let currentPage = 0;
    let i = 0;
    for (const [hash, key] of langMap) {
      if (!defaultLangMap.has(hash)) {
        states[currentPage] = Math.min(states[currentPage]!, PageState.HasInvalidKeys);
      }
      if (key.values.length !== 1) {
        states[currentPage] = Math.min(states[currentPage]!, PageState.HasConflicts);
      }
      if (key.values.filter((k) => k !== defaultLangMap.get(hash)?.values[0]).length == 0) {
        states[currentPage] = Math.min(states[currentPage]!, PageState.HasUntranslatedKeys);
      }

      if (++i == keysPerPage) {
        i = 0;
        currentPage++;
      }
    }
    setPageStates(states);
  }, [mod, currentLanguage, defaultLangMap, langMap, langMap.size, keysPerPage]);

  const array = new Array<[string, TranslationKey]>(50);

  let i = 0;
  let index = 0;
  for (const entry of langMap) {
    if (i >= from) {
      array[index++] = entry;
    }
    i++;
    if (i >= to) break;
  }

  return (
    <>
      <PaginationButtons page={page} setPage={setPage} states={pageStates} />

      <div className="flex flex-col content-center items-center bg-slate-900 text-slate-50">
        <span>
          {mod.name} @ {Language[currentLanguage]}
        </span>
        <div className="relative grid w-[80vw] grid-flow-row grid-cols-[36px_2fr_3fr] border-t-[1px] border-[hsl(var(--border))]">
          {array.map(([hash, key], index) => (
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
                states[page] = PageState.AllTranslated;

                let i = 0;
                for (const [hash, key] of langMap) {
                  if (i >= from) {
                    if (!defaultLangMap.has(hash)) {
                      states[page] = Math.min(states[page]!, PageState.HasInvalidKeys);
                    }
                    if (key.values.length !== 1) {
                      states[page] = Math.min(states[page]!, PageState.HasConflicts);
                    }
                    if (key.values.filter((k) => k !== defaultLangMap.get(hash)?.values[0]).length == 0) {
                      states[page] = Math.min(states[page]!, PageState.HasUntranslatedKeys);
                    }
                  }
                  i++;
                  if (i >= to) break;
                }

                setPageStates([...states]);
              }}
            />
          ))}
        </div>
      </div>

      <PaginationButtons page={page} setPage={setPage} states={pageStates} />
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
