import { GoogleAuth } from 'google-auth-library'

// TypeScript interfaces for Google session management
export interface GoogleSessionRequest {
  displayName?: string;
  userPseudoId?: string;
}

export interface GoogleSessionResponse {
  name: string;
  displayName?: string;
  userPseudoId?: string;
  createTime: string;
  updateTime: string;
}

export interface SessionManagerConfig {
  projectId: string;
  location: string;
  dataStoreId: string;
  apiEndpoint: string;
}

export interface SessionCreationResult {
  success: boolean;
  sessionId?: string;
  sessionPath?: string;
  error?: string;
}

// Error class for session management
export class SessionManagerError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'SessionManagerError';
  }
}

/**
 * Get session manager configuration from environment variables
 */
export function getSessionManagerConfig(): SessionManagerConfig {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  const location = process.env.GOOGLE_CLOUD_LOCATION || 'global';
  const dataStoreId = process.env.GOOGLE_DISCOVERY_ENGINE_DATA_STORE_ID;
  const apiEndpoint = process.env.GOOGLE_DISCOVERY_ENGINE_ENDPOINT;

  if (!projectId || !dataStoreId || !apiEndpoint) {
    throw new SessionManagerError(
      'Missing required environment variables for session management',
      'CONFIG_ERROR'
    );
  }

  return {
    projectId,
    location,
    dataStoreId,
    apiEndpoint
  };
}

/**
 * Build the full session path for Google API calls
 * Format: projects/{project}/locations/{location}/collections/{collection}/dataStores/{dataStore}/sessions/{session}
 */
export function buildSessionPath(sessionId: string): string {
  const config = getSessionManagerConfig();
  
  return `projects/${config.projectId}/locations/${config.location}/collections/default_collection/dataStores/${config.dataStoreId}/sessions/${sessionId}`;
}

/**
 * Extract session ID from Google's session response
 * Google returns: projects/{project}/locations/{location}/collections/{collection}/dataStores/{dataStore}/sessions/{sessionId}
 * We extract: {sessionId}
 */
export function extractSessionId(sessionResponse: GoogleSessionResponse): string {
  const sessionPath = sessionResponse.name;
  const sessionId = sessionPath.split('/').pop();
  
  if (!sessionId) {
    throw new SessionManagerError(
      'Invalid session response format - could not extract session ID',
      'EXTRACTION_ERROR'
    );
  }
  
  return sessionId;
}

/**
 * Create a new Google session using the Discovery Engine API
 * Follows Google's documented session creation format exactly
 */
export async function createGoogleSession(
  displayName?: string,
  userPseudoId?: string
): Promise<SessionCreationResult> {
  try {
    const config = getSessionManagerConfig();
    
    // Get authentication credentials (same as existing Discovery Engine calls)
    const clientEmail = process.env.GOOGLE_CLOUD_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_CLOUD_PRIVATE_KEY;

    if (!clientEmail || !privateKey) {
      throw new SessionManagerError(
        'Missing Google Cloud credentials for session creation',
        'AUTH_ERROR'
      );
    }

    // Construct credentials object (same as existing implementation)
    const credentials = {
      type: 'service_account',
      project_id: config.projectId,
      private_key_id: 'env-provided',
      private_key: privateKey.replace(/\\n/g, '\n'),
      client_email: clientEmail,
      client_id: 'env-provided',
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(clientEmail)}`,
      universe_domain: 'googleapis.com'
    };

    // Initialize Google Auth
    const auth = new GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });

    // Get access token
    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();

    // Build session creation endpoint
    const sessionEndpoint = `https://discoveryengine.googleapis.com/v1/projects/${config.projectId}/locations/${config.location}/collections/default_collection/dataStores/${config.dataStoreId}/sessions`;

    // Prepare session request body (following Google's documentation exactly)
    const sessionRequestBody: GoogleSessionRequest = {};
    
    if (displayName) {
      sessionRequestBody.displayName = displayName;
    }
    
    if (userPseudoId) {
      sessionRequestBody.userPseudoId = userPseudoId;
    }

    console.log('Creating Google session with endpoint:', sessionEndpoint);
    console.log('Session request body:', JSON.stringify(sessionRequestBody, null, 2));

    // Make session creation request
    const response = await fetch(sessionEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken.token}`,
      },
      body: JSON.stringify(sessionRequestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log('Session creation failed:', response.status, errorText);
      
      let errorMessage = `Session creation failed: ${response.status} ${response.statusText}`;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error) {
          errorMessage = `Google Session Error: ${errorJson.error.message || errorJson.error}`;
        }
      } catch (e) {
        errorMessage = `Session Error: ${errorText}`;
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }

    const sessionData: GoogleSessionResponse = await response.json();
    console.log('Session created successfully:', JSON.stringify(sessionData, null, 2));

    // Extract session ID from the response
    const sessionId = extractSessionId(sessionData);
    const sessionPath = buildSessionPath(sessionId);

    return {
      success: true,
      sessionId,
      sessionPath
    };

  } catch (error) {
    console.log('Session creation error:', error);
    
    if (error instanceof SessionManagerError) {
      return {
        success: false,
        error: error.message
      };
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown session creation error'
    };
  }
}

/**
 * Utility function to generate a unique user pseudo ID
 * This helps Google track user sessions across requests
 */
export function generateUserPseudoId(): string {
  // Generate a simple pseudo ID for session tracking
  // In production, this could be based on user authentication
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Main function to create a session with fallback handling
 * Returns session path for use in answer API calls
 */
export async function createSessionWithFallback(
  displayName?: string,
  userPseudoId?: string
): Promise<string | null> {
  try {
    const result = await createGoogleSession(displayName, userPseudoId);
    
    if (result.success && result.sessionPath) {
      console.log('✅ Google session created successfully:', result.sessionPath);
      return result.sessionPath;
    } else {
      console.log('⚠️ Session creation failed, continuing without session:', result.error);
      return null;
    }
  } catch (error) {
    console.log('⚠️ Session creation error, continuing without session:', error);
    return null;
  }
}