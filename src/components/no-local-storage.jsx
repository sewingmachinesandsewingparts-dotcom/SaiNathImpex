"use client";

import { useEffect } from "react";

export function NoLocalStorage() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      window.localStorage.clear();
    } catch {
      // Ignore browser privacy restrictions.
    }

    const deny = () => undefined;
    const methods = ["getItem", "setItem", "removeItem", "clear"];

    const blockStorage = (target) => {
      methods.forEach((method) => {
        try {
          Object.defineProperty(target, method, {
            configurable: true,
            writable: true,
            value: deny,
          });
        } catch {
          // Ignore browser privacy restrictions.
        }
      });
    };

    blockStorage(window.localStorage);

    try {
      blockStorage(Object.getPrototypeOf(window.localStorage));
    } catch {
      // Ignore browser privacy restrictions.
    }
  }, []);

  return null;
}
