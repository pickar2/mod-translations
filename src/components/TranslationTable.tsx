import React, {
  useContext,
  type Dispatch,
  type SetStateAction,
  createRef,
  useState,
  useEffect,
  type HTMLAttributes,
} from "react";
import { type Mod, TranslationContext, Language } from "../contexts/TranslationContext";
import { X, Trash2, BookTemplate, Book } from "lucide-react";
import { cn } from "~/lib/utils";
import { useLocalStorage } from "~/lib/useLocalStorage";
import NoSsr from "./NoSsr";
import { type TranslationRecord, dexieDb, getTranslationUnique } from "~/lib/dexieDb";
import { ButtonWithTooltip } from "./ui/buttonWithTooltip";

const AutoHeightTextArea = (props: {
  index: number;
  values: string[];
  onTextChange: (value: string | undefined) => void;
  onFinishEditing: (value: string | undefined) => void;
  className?: string | undefined;
}) => {
  const { index, values, onFinishEditing, onTextChange, className } = props;
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
        "transition-border flex h-full w-full items-center border-x-[1px] border-[hsl(var(--border))]",
        index != values.length - 1 && "border-b-[1px]",
        editingIndex == index && "border-x-slate-200"
      )}
    >
      <textarea
        ref={textAreaRef}
        className={cn(
          "flex w-full resize-none items-center overflow-hidden bg-slate-950 p-2 outline-none transition-colors hover:bg-slate-800 focus:bg-slate-800",
          className
        )}
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

