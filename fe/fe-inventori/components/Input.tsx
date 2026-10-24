import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string };

export default function Input({ label, error, id, className = "", ...rest }: Props) {
  const inputId = id ?? rest.name ?? label;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={`h-12 rounded-[14px] border bg-canvas px-3.5 text-[15px] outline-none focus:ring-2 focus:ring-accent ${
          error ? "border-danger-ink" : "border-line-strong"
        } ${className}`}
        {...rest}
      />
      {error && (
        <p id={`${inputId}-error`} className="text-xs text-danger-ink">
          {error}
        </p>
      )}
    </div>
  );
}
