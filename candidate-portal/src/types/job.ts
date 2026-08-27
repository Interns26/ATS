/**
 * Copyright (c) UWorx Services 2026. All Rights Reserved. The information contained herein is proprietary and confidential. This proprietary and confidential information, either in whole or in part, shall not be used for any purpose unless permitted by the terms of a valid license agreement.
 */

export type JobStatus = "open" | "closing_soon" | "new";

export interface Job {
  id: string;
  title: string;
  location: string;
  employmentType: "Permanent" | "Contract" | "Internship" | "Part-time";
  openingDate: string;   // ISO date
  closingDate: string;   // ISO date
  numPositions: number;
  department: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
}
