import React, { useContext, type Dispatch, type SetStateAction, createRef, useState, useEffect } from "react";
import { IoCloseOutline, IoTrashOutline } from "react-icons/io5";
import { type TranslationKey, type Mod, TranslationContext, Language } from "../contexts/TranslationContext";
import { Button } from "./ui/transparentButton";
import { cn } from "~/lib/utils";

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

  useEffect((): void => {
    updateHeight(textAreaRef.current);
    onTextChange(textAreaRef.current?.value);
  }, []);

  return (
    <div
      className={cn(
        "w-full border-l-[1px] border-r-[1px] border-[hsl(var(--border))]",
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

const TranslationRow = (props: { tKey: TranslationKey; index: number; mod: Mod; removeKey: { (): void } }) => {
  const { tKey: key, index, mod, removeKey } = props;
  const { currentLanguage } = useContext(TranslationContext);

  const [values, setValues] = useState<string[]>(key.values);
  useEffect(() => {
    setValues(key.values);
  }, [currentLanguage]);

  const invalid = () => values.length > 1;
  function isChangedFromDefault(currentValue: string | undefined): boolean {
    if (currentLanguage == mod.defaultLanguage || invalid()) return false;

    const defaultLang = mod.keys.get(mod.defaultLanguage);
    if (!defaultLang) return true;

    const defaultValue = defaultLang.get(key.defType + key.defName + key.key)?.values[0];
    return currentValue !== defaultValue;
  }

  const [changedFromDefault, setChangedFromDefault] = useState(isChangedFromDefault(values[0]));

  useEffect(() => {
    key.values = values;
    setChangedFromDefault(isChangedFromDefault(values[0]));
  }, [values]);

  return (
    <>
      <div
        className={cn(
          "flex items-center justify-center border-b-[1px] border-l-[1px] border-[hsl(var(--border))]",
          invalid() && "border-l-blue-600",
          changedFromDefault && "border-l-green-600"
        )}
      >
        <span className="p-1">{index}</span>
      </div>

      <div className="flex items-center border-b-[1px] border-[hsl(var(--border))]">
        <span className="text-sm text-slate-500">{key.defType}</span>
        <span className="text-sm text-slate-500">:</span>
        <span>
          {key.defName}
          {key.key}
        </span>
      </div>

      <div className="flex flex-row border-b-[1px] border-[hsl(var(--border))]">
        <div className="grid w-full grid-flow-row grid-cols-[34px_1fr]">
          {values.map((v, i) => {
            return (
              <React.Fragment key={v}>
                <div className="flex items-center">
                  {values.length == 1 && (
                    <Button onClick={() => removeKey()}>
                      <IoCloseOutline />
                    </Button>
                  )}
                  {values.length > 1 && (
                    <Button
                      onClick={() => {
                        setValues((prev) => {
                          prev.splice(i, 1);
                          return [...prev];
                        });
                      }}
                    >
                      <IoTrashOutline />
                    </Button>
                  )}
                </div>
                <AutoHeightTextArea
                  index={i}
                  values={values}
                  onTextChange={(s) => {
                    setChangedFromDefault(isChangedFromDefault(s));
                  }}
                  onFinishEditing={(s) => {
                    key.values[i] = s ?? "";
                  }}
                />
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </>
  );
};

const PaginationButtons = (props: { page: number; setPage: Dispatch<SetStateAction<number>>; buttonCount: number }) => {
  const { page, setPage, buttonCount } = props;
  return (
    <div className="flex flex-row flex-wrap ">
      {[...(Array(buttonCount) as void[])].map((_, i) => (
        <button
          key={i}
          className={cn(
            `mb-1 mr-1 flex w-8 cursor-pointer select-none items-center justify-center border-[1px] border-[hsl(var(--border))]
             bg-slate-900 px-2 py-1 text-slate-50 outline-none transition-colors hover:bg-slate-800 focus:bg-slate-800`,
            page == i && "border-b-slate-200"
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

const TranslationTableControls = (props: { mod: Mod; langMap: Map<string, TranslationKey> }) => {
  const { currentLanguage, updateOnTrigger, triggerUpdate } = useContext(TranslationContext);
  const { mod, langMap } = props;
  const [page, setPage] = useState(0);

  const keysPerPage = 50;
  const from = page * keysPerPage;
  const to = (page + 1) * keysPerPage;

  useEffect(() => {
    setPage((p) => Math.max(Math.min(p, Math.floor(langMap.size / keysPerPage)), 0));
  }, [mod, currentLanguage, page, langMap.size]);

  const array = new Array<[string, TranslationKey]>(50);

  let i = 0;
  let index = 0;
  for (const entry of langMap) {
    if (i >= from) {
      array[index++] = entry;
    }
    if (i >= to) break;
    i++;
  }

  return (
    <>
      <PaginationButtons page={page} setPage={setPage} buttonCount={Math.ceil(langMap.size / keysPerPage)} />

      <div className="flex flex-col content-center items-center bg-slate-900 text-slate-50">
        <span>
          {mod.name} @ {Language[currentLanguage]}
        </span>
        <div className="grid w-[1200px] grid-flow-row grid-cols-[36px_3fr_4fr] border-t-[1px] border-[hsl(var(--border))]">
          {array.map(([hash, key], index) => (
            <TranslationRow
              key={`${hash}${currentLanguage}`}
              tKey={key}
              index={index + from + 1}
              mod={mod}
              removeKey={() => {
                langMap.delete(hash);
                triggerUpdate();
              }}
            />
          ))}
        </div>
      </div>

      <PaginationButtons page={page} setPage={setPage} buttonCount={Math.ceil(langMap.size / keysPerPage)} />
    </>
  );
};

export const TranslationTable = () => {
  const { currentMod, currentLanguage } = useContext(TranslationContext);
  if (!currentMod) return <></>;

  const langMap = currentMod.keys.get(currentLanguage);
  if (!langMap) return <></>;

  return <TranslationTableControls mod={currentMod} langMap={langMap} />;
};
