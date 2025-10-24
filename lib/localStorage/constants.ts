/**
 * localStorage key for recent challenges data.
 * Namespaced to avoid collisions.
 */
export const STORAGE_KEY = 'push-track:recentChallenges' as const

/**
 * Current schema version for localStorage data.
 * Increment when making breaking changes to StorageData structure.
 */
export const STORAGE_VERSION = 1 as const
