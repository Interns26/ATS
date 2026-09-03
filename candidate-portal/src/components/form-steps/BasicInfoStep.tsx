/**
 * Copyright (c) UWorx Services 2026. All Rights Reserved. The information contained herein is proprietary and confidential. This proprietary and confidential information, either in whole or in part, shall not be used for any purpose unless permitted by the terms of a valid license agreement.
 */

import { TextField, TextAreaField } from "../form/FormFields";
import type { BasicInfo } from "../../types/application";

interface BasicInfoStepProps {
  value: BasicInfo;
  onChange: (value: BasicInfo) => void;
}

// Format mobile number as:
// +92 300 1234567
function formatMobileNumber(input: string): string {
  let digits = input.replace(/\D/g, "");

  // Remove Pakistan country code if user enters it
  if (digits.startsWith("92")) {
    digits = digits.slice(2);
  }

  // Remove leading 0 if user enters 03001234567
  if (digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  // Maximum 10 digits after +92
  digits = digits.slice(0, 10);

  if (digits.length === 0) {
    return "+92 ";
  }

  if (digits.length <= 3) {
    return `+92 ${digits}`;
  }

  return `+92 ${digits.slice(0, 3)} ${digits.slice(3)}`;
}

// Format CNIC as:
// XXXXX-XXXXXXX-X
function formatCNIC(input: string): string {
  const digits = input.replace(/\D/g, "").slice(0, 13);

  if (digits.length <= 5) {
    return digits;
  }

  if (digits.length <= 12) {
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  }

  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12, 13)}`;
}

export function BasicInfoStep({
  value,
  onChange,
}: BasicInfoStepProps) {
  const update = (field: keyof BasicInfo, val: string) =>
    onChange({
      ...value,
      [field]: val,
    });

  const handleCNICChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const formatted = formatCNIC(e.target.value);
    update("cnic", formatted);
  };

  const handleMobileNumberChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const formatted = formatMobileNumber(e.target.value);

    onChange({
      ...value,
      mobileNumber: formatted,
      phoneNumber: formatted,
    });
  };

  const handleMobileNumberFocus = () => {
    if (!value.mobileNumber) {
      update("mobileNumber", "+92 ");
    }
  };

  return (
    <div className="space-y-6">

      {/* Candidate Information */}
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
              onChange={(e) =>
                update("email", e.target.value)
              }
              placeholder="you@example.com"
            />
          </div>

          <TextField
            label="First Name"
            required
            value={value.firstName}
            onChange={(e) =>
              update("firstName", e.target.value)
            }
          />

          <TextField
            label="Last Name"
            required
            value={value.lastName}
            onChange={(e) =>
              update("lastName", e.target.value)
            }
          />

        </div>
      </div>

      {/* Address */}
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
            onChange={(e) =>
              update("city", e.target.value)
            }
          />

          <TextField
            label="State / Province"
            value={value.stateProvince}
            onChange={(e) =>
              update("stateProvince", e.target.value)
            }
          />

        </div>
      </div>

      {/* Contact Information */}
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
            maxLength={15}
          />

          <TextAreaField
            label="How did you hear about this job?"
            value={value.howHeard}
            onChange={(e) =>
              update("howHeard", e.target.value)
            }
          />

        </div>
      </div>

      {/* Professional Information */}
      <div>
        <h2
          className="text-xl font-bold text-ink-900"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Professional Information
        </h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">

          {/* CNIC */}
          <TextField
            label="CNIC"
            required
            value={value.cnic || ""}
            onChange={handleCNICChange}
            placeholder="XXXXX-XXXXXXX-X"
            maxLength={15}
          />

          {/* Years of Experience */}
          <TextField
            label="Years of Experience"
            required
            type="number"
            value={value.yearsOfExperience || ""}
            onChange={(e) =>
              update(
                "yearsOfExperience",
                e.target.value
              )
            }
            placeholder="e.g., 5"
          />

          {/* Current Job Title */}
          <TextField
            label="Current Job Title"
            required
            value={value.currentJobTitle || ""}
            onChange={(e) =>
              update(
                "currentJobTitle",
                e.target.value
              )
            }
            placeholder="e.g., Senior Developer"
          />

          {/* Current Employer */}
          <TextField
            label="Current Employer"
            required
            value={value.currentEmployer || ""}
            onChange={(e) =>
              update(
                "currentEmployer",
                e.target.value
              )
            }
            placeholder="e.g., Tech Company Inc"
          />

        </div>
      </div>

    </div>
  );
}