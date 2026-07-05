import RNFS from 'react-native-fs';
import {Platform} from 'react-native';
import {getAllData} from '../watermelondb/services';
import {CURRENT_EXPORT_VERSION} from '../backend/export/format';
import {generateUniqueKey} from './dataUtils';
import {getTimestamp} from './dateUtils';

const BACKUP_DIR = Platform.select({
  ios: `${RNFS.DocumentDirectoryPath}/zero_backups`,
  default: `${RNFS.DocumentDirectoryPath}/zero_backups`,
});

const MAX_BACKUPS = 3;

/**
 * Creates a silent backup of all user data before destructive operations.
 * Keeps a rolling window of MAX_BACKUPS files and removes older ones.
 * Failures are swallowed — this must never block the caller.
 */
export const createAutoBackup = async (): Promise<boolean> => {
  try {
    const data = await getAllData();
    if (!data || data.users.length === 0) {
      return false;
    }

    const exists = await RNFS.exists(BACKUP_DIR);
    if (!exists) {
      await RNFS.mkdir(BACKUP_DIR);
    }

    const timestamp = getTimestamp();
    const fileName = `zero_backup_v${CURRENT_EXPORT_VERSION}_${timestamp}.json`;
    const filePath = `${BACKUP_DIR}/${fileName}`;

    const envelope = {
      key: generateUniqueKey(),
      version: CURRENT_EXPORT_VERSION,
      data,
    };
    await RNFS.writeFile(filePath, JSON.stringify(envelope), 'utf8');

    await pruneOldBackups();
    return true;
  } catch {
    return false;
  }
};

const pruneOldBackups = async (): Promise<void> => {
  try {
    const files = await RNFS.readDir(BACKUP_DIR);
    const backupFiles = files
      .filter(f => f.name.startsWith('zero_backup_') && f.name.endsWith('.json'))
      .sort((a, b) => (b.mtime?.getTime() ?? 0) - (a.mtime?.getTime() ?? 0));

    if (backupFiles.length > MAX_BACKUPS) {
      const toDelete = backupFiles.slice(MAX_BACKUPS);
      await Promise.all(toDelete.map(f => RNFS.unlink(f.path)));
    }
  } catch {
    // Non-critical
  }
};
