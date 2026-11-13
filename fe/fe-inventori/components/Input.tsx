"use client";

import { useState, type InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string };

function EyeIcon({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {open ? (
        <>
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
        </>
      ) : (
        <>
          <path d="M9.9 4.2A10.4 10.4 0 0 1 12 4c6.5 0 10 8 10 8a17.6 17.6 0 0 1-3.2 4.2" />
          <path d="M6.6 6.6C3.8 8.4 2 12 2 12s3.5 8 10 8a9.9 9.9 0 0 0 5.4-1.6" />
          <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
          <path d="m2 2 20 20" />
        </>
      )}
    </svg>
  );
}

export default function Input({ label, error, id, className = "", type, ...rest }: Props) {
  const inputId = id ?? rest.name ?? label;
  const isPassword = type === "password";
  const [visible, setVisible] = useState(false);

  const input = (
    <input
      id={inputId}
      type={isPassword && visible ? "text" : type}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? `${inputId}-error` : undefined}
      className={`h-12 w-full rounded-[14px] border bg-canvas px-3.5 text-[15px] outline-none focus:ring-2 focus:ring-accent ${
        isPassword ? "pr-12" : ""
      } ${error ? "border-danger-ink" : "border-line-strong"} ${className}`}
      {...rest}
    />
  );

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="text-sm font-medium text-ink">
        {label}
      </label>
      {isPassword ? (
        <div className="relative">
          {input}
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Sembunyikan password" : "Tampilkan password"}
            aria-pressed={visible}
            aria-controls={inputId}
            className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-[14px] text-ink/60 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <EyeIcon open={!visible} />
          </button>
        </div>
      ) : (
        input
      )}
      {error && (
        <p id={`${inputId}-error`} className="text-xs text-danger-ink">
          {error}
        </p>
      )}
    </div>
  );
}
