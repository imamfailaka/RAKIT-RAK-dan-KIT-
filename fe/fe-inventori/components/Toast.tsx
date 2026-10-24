"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import type { Notify, NotifyKind } from "@/lib/handle-error";

type Item = { id: number; message: string; kind: NotifyKind };

const ToastContext = createContext<Notify>(() => {});

export const useToast = () => useContext(ToastContext);

const colors: Record<NotifyKind, string> = {
  success: "border-ok-ink/40 bg-ok-bg text-ok-ink",
  error: "border-danger-ink/40 bg-danger-bg text-danger-ink",
  info: "border-line-strong bg-surface-alt text-ink",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>([]);

  const notify = useCallback<Notify>((message, kind) => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { id, message, kind }]);
    setTimeout(() => setItems((prev) => prev.filter((i) => i.id !== id)), 4000);
  }, []);

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div aria-live="polite" className="fixed right-4 top-4 z-50 flex flex-col gap-2">
        {items.map((i) => (
          <div key={i.id} className={`rounded-[14px] px-4 py-2 text-sm font-medium border ${colors[i.kind]}`}>
            {i.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
