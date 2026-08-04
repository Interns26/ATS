/**
 * Copyright (c) UWorx Services 2026. All Rights Reserved. The information contained herein is proprietary and confidential. This proprietary and confidential information, either in whole or in part, shall not be used for any purpose unless permitted by the terms of a valid license agreement.
 */

import type { Job, JobStatus } from "../types/job";

const DAY_MS = 1000 * 60 * 60 * 24;

export function getJobStatus(job: Job, now: Date = new Date()): JobStatus {
  const opening = new Date(job.openingDate);
  const closing = new Date(job.closingDate);

  const daysSinceOpen = (now.getTime() - opening.getTime()) / DAY_MS;
  const daysUntilClose = (closing.getTime() - now.getTime()) / DAY_MS;

  if (daysUntilClose <= 14 && daysUntilClose >= 0) return "closing_soon";
  if (daysSinceOpen <= 7 && daysSinceOpen >= 0) return "new";
  return "open";
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
