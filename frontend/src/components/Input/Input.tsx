import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

function Input({
  className = "",
  ...props
}: InputProps) {
  return (
    <input
      className={`w-full rounded-lg border border-slate-300 bg-white px-4 py-2 outline-none transition focus:border-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white ${className}`}
      {...props}
    />
  );
}

export default Input;