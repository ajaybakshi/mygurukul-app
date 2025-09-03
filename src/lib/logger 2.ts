import fs from 'fs'
import path from 'path'
import { rotateLogsIfNeeded } from './logRotation'

interface LogData {
  timestamp: string
  requestBody: any
  response: any
  sessionId?: string | null
  hybridSearch?: {
    enabled: boolean
    weights: { perplexity: number; discovery: number }
    sources: string[]
    hyde?: {
      enabled: boolean
      success: boolean
      termCount: number
      terms: string[]
      confidence: number
      processingTime: number
      abTesting?: {
        enabled: boolean
        rolloutPercentage: number
        shouldEnable: boolean
        userHash: number
        hashPercentage: number
      }
    }
  }
  processingTime?: number
  errors?: string[]
}

export async function writeApiLog(logData: LogData): Promise<void> {
  try {
    console.log('📝 Starting API logging...')
    
    // Only log in development mode
    if (process.env.NODE_ENV !== 'development') {
      console.log('📝 Logging disabled in production mode')
      return
    }

    // Ensure logs directory exists
    const logsDir = path.join(process.cwd(), 'logs')
    if (!fs.existsSync(logsDir)) {
      console.log('📁 Creating logs directory...')
      fs.mkdirSync(logsDir, { recursive: true })
    }

    // Create filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `api-call-${timestamp}.json`
    const filepath = path.join(logsDir, filename)

    console.log('📄 Writing log file:', filename)

    // Write log data as formatted JSON
    const logContent = JSON.stringify(logData, null, 2)
    await fs.promises.writeFile(filepath, logContent, 'utf8')

    console.log('✅ Log write completed:', filename)

    // Rotate logs if needed (keep only last 5)
    try {
      const rotationResult = await rotateLogsIfNeeded()
      if (rotationResult.archived > 0) {
        console.log(`🔄 Log rotation completed: ${rotationResult.archived} archived, ${rotationResult.kept} kept`)
        if (rotationResult.archiveId) {
          console.log(`📦 Archive created: ${rotationResult.archiveId}`)
        }
      }
    } catch (rotationError) {
      console.error('⚠️ Log rotation failed:', rotationError)
      // Don't throw error to avoid breaking API responses
    }
  } catch (error) {
    console.error('❌ Error writing API log:', error)
    // Don't throw error to avoid breaking API responses
  }
}

export function createLogData(
  requestBody: any,
  response: any,
  sessionId?: string | null,
  hybridSearch?: any,
  processingTime?: number,
  errors?: string[]
): LogData {
  return {
    timestamp: new Date().toISOString(),
    requestBody,
    response,
    sessionId,
    hybridSearch,
    processingTime,
    errors
  }
}
