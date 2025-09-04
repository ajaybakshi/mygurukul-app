#!/usr/bin/env node

// LOG MANAGEMENT SCRIPT
// Usage: node manage-logs.js [command] [options]

const {
  getLogStats,
  getArchivedLogs,
  rotateLogsIfNeeded,
  cleanupOldArchives,
  getLogContent
} = require('./src/lib/logRotation.ts');

async function showStats() {
  console.log('📊 LOG STATISTICS');
  console.log('=================');

  try {
    const stats = await getLogStats();
    console.log(`Active Logs: ${stats.activeLogs}`);
    console.log(`Archived Logs: ${stats.archivedLogs}`);
    console.log(`Total Archives: ${stats.totalArchives}`);
    console.log(`Total Archived Size: ${(stats.totalArchivedSize / 1024 / 1024).toFixed(2)} MB`);
  } catch (error) {
    console.error('Error getting stats:', error.message);
  }
}

async function showArchives() {
  console.log('📦 ARCHIVED LOGS');
  console.log('================');

  try {
    const archives = await getArchivedLogs();

    if (archives.length === 0) {
      console.log('No archived logs found.');
      return;
    }

    archives.forEach((archive, index) => {
      console.log(`${index + 1}. ${archive.id}`);
      console.log(`   Created: ${new Date(archive.createdAt).toLocaleString()}`);
      console.log(`   Logs: ${archive.logs.length}`);
      console.log(`   Size: ${(archive.totalSize / 1024).toFixed(2)} KB`);
      console.log('');
    });
  } catch (error) {
    console.error('Error getting archives:', error.message);
  }
}

async function rotateLogs() {
  console.log('🔄 ROTATING LOGS');
  console.log('================');

  try {
    const result = await rotateLogsIfNeeded();

    if (result.archived > 0) {
      console.log(`✅ Rotation completed:`);
      console.log(`   Archived: ${result.archived} logs`);
      console.log(`   Kept: ${result.kept} logs`);
      if (result.archiveId) {
        console.log(`   Archive ID: ${result.archiveId}`);
      }
    } else {
      console.log(`ℹ️  No rotation needed. Active logs: ${result.kept}`);
    }
  } catch (error) {
    console.error('Error rotating logs:', error.message);
  }
}

async function cleanupArchives(daysToKeep = 30) {
  console.log(`🧹 CLEANUP ARCHIVES (keeping ${daysToKeep} days)`);
  console.log('================================================');

  try {
    const deletedCount = await cleanupOldArchives(daysToKeep);
    console.log(`✅ Cleanup completed: ${deletedCount} old archives deleted`);
  } catch (error) {
    console.error('Error cleaning up archives:', error.message);
  }
}

async function showArchiveContent(archiveId) {
  console.log(`📄 ARCHIVE CONTENT: ${archiveId}`);
  console.log('==================================');

  try {
    const archives = await getArchivedLogs(archiveId);
    if (archives.length === 0) {
      console.log('Archive not found.');
      return;
    }

    const archive = archives[0];
    console.log(`Archive: ${archive.id}`);
    console.log(`Created: ${new Date(archive.createdAt).toLocaleString()}`);
    console.log(`Total Logs: ${archive.logs.length}`);
    console.log('');

    archive.logs.forEach((log, index) => {
      console.log(`${index + 1}. ${log.name}`);
      console.log(`   Size: ${(log.size / 1024).toFixed(2)} KB`);
      console.log(`   Modified: ${log.timestamp.toLocaleString()}`);
      console.log('');
    });
  } catch (error) {
    console.error('Error showing archive content:', error.message);
  }
}

async function showLogContent(archiveId, logName) {
  console.log(`📋 LOG CONTENT: ${archiveId}/${logName}`);
  console.log('==========================================');

  try {
    const content = await getLogContent(archiveId, logName);
    if (!content) {
      console.log('Log not found.');
      return;
    }

    console.log(JSON.stringify(content, null, 2));
  } catch (error) {
    console.error('Error showing log content:', error.message);
  }
}

// Main CLI handler
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'stats':
      await showStats();
      break;

    case 'archives':
      await showArchives();
      break;

    case 'rotate':
      await rotateLogs();
      break;

    case 'cleanup':
      const days = args[1] ? parseInt(args[1]) : 30;
      await cleanupArchives(days);
      break;

    case 'archive':
      const archiveId = args[1];
      if (!archiveId) {
        console.error('Usage: node manage-logs.js archive <archiveId>');
        process.exit(1);
      }
      await showArchiveContent(archiveId);
      break;

    case 'log':
      const archiveId2 = args[1];
      const logName = args[2];
      if (!archiveId2 || !logName) {
        console.error('Usage: node manage-logs.js log <archiveId> <logName>');
        process.exit(1);
      }
      await showLogContent(archiveId2, logName);
      break;

    case 'help':
    default:
      console.log('LOG MANAGEMENT SCRIPT');
      console.log('=====================');
      console.log('');
      console.log('Commands:');
      console.log('  stats              Show log statistics');
      console.log('  archives           List all archived logs');
      console.log('  rotate             Rotate logs (archive old ones)');
      console.log('  cleanup [days]     Clean up archives older than N days (default: 30)');
      console.log('  archive <id>       Show contents of specific archive');
      console.log('  log <id> <name>    Show content of specific log file');
      console.log('  help               Show this help');
      console.log('');
      console.log('Examples:');
      console.log('  node manage-logs.js stats');
      console.log('  node manage-logs.js rotate');
      console.log('  node manage-logs.js cleanup 7');
      console.log('  node manage-logs.js archive archive_1234567890_abc123');
      break;
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  showStats,
  showArchives,
  rotateLogs,
  cleanupArchives,
  showArchiveContent,
  showLogContent
};
