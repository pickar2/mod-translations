import { Button, type ButtonProps } from "./button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";
import { type ReactNode } from "react";

export const ButtonWithTooltip = (props: {
  buttonProps?: ButtonProps & React.ButtonHTMLAttributes<HTMLButtonElement>;
  buttonContent?: ReactNode;
  tooltipContent?: ReactNode;
}) => {
  return (
    <TooltipProvider delayDuration={400}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button {...props.buttonProps}>{props.buttonContent}</Button>
        </TooltipTrigger>
        <TooltipContent>{props.tooltipContent}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
