# 🔍 Credential Recovery Plan - MyGurukul Spiritual AI
## =================================================

## 🚨 URGENT: Credentials Overwritten

**Issue**: Your `.env.local` file was overwritten during HYDE integration and now only contains:
```bash
HYDE_ENABLED=true
NODE_ENV=development
```

**Missing**: All your original Google Cloud and Perplexity API credentials.

## 🔍 Investigation Results

### ✅ What I Found:
1. **No environment file conflicts** - Only `.env.local` exists
2. **No backup files** - No `.env.backup`, `.env.example`, etc.
3. **Git history** - No `.env.local` files in any branches
4. **System environment** - No credentials in system environment variables

### ❌ What's Missing:
- Google Cloud Project ID
- Google Cloud Service Account Email
- Google Cloud Private Key
- Google Discovery Engine API Endpoint
- Perplexity API Key

## 🔄 Recovery Options

### Option 1: Restore from Google Cloud Console (Recommended)

#### Google Cloud Credentials:
1. **Go to [Google Cloud Console](https://console.cloud.google.com/)**
2. **Find your project**:
   - Look for projects you've worked with recently
   - Check the project dropdown in the top navigation
   - Note the Project ID

3. **Recreate Service Account**:
   - Go to "IAM & Admin" → "Service Accounts"
   - Look for existing service accounts or create new one
   - Download new JSON key file
   - Extract credentials from the JSON

4. **Get Discovery Engine Endpoint**:
   - Go to "Discovery Engine" in Google Cloud Console
   - Find your data store
   - Copy the API endpoint

#### Perplexity API Key:
1. **Go to [Perplexity AI Settings](https://www.perplexity.ai/settings/api)**
2. **Sign in to your account**
3. **Generate a new API key** or find existing one

### Option 2: Check Other Locations

#### Check these locations for your credentials:
```bash
# Check if credentials are in other config files
find ~ -name "*.json" -exec grep -l "GOOGLE_CLOUD\|PERPLEXITY" {} \; 2>/dev/null

# Check shell history for credential commands
history | grep -i "google\|perplexity\|api"

# Check if credentials are in other projects
find ~/Desktop -name ".env*" -exec grep -l "GOOGLE\|PERPLEXITY" {} \; 2>/dev/null
```

### Option 3: Browser/Password Manager
- Check your browser's saved passwords
- Check your password manager for API keys
- Look for any saved credentials in browser developer tools

## 🛠️ Immediate Recovery Steps

### Step 1: Create Backup of Current State
```bash
# Backup current .env.local
cp .env.local .env.local.backup
```

### Step 2: Restore Credentials
Once you find your credentials, update `.env.local`:

```bash
# MyGurukul Spiritual AI - Environment Configuration
# ================================================

# HYDE Configuration (keep these)
HYDE_ENABLED=true
NODE_ENV=development

# Google Cloud Discovery Engine Configuration
GOOGLE_CLOUD_PROJECT_ID=your-actual-project-id
GOOGLE_CLOUD_CLIENT_EMAIL=your-actual-service-account@your-project.iam.gserviceaccount.com
GOOGLE_CLOUD_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour actual private key here\n-----END PRIVATE KEY-----"
GOOGLE_CLOUD_LOCATION=global
GOOGLE_DISCOVERY_ENGINE_DATA_STORE_ID=your-actual-datastore-id
GOOGLE_DISCOVERY_ENGINE_ENDPOINT=https://discoveryengine.googleapis.com/v1/projects/your-actual-project-id/locations/global/collections/default_collection/dataStores/your-actual-datastore-id/servingConfigs/default_search:search

# Perplexity AI Configuration
PERPLEXITY_API_KEY=your-actual-perplexity-api-key
PERPLEXITY_API_ENDPOINT=https://api.perplexity.ai/chat/completions
ENABLE_PERPLEXITY_SEARCH=true
PERPLEXITY_SEARCH_WEIGHT=0.15

# Development Configuration
USE_MOCK_PERPLEXITY=false
```

### Step 3: Test Recovery
```bash
# Restart development server
npm run dev

# Test with a simple query
curl -X POST http://localhost:3000/api/discovery-engine \
  -H "Content-Type: application/json" \
  -d '{"question": "What is dharma?"}'
```

## 🔒 Security Recommendations

### After Recovery:
1. **Create multiple backups** of your `.env.local` file
2. **Use a password manager** to store API keys securely
3. **Document your setup** for future reference
4. **Consider using environment variable management tools**

### Backup Strategy:
```bash
# Create multiple backups
cp .env.local .env.local.backup.$(date +%Y%m%d)
cp .env.local ~/Desktop/mygurukul-credentials-backup.txt
```

## 📋 Checklist for Recovery

- [ ] Find Google Cloud Project ID
- [ ] Locate or recreate Google Cloud Service Account
- [ ] Download new Google Cloud JSON key file
- [ ] Extract credentials from JSON key
- [ ] Find Google Discovery Engine endpoint
- [ ] Get Perplexity API key
- [ ] Update `.env.local` with all credentials
- [ ] Test API connectivity
- [ ] Create backups of working configuration
- [ ] Document setup for future reference

## 🆘 If You Can't Recover Credentials

### Google Cloud:
- Create a new project in Google Cloud Console
- Set up Discovery Engine from scratch
- Create new service account and credentials

### Perplexity:
- Generate a new API key from Perplexity settings
- Update your account if needed

## 📞 Next Steps

1. **Start with Google Cloud Console** - This is most likely where your credentials are
2. **Check your browser history** - Look for any saved API endpoints or project IDs
3. **Contact support** - If you have access to Google Cloud support, they can help
4. **Create new credentials** - As a last resort, create fresh credentials

## 🎯 Priority Actions

1. **IMMEDIATE**: Check Google Cloud Console for your project
2. **HIGH**: Recreate service account if needed
3. **MEDIUM**: Get Perplexity API key
4. **LOW**: Set up backup strategy

---

**Remember**: Your HYDE integration is complete and ready - we just need to restore your API credentials to test it!
