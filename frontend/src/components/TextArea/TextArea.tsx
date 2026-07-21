import type { TextareaHTMLAttributes } from "react";

type TextAreaProps =
  TextareaHTMLAttributes<HTMLTextAreaElement>;

function TextArea({
  className = "",
  ...props
}: TextAreaProps) {
  return (
    <textarea
      className={`w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white ${className}`}
      {...props}
    />
  );
}

export default TextArea;