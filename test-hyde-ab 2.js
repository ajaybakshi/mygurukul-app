// Test script to find queries that will get HYDE enabled
function generateUserHash(userQuery, sessionId) {
  const input = `${userQuery}:${sessionId || 'anonymous'}`
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

const testQueries = [
  "What is dharma?",
  "What is karma?",
  "What is meditation?",
  "Tell me about moksha",
  "What is atman?",
  "Explain brahman",
  "What is yoga?",
  "Tell me about the Vedas",
  "What are Upanishads?",
  "Explain samsara",
  "What is bhakti?",
  "Tell me about jnana",
  "What is karma yoga?",
  "Explain raja yoga",
  "What is bhakti yoga?",
  "Tell me about jnana yoga",
  "What is samadhi?",
  "Explain dhyana",
  "What is dharana?",
  "Tell me about pratyahara"
]

console.log('Testing queries for HYDE eligibility (10% rollout):')
console.log('='.repeat(60))

testQueries.forEach((query, index) => {
  const hash = generateUserHash(query, null)
  const hashPercentage = hash % 100
  const shouldEnable = hashPercentage < 10
  
  console.log(`${index + 1}. "${query}"`)
  console.log(`   Hash: ${hash}, Percentage: ${hashPercentage}%, HYDE: ${shouldEnable ? '✅ ENABLED' : '❌ DISABLED'}`)
  console.log('')
})

console.log('='.repeat(60))
console.log('Queries with HYDE enabled:')
testQueries.forEach((query, index) => {
  const hash = generateUserHash(query, null)
  const hashPercentage = hash % 100
  if (hashPercentage < 10) {
    console.log(`✅ "${query}" (${hashPercentage}%)`)
  }
})
