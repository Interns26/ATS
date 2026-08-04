/**
 * Copyright (c) 2026 Uworx UK. All rights reserved.
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
