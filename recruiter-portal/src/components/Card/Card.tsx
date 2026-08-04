/**
 * Copyright (c) UWorx Services 2026. All Rights Reserved. The information contained herein is proprietary and confidential. This proprietary and confidential information, either in whole or in part, shall not be used for any purpose unless permitted by the terms of a valid license agreement.
 */

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