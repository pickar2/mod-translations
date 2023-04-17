import { useContext } from "react";
import { keysOfEnum } from "~/utils/enumUtils";
import { TranslationContext, Language } from "../contexts/TranslationContext";
import { Button } from "./Button";

export const Header = () => {
  const { setCurrentLanguage } = useContext(TranslationContext);
  return (
    <header className="fixed top-0 flex w-full flex-row border-b-4 border-red-600 bg-slate-300 p-3">
      {keysOfEnum(Language).map((lang) => {
        return (
          <Button
            // @ts-expect-error
            key={lang}
            onClick={() => {
              setCurrentLanguage((prev) => Language[lang]);
            }}
          >
            [ {lang} ]
          </Button>
        );
      })}
    </header>
  );
};
