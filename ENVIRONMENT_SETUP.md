# Environment Setup Guide - MyGurukul Spiritual AI with HYDE
## ========================================================

## Overview
This guide will help you configure all the necessary environment variables to test the HYDE integration in the MyGurukul spiritual AI system.

## Current Environment Status
Based on the terminal output, your current `.env.local` file only contains:
```
HYDE_ENABLED=true
NODE_ENV=development
```

You need to add the missing Google Cloud and Perplexity API credentials.

## Required Environment Variables

### 1. HYDE Configuration (✅ Already Set)
```bash
HYDE_ENABLED=true
NODE_ENV=development
```

### 2. Google Cloud Discovery Engine (❌ Missing)
```bash
# Google Cloud Project ID
GOOGLE_CLOUD_PROJECT_ID=your-project-id

# Google Cloud Service Account Email
GOOGLE_CLOUD_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com

# Google Cloud Service Account Private Key
GOOGLE_CLOUD_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key content here\n-----END PRIVATE KEY-----"

# Google Discovery Engine API Endpoint
GOOGLE_DISCOVERY_ENGINE_ENDPOINT=https://discoveryengine.googleapis.com/v1/projects/your-project-id/locations/global/collections/default_collection/dataStores/your-datastore-id/servingConfigs/default_search:search
```

### 3. Perplexity AI (❌ Missing)
```bash
# Perplexity API Key
PERPLEXITY_API_KEY=your-perplexity-api-key

# Enable Perplexity Search
ENABLE_PERPLEXITY_SEARCH=true

# Perplexity Search Weight (with HYDE integration)
PERPLEXITY_SEARCH_WEIGHT=0.15
```

### 4. Optional Configuration
```bash
# Google Cloud Location (optional, defaults to 'global')
GOOGLE_CLOUD_LOCATION=global

# Google Discovery Engine Data Store ID (optional)
GOOGLE_DISCOVERY_ENGINE_DATA_STORE_ID=your-datastore-id

# Use Mock Perplexity (for testing without API calls)
USE_MOCK_PERPLEXITY=false
```

## Complete .env.local Template

Create or update your `.env.local` file with this complete template:

```bash
# MyGurukul Spiritual AI - Environment Configuration
# ================================================

# HYDE Configuration
HYDE_ENABLED=true
NODE_ENV=development

# Google Cloud Discovery Engine Configuration
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_CLOUD_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key content here\n-----END PRIVATE KEY-----"
GOOGLE_CLOUD_LOCATION=global
GOOGLE_DISCOVERY_ENGINE_DATA_STORE_ID=your-datastore-id
GOOGLE_DISCOVERY_ENGINE_ENDPOINT=https://discoveryengine.googleapis.com/v1/projects/your-project-id/locations/global/collections/default_collection/dataStores/your-datastore-id/servingConfigs/default_search:search

# Perplexity AI Configuration
PERPLEXITY_API_KEY=your-perplexity-api-key
PERPLEXITY_API_ENDPOINT=https://api.perplexity.ai/chat/completions
ENABLE_PERPLEXITY_SEARCH=true
PERPLEXITY_SEARCH_WEIGHT=0.15

# Development Configuration
USE_MOCK_PERPLEXITY=false
```

## Setup Instructions

### Step 1: Google Cloud Setup

1. **Create/Select Google Cloud Project**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Note your Project ID

2. **Enable Discovery Engine API**:
   - In Google Cloud Console, go to "APIs & Services" > "Library"
   - Search for "Discovery Engine API"
   - Click "Enable"

3. **Create Service Account**:
   - Go to "IAM & Admin" > "Service Accounts"
   - Click "Create Service Account"
   - Give it a name like "mygurukul-discovery-engine"
   - Grant "Discovery Engine Admin" role
   - Click "Create and Continue"

4. **Download Service Account Key**:
   - Click on your service account
   - Go to "Keys" tab
   - Click "Add Key" > "Create New Key"
   - Choose JSON format
   - Download the file

5. **Extract Credentials**:
   - Open the downloaded JSON file
   - Copy the values for:
     - `project_id` → `GOOGLE_CLOUD_PROJECT_ID`
     - `client_email` → `GOOGLE_CLOUD_CLIENT_EMAIL`
     - `private_key` → `GOOGLE_CLOUD_PRIVATE_KEY`

6. **Set up Discovery Engine Data Store**:
   - Go to Discovery Engine in Google Cloud Console
   - Create a data store with your sacred texts
   - Note the data store ID for `GOOGLE_DISCOVERY_ENGINE_DATA_STORE_ID`
   - Get the API endpoint for `GOOGLE_DISCOVERY_ENGINE_ENDPOINT`

### Step 2: Perplexity AI Setup

1. **Get Perplexity API Key**:
   - Go to [Perplexity AI Settings](https://www.perplexity.ai/settings/api)
   - Sign in or create account
   - Click "Generate API Key"
   - Copy the key for `PERPLEXITY_API_KEY`

### Step 3: Update .env.local

1. **Edit your .env.local file**:
   ```bash
   nano .env.local
   # or
   code .env.local
   ```

2. **Replace placeholder values** with your actual credentials

3. **Save the file**

### Step 4: Test Configuration

1. **Restart development server**:
   ```bash
   npm run dev
   ```

2. **Test HYDE integration**:
   ```bash
   curl -X POST http://localhost:3000/api/discovery-engine \
     -H "Content-Type: application/json" \
     -d '{"question": "What is dharma?"}'
   ```

3. **Check console logs** for HYDE operation details

## Troubleshooting

### Common Issues

1. **"Missing environment variables" error**:
   - Check that all required variables are set in `.env.local`
   - Make sure there are no typos in variable names
   - Restart the development server after changes

2. **"Google Cloud credentials not configured" error**:
   - Verify `GOOGLE_CLOUD_PROJECT_ID`, `GOOGLE_CLOUD_CLIENT_EMAIL`, and `GOOGLE_CLOUD_PRIVATE_KEY`
   - Check that the service account has proper permissions
   - Ensure Discovery Engine API is enabled

3. **"Perplexity API key not configured" error**:
   - Verify `PERPLEXITY_API_KEY` is set correctly
   - Check that `ENABLE_PERPLEXITY_SEARCH=true`

4. **HYDE not running**:
   - Check that `HYDE_ENABLED=true`
   - Verify Perplexity API is working
   - Check console logs for HYDE operation details

### Debug Commands

```bash
# Check environment variables
echo $HYDE_ENABLED
echo $GOOGLE_CLOUD_PROJECT_ID

# Test TypeScript compilation
npx tsc --noEmit

# Check build process
npm run build

# Monitor logs
tail -f logs/api-call-*.json
```

## Security Notes

- **Never commit `.env.local` to version control** (it's already in `.gitignore`)
- **Keep your API keys secure** and don't share them
- **Use different keys for development and production**
- **Rotate keys regularly** for security

## Next Steps

Once you have the environment variables configured:

1. **Test HYDE Integration**: Run the test plan from `HYDE_TEST_PLAN.md`
2. **Verify Logging**: Check that HYDE operations are logged correctly
3. **Performance Testing**: Monitor processing times with HYDE enabled/disabled
4. **A/B Testing**: Compare response quality with and without HYDE

## Support

If you encounter issues:
1. Check the console logs for detailed error messages
2. Verify all environment variables are set correctly
3. Test each API separately (Google Cloud, Perplexity)
4. Refer to the troubleshooting section above
