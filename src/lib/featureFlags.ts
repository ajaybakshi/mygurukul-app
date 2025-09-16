/**
 * Feature Flags Configuration
 * Centralized feature flag management for the application
 */

export interface FeatureFlags {
  audioRenditions: boolean;
  audioPlayback: boolean;
  audioDownload: boolean;
  audioSharing: boolean;
  audioTranscription: boolean;
}

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  audioRenditions: false,
  audioPlayback: false,
  audioDownload: false,
  audioSharing: false,
  audioTranscription: false,
};

export class FeatureFlagManager {
  private flags: FeatureFlags;

  constructor(initialFlags: FeatureFlags = DEFAULT_FEATURE_FLAGS) {
    this.flags = { ...initialFlags };
  }

  isEnabled(flag: keyof FeatureFlags): boolean {
    return this.flags[flag];
  }

  enable(flag: keyof FeatureFlags): void {
    this.flags[flag] = true;
  }

  disable(flag: keyof FeatureFlags): void {
    this.flags[flag] = false;
  }

  updateFlags(newFlags: Partial<FeatureFlags>): void {
    this.flags = { ...this.flags, ...newFlags };
  }

  getAllFlags(): FeatureFlags {
    return { ...this.flags };
  }
}

// Global feature flag instance
export const featureFlags = new FeatureFlagManager();
