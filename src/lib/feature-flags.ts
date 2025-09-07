/**
 * Feature flags configuration
 */

export const FEATURE_FLAGS = {
  ENABLE_CONSULTATIONS: true, // Hide consultations from public frontend
  ENABLE_WELLNESS: false, // Hide wellness programs from public frontend
  ENABLE_CARE_PLUS: false, // Care+ subscription feature
  ENABLE_SUPPORT_CHAT: true, // AI support chat widget
  ENABLE_LOCATION_GATE: false, // Location gate on homepage - disabled for future implementation
  ENABLE_FIRST_VISIT_FLOW: true, // Location-based first visit flow with WhatsApp gate
  SHOW_TRENDING_MEDICINES: true, // Show trending medicines section
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return FEATURE_FLAGS[flag];
}