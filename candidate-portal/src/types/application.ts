/**
 * Copyright (c) UWorx Services 2026. All Rights Reserved. The information contained herein is proprietary and confidential. This proprietary and confidential information, either in whole or in part, shall not be used for any purpose unless permitted by the terms of a valid license agreement.
 */

export interface BasicInfo {
  email: string;
  firstName: string;
  lastName: string;
  city: string;
  stateProvince: string;
  mobileNumber: string;
  howHeard: string;
}

export interface Qualification {
  id: string;
  qualification: string;
  subject: string;
  institute: string;
  grade: string;
  graduationYear: string;
}

export interface WorkExperience {
  id: string;
  jobField: string;
  organization: string;
  jobTitle: string;
  startDate: string;
  currentlyWorking: boolean;
  endDate: string;
  startingSalary: string;
  endingSalary: string;
  jobDescription: string;
}

export interface ApplicationFormData {
  basicInfo: BasicInfo;
  qualifications: Qualification[];
  workExperience: WorkExperience[];
  resumeFile: File | null;
}

export const emptyBasicInfo: BasicInfo = {
  email: "",
  firstName: "",
  lastName: "",
  city: "",
  stateProvince: "",
  mobileNumber: "",
  howHeard: "",
};

export function emptyQualification(): Qualification {
  return {
    id: crypto.randomUUID(),
    qualification: "",
    subject: "",
    institute: "",
    grade: "",
    graduationYear: "",
  };
}

export function emptyWorkExperience(): WorkExperience {
  return {
    id: crypto.randomUUID(),
    jobField: "",
    organization: "",
    jobTitle: "",
    startDate: "",
    currentlyWorking: false,
    endDate: "",
    startingSalary: "",
    endingSalary: "",
    jobDescription: "",
  };
}
