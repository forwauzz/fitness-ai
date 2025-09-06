// Manual backup script
import fs from 'fs';
import path from 'path';
import dayjs from 'dayjs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const createBackup = () => {
  try {
    const timestamp = dayjs().format('YYYY-MM-DD_HH-mm-ss');
    const backupDir = path.join(process.cwd(), 'backups');
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const filesToBackup = [
      { source: './data.csv', name: 'data' },
      { source: './profile.json', name: 'profile' },
      { source: './models/model_xgb.pkl', name: 'model' },
      { source: './models/metadata.json', name: 'metadata' }
    ];
    
    const backupResults = [];
    
    filesToBackup.forEach(({ source, name }) => {
      if (fs.existsSync(source)) {
        const backupPath = path.join(backupDir, `${name}_${timestamp}${path.extname(source)}`);
        fs.copyFileSync(source, backupPath);
        backupResults.push({ file: name, path: backupPath, success: true });
        console.log(`✅ Backed up ${name}: ${backupPath}`);
      } else {
        backupResults.push({ file: name, success: false, reason: 'File not found' });
        console.log(`⚠️  Skipped ${name}: File not found`);
      }
    });
    
    // Create backup manifest
    const manifest = {
      timestamp: new Date().toISOString(),
      backupId: timestamp,
      files: backupResults
    };
    
    const manifestPath = path.join(backupDir, `manifest_${timestamp}.json`);
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    
    console.log(`\n🎉 Backup completed successfully!`);
    console.log(`📁 Backup directory: ${backupDir}`);
    console.log(`📋 Manifest: ${manifestPath}`);
    
    return manifest;
    
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    process.exit(1);
  }
};

// Run backup
createBackup();
