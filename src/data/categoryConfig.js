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
      "ramayana-ethical-lessons.json",
      "mahabharata-dharma-teachings.json",
      "bhagavad-gita-dharma.json",
      "upanishads-vedic-wisdom.json",
      "ramayana-spiritual-guidance.json",
      "mahabharata-philosophical-teachings.json"
    ],
    promptEnhancement: "dharmic wisdom spiritual guidance ancient texts vedic knowledge sacred teachings"
  },

  meditation: {
    displayName: "🧘 Meditation & Inner Peace",
    backendFiles: [
      "yoga-sutras-patanjali.json",
      "upanishads-meditation.json",
      "mandukya-upanishad.json",
      "swami-vivekananda-meditation-works.json",
      "bhagavad-gita-meditation.json",
      "upanishads-self-realization.json",
      "buddhist-meditation-texts.json",
      "yoga-philosophy-texts.json"
    ],
    promptEnhancement: "meditation practice inner peace mindfulness spiritual techniques self-realization"
  },

  dharma: {
    displayName: "⚖️ Dharma & Ethical Living",
    backendFiles: [
      "dharma-shastras.json",
      "bhagavad-gita-dharma.json",
      "mahabharata-dharma-teachings.json",
      "ramayana-ethical-lessons.json",
      "upanishads-ethical-principles.json",
      "swami-vivekananda-ethics.json",
      "mahabharata-moral-stories.json",
      "dharma-ethics-texts.json"
    ],
    promptEnhancement: "dharma ethics moral principles righteous conduct ethical living moral values"
  },

  relationships: {
    displayName: "💕 Sacred Relationships & Love",
    backendFiles: [
      "bhakti-literature.json",
      "ramayana-family-values.json",
      "mahabharata-relationships.json",
      "upanishads-human-connections.json",
      "bhagavad-gita-devotion.json",
      "swami-vivekananda-love-compassion.json",
      "family-dharma-texts.json",
      "sacred-love-teachings.json"
    ],
    promptEnhancement: "sacred relationships love compassion family values human connections devotion"
  },

  purpose: {
    displayName: "🎯 Life Purpose & Karma",
    backendFiles: [
      "karma-yoga-texts.json",
      "bhagavad-gita-purpose.json",
      "upanishads-self-realization.json",
      "swami-vivekananda-life-goals.json",
      "bhagavad-gita-karma.json",
      "mahabharata-life-lessons.json",
      "upanishads-purpose-teachings.json",
      "karma-philosophy-texts.json"
    ],
    promptEnhancement: "life purpose karma self-realization spiritual journey destiny duty fulfillment"
  },

  challenges: {
    displayName: "🛡️ Overcoming Life Challenges",
    backendFiles: [
      "bhagavad-gita-adversity.json",
      "ramayana-trials-tribulations.json",
      "swami-vivekananda-struggles.json",
      "mahabharata-resilience.json",
      "upanishads-inner-strength.json",
      "epic-stories-resilience.json",
      "spiritual-strength-texts.json",
      "overcoming-difficulties-texts.json"
    ],
    promptEnhancement: "overcoming challenges adversity resilience inner strength spiritual growth difficulties"
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
