/**
 * MyGurukul Category Configuration
 * Maps frontend categories to backend corpus files with custom prompts
 */

export const categoryConfig = {
  dharmic: {
    displayName: "🕉️ Dharmic Wisdom & Guidance",
    backendFiles: [
      "bhagavad-gita-complete.json",
      "upanishads-principal.json",
      "swami-vivekananda-complete-works.json",
      "ramayana-ethical-lessons.json",
      "mahabharata-dharma-teachings.json"
    ],
    promptEnhancement: "dharmic wisdom spiritual guidance ancient texts vedic knowledge"
  },

  meditation: {
    displayName: "🧘 Meditation & Inner Peace",
    backendFiles: [
      "upanishads-meditation.json",
      "swami-vivekananda-meditation-works.json",
      "yoga-sutras-patanjali.json",
      "bhagavad-gita-meditation.json",
      "upanishads-self-realization.json"
    ],
    promptEnhancement: "meditation practice inner peace mindfulness spiritual techniques"
  },

  dharma: {
    displayName: "⚖️ Dharma & Ethical Living",
    backendFiles: [
      "bhagavad-gita-dharma.json",
      "ramayana-ethical-lessons.json",
      "mahabharata-dharma-teachings.json",
      "upanishads-ethical-principles.json",
      "swami-vivekananda-ethics.json"
    ],
    promptEnhancement: "dharma ethics moral principles righteous conduct ethical living"
  },

  relationships: {
    displayName: "💕 Sacred Relationships & Love",
    backendFiles: [
      "ramayana-family-values.json",
      "mahabharata-relationships.json",
      "upanishads-human-connections.json",
      "bhagavad-gita-devotion.json",
      "swami-vivekananda-love-compassion.json"
    ],
    promptEnhancement: "sacred relationships love compassion family values human connections"
  },

  purpose: {
    displayName: "🎯 Life Purpose & Karma",
    backendFiles: [
      "bhagavad-gita-purpose.json",
      "swami-vivekananda-life-goals.json",
      "upanishads-self-realization.json",
      "bhagavad-gita-karma.json",
      "mahabharata-life-lessons.json"
    ],
    promptEnhancement: "life purpose karma self-realization spiritual journey destiny"
  },

  challenges: {
    displayName: "🛡️ Overcoming Life Challenges",
    backendFiles: [
      "bhagavad-gita-adversity.json",
      "ramayana-trials-tribulations.json",
      "swami-vivekananda-struggles.json",
      "mahabharata-resilience.json",
      "upanishads-inner-strength.json"
    ],
    promptEnhancement: "overcoming challenges adversity resilience inner strength spiritual growth"
  }
};

/**
 * Helper function to get category by display name
 */
export const getCategoryByDisplayName = (displayName) => {
  return Object.entries(categoryConfig).find(
    ([_, config]) => config.displayName === displayName
  )?.[0] || null;
};

/**
 * Helper function to get all backend files for a category
 */
export const getBackendFilesForCategory = (category) => {
  return categoryConfig[category]?.backendFiles || [];
};

/**
 * Helper function to get prompt enhancement for a category
 */
export const getPromptEnhancementForCategory = (category) => {
  return categoryConfig[category]?.promptEnhancement || "";
};

/**
 * Helper function to get all available categories
 */
export const getAllCategories = () => {
  return Object.keys(categoryConfig);
};

/**
 * Helper function to get all display names
 */
export const getAllDisplayNames = () => {
  return Object.values(categoryConfig).map(config => config.displayName);
};

export default categoryConfig;
