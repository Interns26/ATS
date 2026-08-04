/**
 * Copyright (c) 2026 Coworx UK. All rights reserved.
 */

import { useRef, useState } from "react";
import { Inbox, FileCheck, X } from "lucide-react";

interface ResumeStepProps {
  value: File | null;
  onChange: (file: File | null) => void;
}

const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const MAX_SIZE_MB = 5;

export function ResumeStep({ value, onChange }: ResumeStepProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndSet = (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Please upload a PDF or Word document.");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File must be under ${MAX_SIZE_MB}MB.`);
      return;
    }
    setError(null);
    onChange(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) validateAndSet(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndSet(file);
  };

  return (
    <div className="space-y-4">
      <h2
        className="text-xl font-bold text-ink-900"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Resume
      </h2>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={handleFileSelect}
        className="hidden"
      />

      {!value ? (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed py-16 text-center transition ${
            isDragging
              ? "border-primary-600 bg-primary-50"
              : "border-ink-200 bg-ink-50/50 hover:border-primary-300"
          }`}
        >
          <Inbox size={32} className="mb-3 text-primary-700" />
          <p className="font-semibold text-ink-900">Resume</p>
          <p className="mt-1 text-sm text-ink-500">
            Click or drag & drop here to upload document
          </p>
          <p className="mt-2 text-xs text-ink-400">PDF or Word, up to {MAX_SIZE_MB}MB</p>
        </div>
      ) : (
        <div className="flex items-center justify-between rounded-xl border border-primary-200 bg-primary-50 px-5 py-4">
          <div className="flex items-center gap-3">
            <FileCheck size={22} className="text-primary-700" />
            <div>
              <p className="text-sm font-semibold text-ink-900">{value.name}</p>
              <p className="text-xs text-ink-500">
                {(value.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          </div>
          <button
            onClick={() => onChange(null)}
            className="text-ink-400 transition hover:text-accent-600"
            aria-label="Remove file"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {error && <p className="text-sm text-accent-600">{error}</p>}
    </div>
  );
}
