/**
 * Copyright (c) UWorx Services 2026. All Rights Reserved. The information contained herein is proprietary and confidential. This proprietary and confidential information, either in whole or in part, shall not be used for any purpose unless permitted by the terms of a valid license agreement.
 */

export const ANALYSIS_STORAGE_KEY = "ats:last-analysis";
export const THRESHOLDS_STORAGE_KEY = "ats:thresholds";

export type Thresholds = {
  interview: number;
  consider: number;
};

export const DEFAULT_THRESHOLDS: Thresholds = {
  interview: 70,
  consider: 50,
};
