/**
 * Copyright (c) UWorx Services 2026. All Rights Reserved. The information contained herein is proprietary and confidential. This proprietary and confidential information, either in whole or in part, shall not be used for any purpose unless permitted by the terms of a valid license agreement.
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