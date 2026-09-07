"use client";

import type { ComponentProps } from "react";

export function ConfirmSubmitButton({
  confirmMessage,
  className,
  children,
  ...props
}: ComponentProps<"button"> & { confirmMessage: string }) {
  return (
    <button
      {...props}
      className={className}
      onClick={(e) => {
        if (!window.confirm(confirmMessage)) {
          e.preventDefault();
        }
      }}
    >
      {children}
    </button>
  );
}
