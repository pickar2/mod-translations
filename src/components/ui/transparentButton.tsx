"use client";
import * as React from "react";
import { cn } from "~/lib/utils";

const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, ...props }, ref) => {
    return (
      <button
        className={cn(
          "select-none p-1 text-2xl outline-none transition-colors hover:bg-slate-800 focus-visible:bg-slate-800",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
