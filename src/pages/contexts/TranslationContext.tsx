import { createContext, Dispatch, SetStateAction } from "react";
import { TranslationPair } from "../components/TranslationTable";

export const TranslationContext = createContext<{
  translationPairs: TranslationPair[];
  setTranslationPairs: Dispatch<SetStateAction<TranslationPair[]>>;
  discardedPairs: TranslationPair[];
  setDiscardedPairs: Dispatch<SetStateAction<TranslationPair[]>>;
}>(null!);
