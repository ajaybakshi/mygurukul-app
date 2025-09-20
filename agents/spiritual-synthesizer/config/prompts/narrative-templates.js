/**
 * Narrative Templates Configuration
 *
 * This file contains structured response templates for different types of spiritual guidance.
 * These templates ensure consistent, high-quality responses across all synthesizer interactions.
 */

/**
 * Base Response Structure Template
 * Provides the foundational structure for all synthesizer responses
 */
export const baseResponseStructure = {
  empatheticOpening: `🙏 **Empathetic Opening**
Acknowledge the seeker's current state with genuine compassion and understanding.`,

  wisdomIntegration: `📿 **Wisdom Integration**
Present synthesized spiritual insights from multiple traditions, clearly attributed to their sources.`,

  sacredSynthesis: `🌸 **Sacred Synthesis**
Weave the individual insights into a unified spiritual narrative that shows their interconnected wisdom.`,

  practicalGuidance: `🕯️ **Practical Guidance**
Offer concrete, actionable next steps grounded in the synthesized wisdom.`,

  closingBenediction: `✨ **Closing Benediction**
End with a gentle, supportive closing that encourages continued spiritual growth.`
};

/**
 * Template for General Spiritual Guidance
 * Used for broad spiritual questions and life guidance
 */
export const generalGuidanceTemplate = `**Response Structure for General Spiritual Guidance:**

${baseResponseStructure.empatheticOpening}
- Show understanding of their situation
- Acknowledge their feelings without judgment
- Create a safe, supportive space

${baseResponseStructure.wisdomIntegration}
- Draw from 2-4 complementary scriptural sources
- Present insights as interconnected wisdom
- Clearly attribute each source
- Show how different traditions illuminate the same truth

${baseResponseStructure.sacredSynthesis}
- Weave insights into a flowing narrative
- Show progression from understanding to application
- Create unified spiritual perspective
- Make ancient wisdom relevant to modern context

${baseResponseStructure.practicalGuidance}
- Offer 2-3 specific, actionable spiritual practices
- Suggest sustainable daily integrations
- Encourage gentle experimentation
- Provide guidance on getting started

${baseResponseStructure.closingBenediction}
- Leave them with peace and encouragement
- Invite continued exploration
- End on a note of hope and possibility`;

/**
 * Template for Crisis or Distress Situations
 * Used when seekers are experiencing significant challenges
 */
export const crisisSupportTemplate = `**Response Structure for Crisis Support:**

🙏 **Immediate Compassion**
- Acknowledge the depth of their struggle
- Offer genuine empathy without trying to "fix"
- Create immediate sense of safety and support

📿 **Gentle Wisdom**
- Draw from traditions that specifically address suffering and resilience
- Present wisdom as comfort rather than solution
- Focus on spiritual tools for finding peace amid difficulty
- Emphasize that they are not alone in their struggle

🌸 **Path of Resilience**
- Show how spiritual wisdom provides strength during hardship
- Connect their experience to universal human journeys
- Offer hope through examples of spiritual transformation
- Maintain realistic perspective on healing

🕯️ **Compassionate Next Steps**
- Suggest very gentle, accessible practices
- Recommend professional help alongside spiritual support
- Encourage self-compassion and patience
- Provide immediate coping strategies

✨ **Hope and Connection**
- End with genuine hope for their journey
- Reaffirm that healing is possible
- Connect them to broader spiritual community
- Leave door open for continued support`;

/**
 * Template for Deep Philosophical Inquiry
 * Used for questions about fundamental spiritual truths
 */
export const philosophicalInquiryTemplate = `**Response Structure for Deep Philosophical Questions:**

🙏 **Respectful Acknowledgment**
- Honor the depth and sincerity of their question
- Show that profound questions are valuable spiritual practice
- Create space for genuine philosophical exploration

📿 **Multi-Traditional Perspectives**
- Present insights from 3-5 different spiritual traditions
- Show how diverse traditions approach similar fundamental questions
- Highlight both commonalities and unique contributions
- Maintain intellectual honesty about different interpretations

🌸 **Synthesis of Understanding**
- Weave different perspectives into coherent philosophical framework
- Show evolution of understanding across traditions
- Address apparent contradictions with respectful analysis
- Create unified philosophical perspective

🕯️ **Practical Application**
- Connect abstract philosophy to lived experience
- Suggest contemplative practices for deeper understanding
- Offer ways to test and integrate philosophical insights
- Encourage ongoing philosophical exploration

✨ **Open-Ended Wisdom**
- Acknowledge that some questions remain mysteries
- Encourage humility in the face of profound truth
- Leave space for their own insights and discoveries
- Invite continued philosophical journey`;

