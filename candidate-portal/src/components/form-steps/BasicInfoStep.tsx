/**
 * Copyright (c) 2026 Coworx UK. All rights reserved.
 */

import { TextField, TextAreaField } from "../form/FormFields";
import type { BasicInfo } from "../../types/application";

interface BasicInfoStepProps {
  value: BasicInfo;
  onChange: (value: BasicInfo) => void;
}

export function BasicInfoStep({ value, onChange }: BasicInfoStepProps) {
  const update = (field: keyof BasicInfo, val: string) =>
    onChange({ ...value, [field]: val });

  return (
    <div className="space-y-6">
      <div>
        <h2
          className="text-xl font-bold text-ink-900"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Candidate Information
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <TextField
              label="Email Address"
              required
              type="email"
              value={value.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <TextField
            label="First Name"
            required
            value={value.firstName}
            onChange={(e) => update("firstName", e.target.value)}
          />
          <TextField
            label="Last Name"
            required
            value={value.lastName}
            onChange={(e) => update("lastName", e.target.value)}
          />
        </div>
      </div>

      <div>
        <h2
          className="text-xl font-bold text-ink-900"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Address
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <TextField
            label="City"
            required
            value={value.city}
            onChange={(e) => update("city", e.target.value)}
          />
          <TextField
            label="State / Province"
            value={value.stateProvince}
            onChange={(e) => update("stateProvince", e.target.value)}
          />
        </div>
      </div>

      <div>
        <h2
          className="text-xl font-bold text-ink-900"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Contact Information
        </h2>
        <div className="mt-4 grid gap-4">
          <TextField
            label="Mobile Number"
            required
            type="tel"
            value={value.mobileNumber}
            onChange={(e) => update("mobileNumber", e.target.value)}
            placeholder="+92 300 1234567"
          />
          <TextAreaField
            label="How did you hear about this job?"
            value={value.howHeard}
            onChange={(e) => update("howHeard", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
