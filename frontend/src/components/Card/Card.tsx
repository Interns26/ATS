import type { ReactNode } from "react";

type CardProps = {
  title?: string;
  children: ReactNode;
};

function Card({ title, children }: CardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-colors duration-300 dark:border-slate-700 dark:bg-slate-800">
      {title && (
        <h2 className="mb-4 text-xl font-semibold dark:text-white">
          {title}
        </h2>
      )}

      {children}
    </div>
  );
}

export default Card;