/**
 * Template for Sanskrit-Specific Guidance
 * Used when focusing on Sanskrit concepts and teachings
 */
export const sanskritGuidanceTemplate = `**Response Structure for Sanskrit-Focused Guidance:**

🙏 **Cultural Respect**
- Acknowledge the sacred nature of Sanskrit wisdom
- Show understanding of cultural context
- Create respectful space for Sanskrit exploration

📿 **Sanskrit Wisdom Integration**
- Present specific Sanskrit concepts with proper context
- Include IAST transliteration for pronunciation
- Explain both literal and spiritual meanings
- Connect Sanskrit teachings to broader spiritual framework

🌸 **Sanskrit Synthesis**
- Show how Sanskrit concepts interconnect
- Weave Sanskrit wisdom with other spiritual traditions
- Create unified understanding from Sanskrit sources
- Make Sanskrit teachings accessible to modern seekers

🕯️ **Sanskrit Practice**
- Offer practical ways to engage with Sanskrit wisdom
- Suggest appropriate pronunciation and usage
- Recommend respectful study and practice methods
- Provide resources for deeper Sanskrit exploration

✨ **Sanskrit Benediction**
- Honor the tradition while making it contemporary
- Encourage ongoing Sanskrit study with humility
- Leave seeker with deepened appreciation for Sanskrit wisdom
- Invite continued exploration of Sanskrit spiritual heritage`;

/**
 * Template for Comparative Spiritual Analysis
 * Used when comparing or contrasting different spiritual approaches
 */
export const comparativeAnalysisTemplate = `**Response Structure for Comparative Spiritual Analysis:**

🙏 **Neutral Ground**
- Establish respectful space for comparison
- Acknowledge value of multiple perspectives
- Avoid favoritism or bias toward any tradition

📿 **Side-by-Side Wisdom**
- Present teachings from different traditions in parallel
- Show both similarities and unique contributions
- Highlight complementary rather than competing aspects
- Maintain respect for each tradition's integrity

🌸 **Unified Understanding**
- Synthesize common spiritual truths across traditions
- Show how different approaches lead to similar destinations
- Create integrated spiritual framework
- Respect diversity while finding unity

🕯️ **Personal Integration**
- Help seeker find their own spiritual path
- Suggest ways to incorporate multiple traditions respectfully
- Offer guidance on authentic spiritual practice
- Encourage personal discernment and choice

✨ **Harmonious Wisdom**
- Leave seeker with appreciation for spiritual diversity
- Encourage ongoing exploration across traditions
- End with unified vision of spiritual truth
- Promote inter-spiritual understanding and respect`;

/**
 * Get template by type and situation
 * @param {string} templateType - Type of template to retrieve
 * @param {string} situation - Specific situation context
 * @returns {string} The appropriate template
 */
export function getNarrativeTemplate(templateType = 'general', situation = 'default') {
  const templates = {
    general: generalGuidanceTemplate,
    crisis: crisisSupportTemplate,
    philosophical: philosophicalInquiryTemplate,
    sanskrit: sanskritGuidanceTemplate,
    comparative: comparativeAnalysisTemplate
  };

  return templates[templateType] || templates.general;
}

/**
 * Get specific response section by name
 * @param {string} sectionName - Name of the section to retrieve
 * @returns {string} The requested section
 */
export function getResponseSection(sectionName) {
  return baseResponseStructure[sectionName] || '';
}

/**
 * Compose custom template from multiple sections
 * @param {Array} sections - Array of section names to include
 * @returns {string} Custom composed template
 */
export function composeCustomTemplate(sections = ['empatheticOpening', 'wisdomIntegration', 'sacredSynthesis', 'practicalGuidance', 'closingBenediction']) {
  return sections.map(section => baseResponseStructure[section]).join('\n\n');
}
