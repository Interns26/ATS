import type { ReactNode } from "react";

type CardProps = {
  title?: string;
  children: ReactNode;
};

function Card({ title, children }: CardProps) {
  return (
    <div className={`rounded-xl p-6 transition-colors duration-300 app-card ${title ? "" : ""}`}>
      {title && (
        <h2 className="mb-4 text-xl font-semibold">
          {title}
        </h2>
      )}

      {children}
    </div>
  );
}

export default Card;