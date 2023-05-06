/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { useState } from "react";

function stringifyReplacer(key: string, value: any): any {
  if (typeof value === "object" && value !== null) {
    if (value instanceof Map) {
      return {
        _meta: { type: "map" },
        value: Array.from(value.entries()),
      };
    } else if (value instanceof Set) {
      // bonus feature!
      return {
        _meta: { type: "set" },
        value: Array.from(value.values()),
      };
    } else if ("_meta" in value) {
      // Escape "_meta" properties
      return {
        ...value,
        _meta: {
          type: "escaped-meta",
          value: value["_meta"],
        },
      };
    }
  }

  return value;
}

function parseReviver(key: string, value: any): any {
  if (typeof value === "object" && value !== null) {
    if ("_meta" in value) {
      if (value._meta.type === "map") {
        return new Map(value.value);
      } else if (value._meta.type === "set") {
        return new Set(value.value);
      } else if (value._meta.type === "escaped-meta") {
        // Un-escape the "_meta" property
        return {
          ...value,
          _meta: value._meta.value,
        };
      } else {
        console.warn("Unexpected meta", value._meta);
      }
    }
  }

  return value;
}

// from https://usehooks.com/useLocalStorage/
export function useLocalStorage<T>(key: string, initialValue: T) {
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }

    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key);
      // Parse stored json or if none return initialValue
      return item ? (JSON.parse(item, parseReviver) as T) : initialValue;
    } catch (error) {
      // If error also return initialValue
      console.log("Error in setting default value in useLocalStorage", error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that ...
  // ... persists the new value to localStorage.
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      // Save state
      setStoredValue(valueToStore);
      // Save to local storage
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore, stringifyReplacer));
      }
    } catch (error) {
      // A more advanced implementation would handle the error case
      console.log("Error in setting value in useLocalStorage", error);
    }
  };

  return [storedValue, setValue] as const;
}