const PaginationButtons = (props: { page: number; setPage: Dispatch<SetStateAction<number>>; buttonCount: number }) => {
  const { page, setPage, buttonCount } = props;
  return (
    <div className="flex flex-row flex-wrap ">
      {[...(Array(buttonCount) as void[])].map((_, i) => (
        <button
          key={i}
          className={cn(
            `mb-1 mr-1 flex w-8 cursor-pointer select-none items-center justify-center border-[1px] border-[hsl(var(--border))] bg-slate-950
             px-2 py-1 font-mono text-slate-50 outline-none transition-colors hover:bg-slate-800 focus-visible:bg-slate-800`,
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

const Overlay = (props: HTMLAttributes<HTMLDivElement>) => {
  const { className, ...other } = props;
  return (
    <div
      className={cn(
        "pointer-events-none absolute z-[5] h-full w-full bg-red-800 opacity-0 transition-opacity",
        className
      )}
      {...other}
    />
  );
};

const TranslationRow = (props: {
  record: TranslationRecord;
  index: number;
  mod: Mod;
  language: Language;
  onRecordRemove: { (): void };
}) => {
  const { record, index, mod, language, onRecordRemove } = props;
  const [showingOriginal, setShowingOriginal] = useState(false);
  const [originalText, setOriginalText] = useState<string | undefined>();
  const [selectingRecord, setSelectingRecord] = useState(false);
  const [selectingValue, setSelectingValue] = useState(-1);
  const [differentFromOriginal, setDifferentFromOriginal] = useState(false);

  function updateValue(index: number, text: string) {
    record.values[index] = text ?? "";
    void dexieDb.translations.update(record, { values: record.values });
  }

  function removeValue(index: number) {
    record.values.splice(index, 1);
    void dexieDb.translations.update(record, { values: record.values });
  }

  function checkDifference() {
    if (language == mod.defaultLanguage) return setDifferentFromOriginal(false);
    if (typeof originalText === "undefined" || record.values.length !== 1) return setDifferentFromOriginal(false);

    setDifferentFromOriginal(originalText !== record.values[0]);
  }

  useEffect(checkDifference, [originalText]);

  async function retrieveOriginalText() {
    if (language == mod.defaultLanguage) return;

    const originalRecord = await getTranslationUnique(
      record.key,
      record.defName,
      record.defType,
      record.modId,
      mod.defaultLanguage
    );
    setOriginalText(originalRecord?.values[0]);
  }
  if (typeof originalText === "undefined") void retrieveOriginalText();

  return (
    <>
      <tr
        className={cn(
          "relative border-b-[1px] border-l-[1px] border-[hsl(var(--border))]",
          record.values.length > 1 && "border-l-blue-600",
          differentFromOriginal && "border-l-green-600"
        )}
      >
        <td className="pointer-events-none absolute left-0 top-0 m-0 h-full w-full p-0">
          <Overlay className={cn(selectingRecord && "opacity-[0.15]")} />
        </td>

        <td className="w-12 pl-1 text-center font-mono">{index}</td>

        <td className="w-[40%]">
          <span className="text-sm text-slate-500">{record.defType}</span>
          <span className="text-sm text-slate-500">:</span>
          <span>
            {record.defName}
            {record.key}
          </span>
        </td>

        <td className="relative m-0 p-0">
          {language != mod.defaultLanguage && (
            <div className="absolute left-[-34px] top-1 p-0">
              <ButtonWithTooltip
                buttonProps={{
                  variant: "transparent",
                  size: "none",
                  onClick: () => setShowingOriginal((prev) => !prev),
                }}
                buttonContent={showingOriginal ? <Book /> : <BookTemplate />}
                tooltipContent={<span>{showingOriginal ? "Show translation" : "Show original"}</span>}
              />
            </div>
          )}
          <div className="absolute left-[1px] top-1">
            <ButtonWithTooltip
              buttonProps={{
                variant: "transparent",
                size: "none",
                onClick: onRecordRemove,
                onMouseEnter: () => setSelectingRecord(true),
                onFocus: () => setSelectingRecord(true),
                onMouseLeave: () => setSelectingRecord(false),
                onBlur: () => setSelectingRecord(false),
              }}
              buttonContent={<X />}
              tooltipContent={<span>Remove record</span>}
            />
          </div>
          <div className="">
            {showingOriginal ? (
              <div className="ml-[36px] border-x-[1px] border-[hsl(var(--border))] p-2">
                {originalText || "No data"}
              </div>
            ) : (
              <>
                {record.values.length == 1 && (
                  <div className="pl-[36px]">
                    <AutoHeightTextArea
                      index={0}
                      values={record.values}
                      onFinishEditing={(s) => updateValue(0, s || "")}
                      onTextChange={checkDifference}
                    />
                  </div>
                )}
                {record.values.length > 1 && (
                  <table className="w-full">
                    <tbody>
                      {record.values.map((_, i) => {
                        return (
                          <tr key={i} className="flex h-full w-full">
                            <td className="mr-1 flex w-8">
                              <div className="mb-[1px] mt-auto p-0">
                                <ButtonWithTooltip
                                  buttonProps={{
                                    variant: "transparent",
                                    size: "none",
                                    onClick: () => removeValue(i),
                                    onMouseEnter: () => setSelectingValue(i),
                                    onFocus: () => setSelectingValue(i),
                                    onMouseLeave: () => setSelectingValue(-1),
                                    onBlur: () => setSelectingValue(-1),
                                  }}
                                  buttonContent={<Trash2 />}
                                  tooltipContent={<span>Remove translation</span>}
                                />
                              </div>
                            </td>
                            <td className="relative h-full w-full p-0">
                              <Overlay className={cn(selectingValue == i && "opacity-[0.15]")} />
                              <div className={cn("h-full items-center", i == 0 && "min-h-[65px]")}>
                                <AutoHeightTextArea
                                  index={i}
                                  values={record.values}
                                  onFinishEditing={(s) => updateValue(0, s || "")}
                                  onTextChange={checkDifference}
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </>
            )}
          </div>
        </td>
      </tr>
    </>
  );
};

const TranslationTableControls = (props: { mod: Mod; language: Language; records: TranslationRecord[] }) => {
  const { updateOnTrigger, triggerUpdate } = useContext(TranslationContext);
  const { mod, language, records } = props;
  const [page, setPage] = useLocalStorage<number>("currentPage", 0);

  const [recordsState, setRecordsState] = useState(records);

  const keysPerPage = 25;
  const from = page * keysPerPage;
  const to = (page + 1) * keysPerPage;

  useEffect(() => {
    setPage((p) => Math.max(Math.min(p, Math.floor((recordsState.length - 1) / keysPerPage)), 0));
  }, [mod, language, page, recordsState, setPage]);

  return (
    <>
      <PaginationButtons page={page} setPage={setPage} buttonCount={Math.ceil(recordsState.length / keysPerPage)} />

      <div className="flex flex-col content-center items-center bg-slate-950 text-slate-300">
        <span>
          {mod.name} @ {Language[language]}
        </span>
        <table className="w-[80vw] border-t-[1px] border-[hsl(var(--border))]">
          <tbody>
            {recordsState.slice(from, to).map((record, index) => (
              <TranslationRow
                key={`${record.id || -1}`}
                record={record}
                index={index + from + 1}
                mod={mod}
                language={language}
                onRecordRemove={() => {
                  if (typeof record.id !== "undefined") void dexieDb.translations.delete(record.id);
                  setRecordsState((r) => {
                    r.splice(index + from, 1);
                    return r;
                  });
                  triggerUpdate();
                }}
              />
            ))}
          </tbody>
        </table>
      </div>

      <PaginationButtons page={page} setPage={setPage} buttonCount={Math.ceil(recordsState.length / keysPerPage)} />
    </>
  );
};

export const TranslationTable = () => {
  const { currentMod, currentLanguage } = useContext(TranslationContext);

  const [dataState, setDataState] = useState<TranslationRecord[] | undefined>(undefined);

  useEffect(() => {
    if (!currentMod) return;
    setDataState(undefined);
    void (async () =>
      setDataState(await dexieDb.translations.where({ modId: currentMod.id, language: currentLanguage }).toArray()))();
  }, [currentLanguage, currentMod]);

  if (!dataState) return <>Loading...</>;
  if (dataState.length == 0 || !currentMod) return <>No data</>;

  return (
    <NoSsr>
      <TranslationTableControls records={dataState} mod={currentMod} language={currentLanguage} />
    </NoSsr>
  );
};
