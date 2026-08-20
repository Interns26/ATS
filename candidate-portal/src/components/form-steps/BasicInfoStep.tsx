/**
 * Copyright (c) UWorx Services 2026. All Rights Reserved. The information contained herein is proprietary and confidential. This proprietary and confidential information, either in whole or in part, shall not be used for any purpose unless permitted by the terms of a valid license agreement.
 */

import { TextField, TextAreaField } from "../form/FormFields";
import type { BasicInfo } from "../../types/application";

interface BasicInfoStepProps {
  value: BasicInfo;
  onChange: (value: BasicInfo) => void;
}
function formatMobileNumber(input: string): string {
  const digits = input.replace(/\D/g, ""); 
  
  if (digits.startsWith("92")) {
    const remaining = digits.slice(2);
    if (remaining.length === 0) return "+92";
    if (remaining.length <= 3) return `+92 ${remaining}`;
    return `+92 ${remaining.slice(0, 3)} ${remaining.slice(3, 10)}`;
  }
  if (digits.startsWith("3") || digits.length > 0) {
    const combined = "92" + digits;
    const remaining = combined.slice(2);
    if (remaining.length === 0) return "+92";
    if (remaining.length <= 3) return `+92 ${remaining}`;
    return `+92 ${remaining.slice(0, 3)} ${remaining.slice(3, 10)}`;
  }
  return `+92 ${digits}`.trim();
}
function formatCNIC(input: string): string {
  const digits = input.replace(/\D/g, ""); 
  if (digits.length <= 5) return digits;
  if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12, 13)}`;
}
function formatPhoneNumber(input: string): string {
  const digits = input.replace(/\D/g, ""); 
  if (digits.startsWith("92")) {
    const remaining = digits.slice(2);
    if (remaining.length === 0) return "+92";
    if (remaining.length <= 3) return `+92 ${remaining}`;
    return `+92 ${remaining.slice(0, 3)} ${remaining.slice(3, 10)}`;
  }
  if (digits.startsWith("3") || digits.length > 0) {
    const phone = digits.startsWith("92") ? digits : digits;
    if (!digits.startsWith("92")) {
      const combined = "92" + digits;
      const remaining = combined.slice(2);
      if (remaining.length === 0) return "+92";
      if (remaining.length <= 3) return `+92 ${remaining}`;
      return `+92 ${remaining.slice(0, 3)} ${remaining.slice(3, 10)}`;
    }
  }
  
  return `+92 ${digits}`.trim();
}
export function BasicInfoStep({ value, onChange }: BasicInfoStepProps) {
  const update = (field: keyof BasicInfo, val: string) =>
    onChange({ ...value, [field]: val });

  const handleCNICChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCNIC(e.target.value);
    update("cnic", formatted);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    update("phoneNumber", formatted);
  };

  const handlePhoneFocus = () => {
    if (!value.phoneNumber || value.phoneNumber === "") {
      update("phoneNumber", "+92 ");
    }
  };
  const handleMobileNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const formatted = formatMobileNumber(e.target.value);
  update("mobileNumber", formatted);
};

const handleMobileNumberFocus = () => {
  if (!value.mobileNumber || value.mobileNumber === "") {
    update("mobileNumber", "+92 ");
  }
};

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
  onChange={handleMobileNumberChange}
  onFocus={handleMobileNumberFocus}
  placeholder="+92 300 1234567"
  maxLength={17}
/>
          <TextAreaField
            label="How did you hear about this job?"
            value={value.howHeard}
            onChange={(e) => update("howHeard", e.target.value)}
          />
        </div>
      </div>

      <div>
        <h2
          className="text-xl font-bold text-ink-900"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Professional Information
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <TextField
            label="CNIC"
            value={value.cnic || ""}
            onChange={handleCNICChange}
            placeholder="XXXXX-XXXXXXX-X"
            maxLength={15}
          />
          <TextField
            label="Phone Number"
            type="tel"
            value={value.phoneNumber || ""}
            onChange={handlePhoneChange}
            onFocus={handlePhoneFocus}
            placeholder="+92 300 1234567"
            maxLength={17}
          />
          <TextField
            label="Years of Experience"
            type="number"
            value={value.yearsOfExperience || ""}
            onChange={(e) => update("yearsOfExperience", e.target.value)}
            placeholder="e.g., 5"
          />
          <TextField
            label="Current Job Title"
            value={value.currentJobTitle || ""}
            onChange={(e) => update("currentJobTitle", e.target.value)}
            placeholder="e.g., Senior Developer"
          />
          <TextField
            label="Current Employer"
            value={value.currentEmployer || ""}
            onChange={(e) => update("currentEmployer", e.target.value)}
            placeholder="e.g., Tech Company Inc"
          />
        </div>
      </div>
    </div>
  );
}