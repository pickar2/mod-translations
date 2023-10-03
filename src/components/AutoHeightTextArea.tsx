import React, { createRef, useState, useEffect } from "react";
import { cn } from "~/lib/utils";
import { Waypoint } from "react-waypoint";

export const AutoHeightTextArea = (props: {
  index: number;
  values: string[];
  onTextChange: (value: string | undefined) => void;
  onFinishEditing: (value: string | undefined) => void;
  placeholder: string;
}) => {
  const { index, values, onFinishEditing, onTextChange, placeholder } = props;
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

  const updateWindowWidth = () => {
    updateHeight(textAreaRef.current);
  };

  useEffect(() => {
    window.addEventListener("resize", updateWindowWidth);
    return () => {
      window.removeEventListener("resize", updateWindowWidth);
    };
  }, [textAreaRef]);

  return (
    <Waypoint onEnter={() => updateHeight(textAreaRef.current)}>
      <div
        className={cn(
          "transition-border flex h-full w-full items-center border-x-[1px]  border-[hsl(var(--border))]",
          index != values.length - 1 && values.length > 0 && "border-b-[1px]",
          editingIndex == index && "border-x-slate-200"
        )}
      >
        <textarea
          ref={textAreaRef}
          className={`flex w-full resize-none items-center overflow-hidden bg-slate-900 p-2 outline-none transition-colors hover:bg-slate-800 focus:bg-slate-800 `}
          style={{ height: defaultHeight }}
          placeholder={placeholder}
          wrap="soft"
          defaultValue={values[index]}
          rows={1}
          spellCheck={false}
          onChange={(e) => {
            updateHeight(e.currentTarget);
            onTextChange(e.currentTarget.value);
          }}
          onFocus={(e) => {
            updateHeight(e.currentTarget);
            setEditingIndex(index);
          }}
          onBlur={(e) => {
            setEditingIndex(-1);
            onFinishEditing(e.currentTarget.value);
          }}
          onMouseEnter={(e) => {
            updateHeight(e.currentTarget);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") e.currentTarget.blur();
          }}
        />
      </div>
    </Waypoint>
  );
};
