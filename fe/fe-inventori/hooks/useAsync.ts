"use client";

import { useEffect, useReducer, useState } from "react";
import { normalizeError, type AppError } from "@/lib/errors";

export type AsyncState<T> =
  | { status: "loading" }
  | { status: "error"; error: AppError }
  | { status: "ready"; data: T };

type Action<T> = { type: "start" } | { type: "ok"; data: T } | { type: "fail"; error: AppError };

function reducer<T>(_: AsyncState<T>, a: Action<T>): AsyncState<T> {
  if (a.type === "start") return { status: "loading" };
  if (a.type === "ok") return { status: "ready", data: a.data };
  return { status: "error", error: a.error };
}

export function useAsync<T>(fn: () => Promise<T>, key: string) {
  const [state, dispatch] = useReducer(reducer<T>, { status: "loading" });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    dispatch({ type: "start" });
    fn()
      .then((data) => alive && dispatch({ type: "ok", data }))
      .catch((e) => alive && dispatch({ type: "fail", error: normalizeError(e) }));
    return () => {
      alive = false;
    };
    // fn is recreated each render; key identifies its inputs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, tick]);

  return { state, retry: () => setTick((t) => t + 1) };
}
