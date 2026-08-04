/**
 * Copyright (c) 2026 Uworx UK. All rights reserved.
 */

import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

function Input({
  className = "",
  ...props
}: InputProps) {
  return (
    <input
      className={`w-full rounded-lg px-4 py-2 outline-none transition app-input ${className}`}
      {...props}
    />
  );
}

export default Input;