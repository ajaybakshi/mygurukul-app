# HYDE Integration Test Plan - MyGurukul Spiritual AI
## ================================================

## Overview
This document outlines the comprehensive testing plan for the HYDE (Hypothetical Document Embeddings) integration in the MyGurukul spiritual AI system.

## Test Environment Setup
- **Environment Variable**: `HYDE_ENABLED=true` in `.env.local`
- **Target**: Development server (`npm run dev`)
- **Focus**: Query processing pipeline with HYDE enhancement

## Test Scenarios

### 1. HYDE Enabled vs Disabled Testing
**Objective**: Verify HYDE toggle functionality

**Test Cases**:
- [ ] Set `HYDE_ENABLED=true` → Test query processing
- [ ] Set `HYDE_ENABLED=false` → Test query processing
- [ ] Verify graceful fallback when HYDE is disabled
- [ ] Confirm Sanskrit enhancement still works without HYDE

**Expected Results**:
- HYDE enabled: Enhanced queries with both HYDE and Sanskrit terms
- HYDE disabled: Enhanced queries with Sanskrit terms only
- No errors in either mode

### 2. Spiritual Query Types Testing
**Objective**: Test HYDE with various spiritual question types

**Test Queries**:
- [ ] **Dharma Guidance**: "What is dharma?"
- [ ] **Meditation Practice**: "How should I meditate?"
- [ ] **Life Challenges**: "How to deal with suffering?"
- [ ] **Philosophical Concepts**: "What is karma?"
- [ ] **Specific Texts**: "Tell me about the Bhagavad Gita"
- [ ] **Modern Applications**: "How to apply spiritual wisdom in daily life?"

**Expected Results**:
- HYDE generates relevant hypothetical documents
- Extracted terms include spiritual concepts
- Enhanced queries improve corpus retrieval
- Maintains 100% corpus purity

### 3. Logging Verification
**Objective**: Verify HYDE data is captured in logs

**Test Points**:
- [ ] Check console logs for HYDE operation details
- [ ] Verify HYDE metadata in API response logs
- [ ] Confirm processing time tracking
- [ ] Validate confidence scoring logs
- [ ] Check error logging when HYDE fails

**Expected Log Format**:
```json
{
  "hyde": {
    "enabled": true,
    "success": true,
    "termCount": 5,
    "terms": ["dharma", "righteousness", "duty", "moral", "law"],
    "confidence": 0.8,
    "processingTime": 2500
  }
}
```

### 4. Error Handling Verification
**Objective**: Test graceful degradation and error handling

**Test Scenarios**:
- [ ] **HYDE Timeout**: Simulate 10-second timeout
- [ ] **Perplexity API Failure**: Disconnect from Perplexity
- [ ] **Invalid Response**: Mock malformed HYDE response
- [ ] **Network Issues**: Simulate network failures

**Expected Behavior**:
- System continues with Sanskrit enhancement only
- No user-facing errors
- Comprehensive error logging
- Graceful fallback to existing functionality

### 5. Performance Testing
**Objective**: Verify HYDE doesn't significantly impact performance

**Metrics to Track**:
- [ ] Total query processing time
- [ ] HYDE generation time (should be < 10 seconds)
- [ ] Memory usage during HYDE operations
- [ ] API response times with/without HYDE

**Acceptable Thresholds**:
- HYDE generation: < 10 seconds
- Total processing: < 30 seconds
- No memory leaks
- Response time increase: < 50%

### 6. Corpus Purity Verification
**Objective**: Ensure 100% corpus purity is maintained

**Verification Points**:
- [ ] All responses come from Discovery Engine corpus
- [ ] No hypothetical content in user-facing responses
- [ ] HYDE only affects query enhancement
- [ ] Citations point to actual corpus documents

**Test Method**:
- Compare responses with HYDE enabled vs disabled
- Verify all citations reference corpus documents
- Check that no HYDE-generated content appears in responses

## Test Execution Steps

### Step 1: Environment Setup
```bash
# Set HYDE enabled
echo "HYDE_ENABLED=true" > .env.local

# Start development server
npm run dev
```

### Step 2: Basic Functionality Test
```bash
# Test with simple query
curl -X POST http://localhost:3000/api/discovery-engine \
  -H "Content-Type: application/json" \
  -d '{"question": "What is dharma?"}'
```

### Step 3: Log Analysis
- Check console output for HYDE logs
- Verify HYDE operation details
- Confirm term extraction and combination

### Step 4: A/B Testing
```bash
# Test with HYDE disabled
echo "HYDE_ENABLED=false" > .env.local
# Restart server and test same query
```

### Step 5: Error Simulation
- Temporarily break Perplexity API connection
- Test graceful fallback behavior
- Verify error logging

## Success Criteria

### ✅ Integration Success
- [ ] HYDE service imports correctly
- [ ] No TypeScript compilation errors
- [ ] Environment toggle works
- [ ] Query enhancement combines HYDE + Sanskrit terms

### ✅ Functionality Success
- [ ] HYDE generates hypothetical documents
- [ ] Term extraction works correctly
- [ ] Confidence scoring is accurate
- [ ] Enhanced queries improve retrieval

### ✅ Quality Success
- [ ] 100% corpus purity maintained
- [ ] Graceful error handling
- [ ] Comprehensive logging
- [ ] Performance within acceptable limits

### ✅ User Experience Success
- [ ] No user-facing errors
- [ ] Improved response quality
- [ ] Faster response times (or acceptable trade-off)
- [ ] Clean, spiritual guidance responses

## Troubleshooting Guide

### Common Issues

**1. HYDE Not Running**
- Check `HYDE_ENABLED=true` in `.env.local`
- Verify environment variable is loaded
- Check console for HYDE initialization logs

**2. TypeScript Errors**
- Update `tsconfig.json` target to `es2020`
- Check import paths are correct
- Verify all dependencies are installed

**3. Perplexity API Issues**
- Check `PERPLEXITY_API_KEY` is set
- Verify API endpoint is accessible
- Check network connectivity

**4. Performance Issues**
- Monitor HYDE processing time
- Check for memory leaks
- Verify timeout settings

### Debug Commands
```bash
# Check environment variables
echo $HYDE_ENABLED

# Test TypeScript compilation
npx tsc --noEmit

# Check build process
npm run build

# Monitor logs
tail -f logs/api-call-*.json
```

## Test Results Template

### Test Run: [DATE]
**Environment**: Development
**HYDE Status**: [Enabled/Disabled]
**Test Query**: [Query used]

**Results**:
- [ ] HYDE Generation: [Success/Failed]
- [ ] Term Extraction: [Success/Failed]
- [ ] Query Enhancement: [Success/Failed]
- [ ] Response Quality: [Improved/Same/Worse]
- [ ] Processing Time: [Acceptable/Slow]
- [ ] Error Handling: [Working/Issues]

**Logs Captured**: [Yes/No]
**Issues Found**: [List any issues]
**Recommendations**: [Next steps]

---

## Next Steps After Testing

1. **Performance Optimization**: If needed, optimize HYDE processing
2. **A/B Testing**: Compare HYDE vs non-HYDE performance
3. **User Feedback**: Gather feedback on response quality
4. **Production Deployment**: Deploy with monitoring
5. **Continuous Monitoring**: Track HYDE effectiveness over time
