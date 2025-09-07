/**
 * Feature flags configuration
 */

export const FEATURE_FLAGS = {
  ENABLE_CONSULTATIONS: false, // Hide consultations from public frontend - moved to request flow
  ENABLE_WELLNESS: false, // Hide wellness programs from public frontend
  ENABLE_CARE_PLUS: false, // Care+ subscription feature
  ENABLE_SUPPORT_CHAT: true, // AI support chat widget
  ENABLE_LOCATION_GATE: false, // Location gate on homepage - disabled for future implementation
  ENABLE_FIRST_VISIT_FLOW: true, // Location-based first visit flow with WhatsApp gate
  SHOW_TRENDING_MEDICINES: false, // Hide trending medicines section - moved to request flow
  ENABLE_LEGACY_MEDICINES: false, // Hide legacy medicine browsing - moved to request flow
  ENABLE_LEGACY_LAB_TESTS: false, // Hide legacy lab test browsing - moved to request flow
  ENABLE_REQUEST_FLOW: true, // New request-first intake flow
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return FEATURE_FLAGS[flag];
}