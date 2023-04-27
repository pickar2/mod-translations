import React, { useContext, Dispatch, SetStateAction, createRef, useState, useEffect } from "react";
import { IoCloseOutline, IoTrashOutline } from "react-icons/io5";
import { TranslationKey, Mod, TranslationContext, Language } from "../contexts/TranslationContext";
import { Button } from "./Button2";
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
    const newHeight = element.scrollHeight + "px";
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
        onFocus={(e) => {
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

const TranslationRow = (props: { tKey: TranslationKey; index: number; mod: Mod; removeKey: Function }) => {
  const { tKey: key, index, mod, removeKey } = props;
  const { currentLanguage } = useContext(TranslationContext);

  const [values, setValues] = useState<string[]>(key.values);
  useEffect(() => {
    setValues(key.values);
  }, [currentLanguage]);

  const invalid = () => values.length > 1;
  const isChangedFromDefault = (currentValue: string | undefined) => {
    const defaultValue = mod.keys.get(mod.defaultLanguage)!.get(key.defType + key.defName + key.key)?.values[0];
    return !(currentLanguage == mod.defaultLanguage) && !invalid() && currentValue !== defaultValue;
  };

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
        <span className="text-sm text-slate-500">{key.defType}:</span>
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
                    <Button onClick={(e) => removeKey()}>
                      <IoCloseOutline />
                    </Button>
                  )}
                  {values.length > 1 && (
                    <Button
                      onClick={(e) => {
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
                    key.values[i] = s!;
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
      {[...Array(buttonCount)].map((x, i) => (
        <button
          key={i}
          className={cn(
            `mb-1 mr-1 flex w-8 cursor-pointer select-none items-center justify-center border-[1px] border-[hsl(var(--border))]
             bg-slate-900 px-2 py-1 text-slate-50 outline-none transition-colors hover:bg-slate-800 focus:bg-slate-800`,
            page == i && "border-b-slate-200"
          )}
          onClick={(e) => {
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

const TranslationTableControls = (props: { array: [string, TranslationKey][] }) => {
  const { currentMod, currentLanguage, updateOnTrigger, triggerUpdate } = useContext(TranslationContext);
  const { array } = props;
  const [page, setPage] = useState(0);

  const keysPerPage = 50;
  const from = page * keysPerPage;
  const to = (page + 1) * keysPerPage;

  useEffect(() => {
    if (!currentMod) return;
    const lang = currentMod.keys.get(currentLanguage);
    if (!lang) return;

    setPage((p) => Math.max(Math.min(p, Math.floor(lang.size / keysPerPage)), 0));
  }, [currentMod, currentLanguage, page]);

  if (!currentMod) return <></>;
  const languageKeys = currentMod.keys.get(currentLanguage)!;
  return (
    <>
      <PaginationButtons page={page} setPage={setPage} buttonCount={Math.ceil(languageKeys.size / keysPerPage)} />

      <div className="flex flex-col content-center items-center bg-slate-900 text-slate-50">
        <span>
          {currentMod.name} @ {Language[currentLanguage]}
        </span>
        <div className="grid w-[1200px] grid-flow-row grid-cols-[36px_3fr_4fr] border-t-[1px] border-[hsl(var(--border))]">
          {array.slice(from, to).map(([hash, key], index) => (
            <TranslationRow
              key={hash + currentLanguage}
              tKey={key}
              index={index + from + 1}
              mod={currentMod}
              removeKey={() => {
                languageKeys.delete(hash);
                triggerUpdate();
              }}
            />
          ))}
        </div>
      </div>

      <PaginationButtons page={page} setPage={setPage} buttonCount={Math.ceil(languageKeys.size / keysPerPage)} />
    </>
  );
};

export const TranslationTable = () => {
  const { currentMod, currentLanguage } = useContext(TranslationContext);
  if (!currentMod || !currentMod.keys.has(currentLanguage)) return <></>;

  const arr = Array.from(currentMod.keys.get(currentLanguage)!);
  return <TranslationTableControls array={arr} />;
};
