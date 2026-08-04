/**
 * Copyright (c) UWorx Services 2026. All Rights Reserved. The information contained herein is proprietary and confidential. This proprietary and confidential information, either in whole or in part, shall not be used for any purpose unless permitted by the terms of a valid license agreement.
 */

import { Plus, Trash2 } from "lucide-react";
import { TextField, SelectField } from "../form/FormFields";
import type { Qualification } from "../../types/application";
import { emptyQualification } from "../../types/application";

interface QualificationsStepProps {
  value: Qualification[];
  onChange: (value: Qualification[]) => void;
}

const qualificationOptions = [
  { value: "matric", label: "Matric" },
  { value: "intermediate", label: "Intermediate" },
  { value: "bachelors", label: "Bachelor's" },
  { value: "masters", label: "Master's" },
  { value: "phd", label: "PhD" },
];

const currentYear = new Date().getFullYear();
const graduationYearOptions = Array.from({ length: 15 }, (_, i) => {
  const year = String(currentYear - i);
  return { value: year, label: year };
});

export function QualificationsStep({ value, onChange }: QualificationsStepProps) {
  const update = (id: string, field: keyof Qualification, val: string) => {
    onChange(value.map((q) => (q.id === id ? { ...q, [field]: val } : q)));
  };

  const remove = (id: string) => {
    onChange(value.filter((q) => q.id !== id));
  };

  const addMore = () => {
    onChange([...value, emptyQualification()]);
  };

  return (
    <div className="space-y-5">
      <h2
        className="text-xl font-bold text-ink-900"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Qualifications
      </h2>

      {value.map((q, i) => (
        <div key={q.id} className="rounded-xl border border-ink-100 bg-ink-50/50 p-5">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-ink-700">
              Qualification #{i + 1}
            </span>
            {value.length > 1 && (
              <button
                onClick={() => remove(q.id)}
                className="text-ink-400 transition hover:text-accent-600"
                aria-label="Remove qualification"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Qualification"
              required
              options={qualificationOptions}
              value={q.qualification}
              onChange={(e) => update(q.id, "qualification", e.target.value)}
            />
            <TextField
              label="Subject"
              required
              value={q.subject}
              onChange={(e) => update(q.id, "subject", e.target.value)}
            />
            <TextField
              label="Institute"
              required
              value={q.institute}
              onChange={(e) => update(q.id, "institute", e.target.value)}
            />
            <TextField
              label="Grade / GPA / Division"
              required
              value={q.grade}
              onChange={(e) => update(q.id, "grade", e.target.value)}
            />
            <SelectField
              label="Graduation Year"
              required
              options={graduationYearOptions}
              value={q.graduationYear}
              onChange={(e) => update(q.id, "graduationYear", e.target.value)}
            />
          </div>
        </div>
      ))}

      <button
        onClick={addMore}
        className="flex items-center gap-1.5 rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium text-ink-700 transition hover:border-primary-600 hover:text-primary-800"
      >
        <Plus size={16} />
        Add More
      </button>
    </div>
  );
}
