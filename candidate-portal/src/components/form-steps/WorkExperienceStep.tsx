/**
 * Copyright (c) UWorx Services 2026. All Rights Reserved. The information contained herein is proprietary and confidential. This proprietary and confidential information, either in whole or in part, shall not be used for any purpose unless permitted by the terms of a valid license agreement.
 */

import { Plus, Trash2 } from "lucide-react";
import { TextField, SelectField, TextAreaField } from "../form/FormFields";
import type { WorkExperience } from "../../types/application";
import { emptyWorkExperience } from "../../types/application";

interface WorkExperienceStepProps {
  value: WorkExperience[];
  onChange: (value: WorkExperience[]) => void;
}

const jobFieldOptions = [
  { value: "engineering", label: "Engineering" },
  { value: "product", label: "Product" },
  { value: "design", label: "Design" },
  { value: "hr", label: "Human Resources" },
  { value: "sales", label: "Sales" },
  { value: "other", label: "Other" },
];

export function WorkExperienceStep({ value, onChange }: WorkExperienceStepProps) {
  const update = <K extends keyof WorkExperience>(
    id: string,
    field: K,
    val: WorkExperience[K]
  ) => {
    onChange(value.map((w) => (w.id === id ? { ...w, [field]: val } : w)));
  };

  const remove = (id: string) => {
    onChange(value.filter((w) => w.id !== id));
  };

  const addMore = () => {
    onChange([...value, emptyWorkExperience()]);
  };

  return (
    <div className="space-y-5">
      <h2
        className="text-xl font-bold text-ink-900"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Work Experience
      </h2>

      {value.length === 0 && (
        <p className="rounded-lg border border-dashed border-ink-200 p-6 text-center text-sm text-ink-500">
          No work experience added yet — that's okay if this is your first role.
        </p>
      )}

      {value.map((w, i) => (
        <div key={w.id} className="rounded-xl border border-ink-100 bg-ink-50/50 p-5">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-ink-700">
              Work Experience #{i + 1}
            </span>
            <button
              onClick={() => remove(w.id)}
              className="text-ink-400 transition hover:text-accent-600"
              aria-label="Remove work experience"
            >
              <Trash2 size={16} />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Job Field"
              required
              options={jobFieldOptions}
              value={w.jobField}
              onChange={(e) => update(w.id, "jobField", e.target.value)}
            />
            <TextField
              label="Organization / Company"
              required
              value={w.organization}
              onChange={(e) => update(w.id, "organization", e.target.value)}
            />
            <TextField
              label="Job Title"
              required
              value={w.jobTitle}
              onChange={(e) => update(w.id, "jobTitle", e.target.value)}
            />
            <TextField
              label="Start Date"
              type="date"
              value={w.startDate}
              onChange={(e) => update(w.id, "startDate", e.target.value)}
            />

            <div className="flex items-center gap-3 sm:col-span-2">
              <button
                type="button"
                onClick={() => update(w.id, "currentlyWorking", !w.currentlyWorking)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                  w.currentlyWorking ? "bg-primary-700" : "bg-ink-200"
                }`}
                aria-pressed={w.currentlyWorking}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                    w.currentlyWorking ? "left-5" : "left-0.5"
                  }`}
                />
              </button>
              <span className="text-sm font-medium text-ink-700">
                Currently Working
              </span>
            </div>

            {!w.currentlyWorking && (
              <TextField
                label="End Date"
                required
                type="date"
                value={w.endDate}
                onChange={(e) => update(w.id, "endDate", e.target.value)}
              />
            )}

            <TextField
              label="Starting Salary"
              type="number"
              value={w.startingSalary}
              onChange={(e) => update(w.id, "startingSalary", e.target.value)}
            />
            <TextField
              label="Ending Salary"
              type="number"
              value={w.endingSalary}
              onChange={(e) => update(w.id, "endingSalary", e.target.value)}
            />

            <div className="sm:col-span-2">
              <TextAreaField
                label="Job Description"
                value={w.jobDescription}
                onChange={(e) => update(w.id, "jobDescription", e.target.value)}
              />
            </div>
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
