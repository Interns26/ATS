/**
 * Copyright (c) 2026 Uworx UK. All rights reserved.
 */

import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

const baseFieldClass =
  "w-full rounded-lg border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 outline-none transition placeholder:text-ink-400 focus:border-primary-600 focus:ring-2 focus:ring-primary-100";

interface FieldWrapperProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}

export function FieldWrapper({ label, required, children }: FieldWrapperProps) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink-700">
        {required && <span className="mr-1 text-accent-600">*</span>}
        {label}
      </label>
      {children}
    </div>
  );
}

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  required?: boolean;
}

export function TextField({ label, required, className, ...props }: TextFieldProps) {
  return (
    <FieldWrapper label={label} required={required}>
      <input className={`${baseFieldClass} ${className ?? ""}`} {...props} />
    </FieldWrapper>
  );
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  required?: boolean;
  options: { value: string; label: string }[];
}

export function SelectField({ label, required, options, className, ...props }: SelectFieldProps) {
  return (
    <FieldWrapper label={label} required={required}>
      <select className={`${baseFieldClass} ${className ?? ""}`} {...props}>
        <option value="">Select...</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </FieldWrapper>
  );
}

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  required?: boolean;
}

export function TextAreaField({ label, required, className, ...props }: TextAreaFieldProps) {
  return (
    <FieldWrapper label={label} required={required}>
      <textarea className={`${baseFieldClass} min-h-[90px] resize-y ${className ?? ""}`} {...props} />
    </FieldWrapper>
  );
}
