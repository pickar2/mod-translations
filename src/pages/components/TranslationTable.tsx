import React, { useContext, Dispatch, SetStateAction, createRef, useState, useEffect } from "react";
import { IoTrashOutline } from "react-icons/io5";
import { TranslationKey, Mod, TranslationContext, Language } from "../contexts/TranslationContext";
import { Button } from "./Button";

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
      className={`w-full border-l-2 border-r-2 border-red-600 
      ${index != values.length - 1 && "border-b-2 "} 
      ${editingIndex == index && "border-x-slate-200 "}
      `}
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

const TranslationRow = (props: { tKey: TranslationKey; index: number; mod: Mod }) => {
  const { tKey: key, index, mod } = props;
  const { currentLanguage } = useContext(TranslationContext);

  const [values, setValues] = useState<string[]>(key.values);
  useEffect(() => {
    setValues(key.values);
  }, [currentLanguage]);

  const invalid = () => values.length > 1;
  const isChangedFromDefault = (currentValue: string | undefined) => {
    const defaultValue = mod.keys.get(mod.defaultLanguage)!.get(key.path + key.key)?.values[0];
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
        className={`flex items-center justify-center border-b-2 border-l-2 border-red-600 
        ${invalid() && "border-l-blue-600 "}
        ${changedFromDefault && "border-l-green-600 "}
        `}
      >
        <span className="p-1">{index}</span>
      </div>

      <div className="flex items-center border-b-2 border-b-red-600">
        <span className="text-sm text-slate-500">{key.path}:</span>
        <span>{key.key}</span>
      </div>

      <div className="flex flex-row border-b-2 border-red-600">
        <div className="grid w-full grid-flow-row grid-cols-[34px_1fr]">
          {values.map((v, i) => {
            return (
              // @ts-expect-error
              <React.Fragment key={v}>
                <div className="flex items-center">
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
        <div
          // @ts-expect-error
          key={i}
          className={`mb-1 mr-1 flex w-8 cursor-pointer select-none items-center justify-center border-2 border-red-600 bg-slate-900 px-2 py-1 text-slate-50 transition-colors hover:bg-slate-800
        ${page == i && "border-b-slate-200"}`}
          tabIndex={0}
          onClick={() => setPage(i)}
        >
          {i + 1}
        </div>
      ))}
    </div>
  );
};

export const NewTranslationTable = () => {
  const { currentMod, currentLanguage } = useContext(TranslationContext);
  const [page, setPage] = useState(0);

  const keysPerPage = 50;

  // TODO: when pairs per page change, set new page so first entry is same as before, or at least on the same page
  useEffect(() => {
    if (!currentMod) return;
    setPage((p) => Math.max(Math.min(p, Math.floor(currentMod.keys.get(currentLanguage)!.size / keysPerPage)), 0));
  }, [currentMod, page]);

  const copyNotTranslated = () => {
    if (!currentMod || currentLanguage == currentMod.defaultLanguage) return;
    if (!currentMod.keys.has(currentLanguage)) currentMod.keys.set(currentLanguage, new Map());

    const defaultKeys = currentMod.keys.get(currentMod.defaultLanguage);
    if (!defaultKeys) return;

    const currentKeys = currentMod.keys.get(currentLanguage)!;
    for (const [hash, key] of defaultKeys) {
      if (currentKeys.has(hash)) continue;

      const copy: TranslationKey = { key: key.key, path: key.path, values: [...key.values] };
      currentKeys.set(hash, copy);
    }
  };
  copyNotTranslated();

  useEffect(copyNotTranslated, [currentLanguage]);

  if (!currentMod) return <></>;
  return (
    <>
      <PaginationButtons
        page={page}
        setPage={setPage}
        buttonCount={Math.ceil(currentMod.keys.get(currentLanguage)!.size / keysPerPage)}
      />

      <div className="flex flex-col content-center items-center bg-slate-900 text-slate-50">
        <span>
          {currentMod.name} @ {Language[currentLanguage]}
        </span>
        <div className="grid w-[1200px] grid-flow-row grid-cols-[36px_3fr_4fr] border-t-2 border-red-600">
          {Array.from(currentMod.keys.get(currentLanguage)!)
            .slice(page * keysPerPage, (page + 1) * keysPerPage)
            .map((key, index) => (
              <TranslationRow
                // @ts-expect-error
                key={key[0] + currentLanguage}
                tKey={key[1]}
                index={index + page * keysPerPage + 1}
                mod={currentMod}
              />
            ))}
        </div>
      </div>

      <PaginationButtons
        page={page}
        setPage={setPage}
        buttonCount={Math.ceil(currentMod.keys.get(currentLanguage)!.size / keysPerPage)}
      />
    </>
  );
};
