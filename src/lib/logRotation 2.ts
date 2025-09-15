import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const rename = promisify(fs.rename);
const unlink = promisify(fs.unlink);

interface LogFile {
  name: string;
  path: string;
  timestamp: Date;
  size: number;
}

interface LogArchive {
  id: string;
  timestamp: Date;
  logs: LogFile[];
  totalSize: number;
  createdAt: Date;
}

class LogRotationManager {
  private logsDir: string;
  private archiveDir: string;
  private maxActiveLogs: number;
  private archives: LogArchive[] = [];

  constructor(logsDir: string = 'logs', archiveDir: string = 'logs/archive', maxActiveLogs: number = 5) {
    this.logsDir = path.resolve(logsDir);
    this.archiveDir = path.resolve(archiveDir);
    this.maxActiveLogs = maxActiveLogs;

    // Ensure directories exist
    this.ensureDirectories();
  }

  private ensureDirectories(): void {
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
    if (!fs.existsSync(this.archiveDir)) {
      fs.mkdirSync(this.archiveDir, { recursive: true });
    }
  }

  private async getLogFiles(): Promise<LogFile[]> {
    try {
      const files = await readdir(this.logsDir);
      const logFiles: LogFile[] = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.logsDir, file);
          const fileStat = await stat(filePath);

          logFiles.push({
            name: file,
            path: filePath,
            timestamp: fileStat.mtime,
            size: fileStat.size
          });
        }
      }

      // Sort by timestamp (newest first)
      return logFiles.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch (error) {
      console.error('Error reading log files:', error);
      return [];
    }
  }

  private async createArchive(logFiles: LogFile[]): Promise<string> {
    const archiveId = `archive_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    const archivePath = path.join(this.archiveDir, `${archiveId}.json`);

    const archive: LogArchive = {
      id: archiveId,
      timestamp: new Date(),
      logs: logFiles,
      totalSize: logFiles.reduce((sum, log) => sum + log.size, 0),
      createdAt: new Date()
    };

    // Write archive metadata
    fs.writeFileSync(archivePath, JSON.stringify(archive, null, 2));

    // Move actual log files to archive subdirectory
    const archiveLogsDir = path.join(this.archiveDir, archiveId);
    fs.mkdirSync(archiveLogsDir, { recursive: true });

    for (const logFile of logFiles) {
      const newPath = path.join(archiveLogsDir, logFile.name);
      await rename(logFile.path, newPath);
    }

    this.archives.push(archive);
    return archiveId;
  }

  async rotateLogs(): Promise<{ archived: number; kept: number; archiveId?: string }> {
    const logFiles = await this.getLogFiles();

    if (logFiles.length <= this.maxActiveLogs) {
      return { archived: 0, kept: logFiles.length };
    }

    // Files to archive (all except the most recent maxActiveLogs)
    const filesToArchive = logFiles.slice(this.maxActiveLogs);
    const filesToKeep = logFiles.slice(0, this.maxActiveLogs);

    if (filesToArchive.length > 0) {
      const archiveId = await this.createArchive(filesToArchive);
      return {
        archived: filesToArchive.length,
        kept: filesToKeep.length,
        archiveId
      };
    }

    return { archived: 0, kept: filesToKeep.length };
  }

  async getArchivedLogs(archiveId?: string): Promise<LogArchive[]> {
    if (archiveId) {
      // Return specific archive
      const archivePath = path.join(this.archiveDir, `${archiveId}.json`);
      if (fs.existsSync(archivePath)) {
        const archiveData = JSON.parse(fs.readFileSync(archivePath, 'utf-8'));
        return [archiveData];
      }
      return [];
    }

    // Return all archives
    try {
      const archiveFiles = await readdir(this.archiveDir);
      const archives: LogArchive[] = [];

      for (const file of archiveFiles) {
        if (file.endsWith('.json') && file !== 'index.json') {
          const archivePath = path.join(this.archiveDir, file);
          const archiveData = JSON.parse(fs.readFileSync(archivePath, 'utf-8'));
          archives.push(archiveData);
        }
      }

      // Sort by creation date (newest first)
      return archives.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Error reading archives:', error);
      return [];
    }
  }

  async getLogContent(archiveId: string, logName: string): Promise<any | null> {
    const archiveLogsDir = path.join(this.archiveDir, archiveId);

    if (!fs.existsSync(archiveLogsDir)) {
      return null;
    }

    const logPath = path.join(archiveLogsDir, logName);

    if (!fs.existsSync(logPath)) {
      return null;
    }

    try {
      return JSON.parse(fs.readFileSync(logPath, 'utf-8'));
    } catch (error) {
      console.error('Error reading log content:', error);
      return null;
    }
  }

  async getActiveLogs(): Promise<LogFile[]> {
    return await this.getLogFiles();
  }

  async getStats(): Promise<{
    activeLogs: number;
    archivedLogs: number;
    totalArchives: number;
    totalArchivedSize: number;
  }> {
    const activeLogs = await this.getLogFiles();
    const archives = await this.getArchivedLogs();

    const totalArchivedSize = archives.reduce((sum, archive) => sum + archive.totalSize, 0);
    const totalArchivedLogs = archives.reduce((sum, archive) => sum + archive.logs.length, 0);

    return {
      activeLogs: activeLogs.length,
      archivedLogs: totalArchivedLogs,
      totalArchives: archives.length,
      totalArchivedSize
    };
  }

  async cleanupOldArchives(keepDays: number = 30): Promise<number> {
    const archives = await this.getArchivedLogs();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - keepDays);

    let deletedCount = 0;

    for (const archive of archives) {
      if (new Date(archive.createdAt) < cutoffDate) {
        // Delete archive directory and metadata
        const archiveDir = path.join(this.archiveDir, archive.id);
        const archiveMeta = path.join(this.archiveDir, `${archive.id}.json`);

        try {
          // Delete archive directory
          if (fs.existsSync(archiveDir)) {
            fs.rmSync(archiveDir, { recursive: true, force: true });
          }

          // Delete metadata file
          if (fs.existsSync(archiveMeta)) {
            fs.unlinkSync(archiveMeta);
          }

          deletedCount++;
        } catch (error) {
          console.error(`Error deleting archive ${archive.id}:`, error);
        }
      }
    }

    return deletedCount;
  }
}

// Export singleton instance
export const logRotationManager = new LogRotationManager();

// Utility functions for easy access
export async function rotateLogsIfNeeded(): Promise<{ archived: number; kept: number; archiveId?: string }> {
  return await logRotationManager.rotateLogs();
}

export async function getArchivedLogs(archiveId?: string): Promise<LogArchive[]> {
  return await logRotationManager.getArchivedLogs(archiveId);
}

export async function getLogContent(archiveId: string, logName: string): Promise<any | null> {
  return await logRotationManager.getLogContent(archiveId, logName);
}

export async function getLogStats(): Promise<{
  activeLogs: number;
  archivedLogs: number;
  totalArchives: number;
  totalArchivedSize: number;
}> {
  return await logRotationManager.getStats();
}

export async function cleanupOldArchives(daysToKeep: number = 30): Promise<number> {
  return await logRotationManager.cleanupOldArchives(daysToKeep);
}

export default LogRotationManager;
