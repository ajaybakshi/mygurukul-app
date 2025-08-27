# Category Configuration Update Preview

## Proposed Updated Structure for `src/data/categoryConfig.js`

```javascript
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
```

## Category Mappings Summary

### **🕉️ Dharmic Wisdom & Guidance**
**Source Files:**
- `bhagavad-gita-complete.json` - Complete Bhagavad Gita
- `upanishads-principal.json` - Principal Upanishads
- `ramayana-ethical-lessons.json` - Ramayana ethical teachings
- `mahabharata-dharma-teachings.json` - Mahabharata dharma lessons
- `bhagavad-gita-dharma.json` - Bhagavad Gita dharma sections
- `upanishads-vedic-wisdom.json` - Vedic wisdom from Upanishads
- `ramayana-spiritual-guidance.json` - Spiritual guidance from Ramayana
- `mahabharata-philosophical-teachings.json` - Philosophical teachings from Mahabharata

### **🧘 Meditation & Inner Peace**
**Source Files:**
- `yoga-sutras-patanjali.json` - Yoga Sutras of Patanjali
- `upanishads-meditation.json` - Meditation teachings from Upanishads
- `mandukya-upanishad.json` - Mandukya Upanishad
- `swami-vivekananda-meditation-works.json` - Swami Vivekananda's meditation works
- `bhagavad-gita-meditation.json` - Meditation sections from Bhagavad Gita
- `upanishads-self-realization.json` - Self-realization teachings
- `buddhist-meditation-texts.json` - Buddhist meditation texts
- `yoga-philosophy-texts.json` - Yoga philosophy texts

### **⚖️ Dharma & Ethical Living**
**Source Files:**
- `dharma-shastras.json` - Dharma Shastras
- `bhagavad-gita-dharma.json` - Dharma sections from Bhagavad Gita
- `mahabharata-dharma-teachings.json` - Dharma teachings from Mahabharata
- `ramayana-ethical-lessons.json` - Ethical lessons from Ramayana
- `upanishads-ethical-principles.json` - Ethical principles from Upanishads
- `swami-vivekananda-ethics.json` - Swami Vivekananda's ethics teachings
- `mahabharata-moral-stories.json` - Moral stories from Mahabharata
- `dharma-ethics-texts.json` - Dharma and ethics texts

### **💕 Sacred Relationships & Love**
**Source Files:**
- `bhakti-literature.json` - Bhakti literature
- `ramayana-family-values.json` - Family values from Ramayana
- `mahabharata-relationships.json` - Relationship teachings from Mahabharata
- `upanishads-human-connections.json` - Human connections from Upanishads
- `bhagavad-gita-devotion.json` - Devotion teachings from Bhagavad Gita
- `swami-vivekananda-love-compassion.json` - Love and compassion teachings
- `family-dharma-texts.json` - Family dharma texts
- `sacred-love-teachings.json` - Sacred love teachings

### **🎯 Life Purpose & Karma**
**Source Files:**
- `karma-yoga-texts.json` - Karma Yoga texts
- `bhagavad-gita-purpose.json` - Purpose teachings from Bhagavad Gita
- `upanishads-self-realization.json` - Self-realization from Upanishads
- `swami-vivekananda-life-goals.json` - Life goals teachings
- `bhagavad-gita-karma.json` - Karma teachings from Bhagavad Gita
- `mahabharata-life-lessons.json` - Life lessons from Mahabharata
- `upanishads-purpose-teachings.json` - Purpose teachings from Upanishads
- `karma-philosophy-texts.json` - Karma philosophy texts

### **🛡️ Overcoming Life Challenges**
**Source Files:**
- `bhagavad-gita-adversity.json` - Adversity teachings from Bhagavad Gita
- `ramayana-trials-tribulations.json` - Trials and tribulations from Ramayana
- `swami-vivekananda-struggles.json` - Swami Vivekananda's teachings on struggles
- `mahabharata-resilience.json` - Resilience teachings from Mahabharata
- `upanishads-inner-strength.json` - Inner strength from Upanishads
- `epic-stories-resilience.json` - Epic stories of resilience
- `spiritual-strength-texts.json` - Spiritual strength texts
- `overcoming-difficulties-texts.json` - Texts on overcoming difficulties

## Benefits of This Structure

### **📚 Comprehensive Coverage:**
- Each category maps to 8 relevant source files
- Covers all major spiritual texts and traditions
- Includes both ancient and modern spiritual teachings

### **🎯 Targeted Content:**
- Specific file mappings for each category
- Relevant prompt enhancements for better AI responses
- Focused content for user queries

### **🔄 Scalable Design:**
- Easy to add new source files
- Flexible structure for future expansions
- Maintainable configuration system

### **📖 Authentic Sources:**
- Maps to actual MyGurukul corpus files
- Authentic spiritual texts and teachings
- Proper categorization of sacred wisdom
