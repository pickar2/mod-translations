import React, { useContext, Dispatch, SetStateAction, createRef, useState, useEffect } from "react";
import { TranslationContext } from "../contexts/TranslationContext";
import { GoEye } from "react-icons/go";

export type TranslationPair = { key: string; value: string };

export const KeyValueTranslations = () => {
  const { translationPairs, setTranslationPairs, discardedPairs, setDiscardedPairs } = useContext(TranslationContext);
  const [page, setPage] = useState(0);
  const pairsPerPage = 50;

  const movePair = (
    index: number,
    arrayFrom: TranslationPair[],
    arrayTo: TranslationPair[],
    setterFrom: Dispatch<SetStateAction<TranslationPair[]>>,
    setterTo: Dispatch<SetStateAction<TranslationPair[]>>
  ) => {
    const removedPair = arrayFrom[index];
    if (!removedPair) return;

    setterFrom(arrayFrom.filter((e, i) => i != index));
    setterTo([...arrayTo, removedPair]);
  };

  // TODO: when pairs per page change, set new page so first entry is same as before, or at least on the same page
  useEffect(() => {
    setPage((p) => Math.max(Math.min(p, Math.floor(translationPairs.length / pairsPerPage)), 0));
  }, [translationPairs, page]);

  return (
    <>
      <div className="flex flex-row flex-wrap">
        {[...Array(Math.ceil(translationPairs.length / pairsPerPage))].map((x, i) => (
          <div
            className={`mb-1 mr-1 flex cursor-pointer select-none items-center justify-center border-2 border-red-600 bg-slate-900 px-2 py-1 text-slate-50 transition-colors hover:bg-slate-800
            ${page == i && "border-b-slate-200"}`}
            onClick={() => setPage(i)}
          >
            {i + 1}
          </div>
        ))}
      </div>

      <div className="grid w-[1200px] grid-flow-row grid-cols-[40px_1fr_1fr] border-l-2 border-t-2 border-red-600">
        {translationPairs.slice(page * pairsPerPage, (page + 1) * pairsPerPage).map((pair, index) => (
          <React.Fragment key={pair.key}>
            <div
              className={`flex cursor-pointer select-none items-center justify-center border-b-2 border-r-2 border-red-600 bg-slate-900 text-slate-50 transition-colors hover:bg-slate-800`}
              onClick={() => movePair(index, translationPairs, discardedPairs, setTranslationPairs, setDiscardedPairs)}
            >
              [-]
            </div>
            <KeyValuePair pair={pair} disabled={false} />
          </React.Fragment>
        ))}
      </div>

      <div className="grid w-[1200px] grid-flow-row grid-cols-[40px_1fr_1fr] border-l-2 border-t-2 border-red-600">
        {discardedPairs.map((pair, index) => (
          <React.Fragment key={pair.key}>
            <div
              className={`flex cursor-pointer select-none items-center justify-center border-b-2 border-r-2 border-red-600 bg-slate-900 text-slate-50 transition-colors hover:bg-slate-800`}
              onClick={() => movePair(index, discardedPairs, translationPairs, setDiscardedPairs, setTranslationPairs)}
            >
              [+]
            </div>
            <KeyValuePair pair={pair} disabled={true} />
          </React.Fragment>
        ))}
      </div>
    </>
  );
};

export const KeyValuePair = (props: { pair: TranslationPair; disabled: boolean }) => {
  const { key, value } = props.pair;
  const defaultHeight = "40px";
  const textAreaRef = createRef<HTMLTextAreaElement>();
  const [editing, setEditing] = useState(false);

  function updateHeight(element: HTMLTextAreaElement | null) {
    if (!element) return;

    element.style.height = defaultHeight;
    const newHeight = element.scrollHeight + "px";
    element.style.height = newHeight;
  }

  useEffect(() => updateHeight(textAreaRef.current), []);

  return (
    <>
      <div className="flex w-full items-center border-b-2 border-red-600 bg-slate-900 p-2 text-slate-50">
        <span>{key}</span>
        <div className="float-right flex w-full justify-end text-2xl">
          <div className="cursor-pointer rounded-sm bg-slate-800 px-1 opacity-50 transition-opacity hover:bg-red-700 hover:opacity-100">
            <GoEye />
          </div>
        </div>
      </div>
      <div
        className={`flex w-full items-center border-x-2 border-b-2 border-y-red-600 bg-slate-900 text-slate-50 ${
          editing ? "border-x-slate-200" : "border-x-red-600"
        }`}
      >
        <textarea
          ref={textAreaRef}
          className={`flex w-full resize-none items-center overflow-hidden bg-slate-900 p-2 outline-none transition-colors ${
            !props.disabled ? "hover:bg-slate-800" : ""
          } focus:bg-slate-800 `}
          style={{ height: defaultHeight }}
          placeholder="Translation"
          wrap="soft"
          defaultValue={value}
          rows={1}
          spellCheck={false}
          disabled={props.disabled}
          onChange={(e) => updateHeight(e.currentTarget)}
          onFocus={() => setEditing(true)}
          onBlur={() => setEditing(false)}
        />
      </div>
    </>
  );
};
