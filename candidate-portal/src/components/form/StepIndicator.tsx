/**
 * Copyright (c) UWorx Services 2026. All Rights Reserved. The information contained herein is proprietary and confidential. This proprietary and confidential information, either in whole or in part, shall not be used for any purpose unless permitted by the terms of a valid license agreement.
 */

import { Check } from "lucide-react";

export interface Step {
  key: string;
  label: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentIndex: number;
}

export function StepIndicator({ steps, currentIndex }: StepIndicatorProps) {
  return (
    <div className="flex flex-col">
      {steps.map((step, i) => {
        const isComplete = i < currentIndex;
        const isCurrent = i === currentIndex;
        const isLast = i === steps.length - 1;

        return (
          <div key={step.key} className="flex items-stretch">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition ${
                  isComplete
                    ? "bg-primary-100 text-primary-700"
                    : isCurrent
                    ? "bg-primary-800 text-white"
                    : "bg-ink-100 text-ink-500"
                }`}
              >
                {isComplete ? <Check size={16} /> : i + 1}
              </div>
              {!isLast && (
                <div
                  className={`w-0.5 flex-1 ${
                    isComplete ? "bg-primary-300" : "bg-ink-100"
                  }`}
                  style={{ minHeight: "24px" }}
                />
              )}
            </div>
            <span
              className={`ml-3 pb-6 pt-1 text-sm font-medium ${
                isCurrent ? "text-primary-900" : isComplete ? "text-ink-700" : "text-ink-400"
              }`}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
