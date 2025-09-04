# Environment Variables Quick Reference - MyGurukul Spiritual AI
## =============================================================

## Required Variables for HYDE Testing

### ✅ Already Configured
```bash
HYDE_ENABLED=true
NODE_ENV=development
```

### ❌ Missing - Need to Configure

#### Google Cloud Discovery Engine
```bash
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_CLOUD_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----"
GOOGLE_DISCOVERY_ENGINE_ENDPOINT=https://discoveryengine.googleapis.com/v1/projects/your-project-id/locations/global/collections/default_collection/dataStores/your-datastore-id/servingConfigs/default_search:search
```

#### Perplexity AI
```bash
PERPLEXITY_API_KEY=your-perplexity-api-key
ENABLE_PERPLEXITY_SEARCH=true
PERPLEXITY_SEARCH_WEIGHT=0.15
```

## Quick Setup Commands

### 1. Update .env.local
```bash
# Add these lines to your .env.local file
echo "GOOGLE_CLOUD_PROJECT_ID=your-project-id" >> .env.local
echo "GOOGLE_CLOUD_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com" >> .env.local
echo "GOOGLE_CLOUD_PRIVATE_KEY=\"-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\"" >> .env.local
echo "GOOGLE_DISCOVERY_ENGINE_ENDPOINT=https://discoveryengine.googleapis.com/v1/projects/your-project-id/locations/global/collections/default_collection/dataStores/your-datastore-id/servingConfigs/default_search:search" >> .env.local
echo "PERPLEXITY_API_KEY=your-perplexity-api-key" >> .env.local
echo "ENABLE_PERPLEXITY_SEARCH=true" >> .env.local
echo "PERPLEXITY_SEARCH_WEIGHT=0.15" >> .env.local
```

### 2. Test Configuration
```bash
# Restart server
npm run dev

# Test HYDE integration
curl -X POST http://localhost:3000/api/discovery-engine \
  -H "Content-Type: application/json" \
  -d '{"question": "What is dharma?"}'
```

## Where to Get Credentials

### Google Cloud
- **Project ID**: [Google Cloud Console](https://console.cloud.google.com/) → Project dropdown
- **Service Account**: IAM & Admin → Service Accounts → Create/Download JSON key
- **Discovery Engine**: Enable API, create data store, get endpoint

### Perplexity AI
- **API Key**: [Perplexity Settings](https://www.perplexity.ai/settings/api) → Generate API Key

## Current Error from Terminal
```
Missing environment variables: {
  hasProjectId: false,
  hasClientEmail: false,
  hasPrivateKey: false,
  hasApiEndpoint: false
}
```

**Solution**: Add the missing Google Cloud variables to `.env.local`
