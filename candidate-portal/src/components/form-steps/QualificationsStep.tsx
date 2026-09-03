/**
 * Copyright (c) UWorx Services 2026. All Rights Reserved. The information contained herein is proprietary and confidential. This proprietary and confidential information, either in whole or in part, shall not be used for any purpose unless permitted by the terms of a valid license agreement.
 */

import { Plus, Trash2, Search, ChevronDown } from "lucide-react";
import { useState } from "react";
// import { Plus, Trash2 } from "lucide-react";
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

// const currentYear = new Date().getFullYear();
// // const graduationYearOptions = Array.from({ length: 15 }, (_, i) => {
// //   const year = String(currentYear - i);
// //   return { value: year, label: year };
// // });
// const graduationYearOptions = [
//   { value: "", label: "Select" },
//   ...Array.from({ length: 86 }, (_, i) => {
//     const year = currentYear + 10 - i;
//     return {
//       value: String(year),
//       label: String(year),
//     };
//   }),
// ];
function GraduationYearDropdown({
  value,
  onChange,
}: {
  value: string;
  onChange: (year: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const currentYear = new Date().getFullYear();

  // Allow older years and a few future years.
  const years = Array.from({ length: 17 }, (_, i) => {
    return currentYear + 5 - i;
  });

  const filteredYears = years.filter((year) =>
  String(year).includes(search)
);

const searchedYear =
  search.length === 4 && /^\d{4}$/.test(search)
    ? Number(search)
    : null;

const shouldShowSearchedYear =
  searchedYear !== null && !years.includes(searchedYear);
  
  const handleSelect = (year: number) => {
    onChange(String(year));
    setIsOpen(false);
    setSearch("");
  };

  return (
    <div className="relative">
      <label className="mb-1.5 block text-sm font-medium text-ink-700">
        Graduation Year <span className="text-accent-600">*</span>
      </label>

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-lg border border-ink-200 bg-white px-3 py-2.5 text-left text-sm transition focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-100"
      >
        <span className={value ? "text-ink-900" : "text-ink-400"}>
          {value || "Select graduation year"}
        </span>

        <ChevronDown
          size={18}
          className={`text-ink-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-ink-200 bg-white shadow-lg">
          {/* Search */}
          <div className="border-b border-ink-100 p-2">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
              />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search year..."
                autoFocus
                className="w-full rounded-md border border-ink-200 py-2 pl-9 pr-3 text-sm text-ink-900 outline-none focus:border-primary-600"
              />
            </div>
          </div>

          {/* Years */}
          <div className="max-h-60 overflow-y-auto">
  {shouldShowSearchedYear && searchedYear !== null ? (
    <button
      type="button"
      onClick={() => handleSelect(searchedYear)}
      className="block w-full px-4 py-2 text-left text-sm text-ink-700 transition hover:bg-primary-50 hover:text-primary-800"
    >
      {searchedYear}
    </button>
  ) : filteredYears.length > 0 ? (
    filteredYears.map((year) => (
      <button
        key={year}
        type="button"
        onClick={() => handleSelect(year)}
        className={`block w-full px-4 py-2 text-left text-sm transition hover:bg-primary-50 hover:text-primary-800 ${
          value === String(year)
            ? "bg-primary-50 font-semibold text-primary-800"
            : "text-ink-700"
        }`}
      >
        {year}
      </button>
    ))
  ) : (
    <p className="px-4 py-3 text-sm text-ink-400">
      No year found
    </p>
  )}
</div>
        </div>
      )}
    </div>
  );
}

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
            <GraduationYearDropdown
  value={q.graduationYear}
  onChange={(year) => update(q.id, "graduationYear", year)}
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
