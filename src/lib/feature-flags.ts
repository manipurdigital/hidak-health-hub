/**
 * Feature flags configuration
 */

export const FEATURE_FLAGS = {
  ENABLE_CONSULTATIONS: false, // Hide consultations from public frontend
  ENABLE_WELLNESS: false, // Hide wellness programs from public frontend
  ENABLE_CARE_PLUS: false, // Care+ subscription feature
  ENABLE_SUPPORT_CHAT: true, // AI support chat widget
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return FEATURE_FLAGS[flag];
}