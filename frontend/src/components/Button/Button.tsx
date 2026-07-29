import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

function Button({
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`rounded-lg px-4 py-2 font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-50 app-btn ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;