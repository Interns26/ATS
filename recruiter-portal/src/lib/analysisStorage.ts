/**
 * Copyright (c) 2026 Uworx UK. All rights reserved.
 */

export const ANALYSIS_STORAGE_KEY = "ats:last-analysis";
export const THRESHOLDS_STORAGE_KEY = "ats:thresholds";

export type Thresholds = {
  interview: number;
  consider: number;
};

export const DEFAULT_THRESHOLDS: Thresholds = {
  interview: 85,
  consider: 70,
};
