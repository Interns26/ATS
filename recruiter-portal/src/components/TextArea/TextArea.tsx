/**
 * Copyright (c) 2026 Uworx UK. All rights reserved.
 */

import type { TextareaHTMLAttributes } from "react";

type TextAreaProps =
  TextareaHTMLAttributes<HTMLTextAreaElement>;

function TextArea({
  className = "",
  ...props
}: TextAreaProps) {
  return (
    <textarea
      className={`w-full rounded-lg px-4 py-3 outline-none transition app-textarea ${className}`}
      {...props}
    />
  );
}

export default TextArea;