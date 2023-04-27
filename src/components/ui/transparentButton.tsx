"use client";
import * as React from "react";

export const Button = (props: { onClick: React.MouseEventHandler<HTMLButtonElement>; children: React.ReactNode }) => {
  const { onClick, children } = props;
  return (
    <button
      className="cursor-pointer select-none p-1 text-2xl outline-none transition-colors hover:bg-slate-800 focus:bg-slate-800"
      onClick={onClick}
    >
      {children}
    </button>
  );
};
