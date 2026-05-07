const fs = require('fs');
const zlib = require('zlib');
const { promisify } = require('util');

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

/**
 * Yedekleme servisi
 *
 * SQLite veritabanını gzip ile sıkıştırıp tek bir .mailbackup dosyası halinde dışa aktarır.
 * İçe aktarma sırasında mevcut DB'nin üzerine yazılır.
 *
 * Format: [4 byte magic 'CMBK'][4 byte versiyon][n byte gzipli SQLite]
 */
class BackupService {
  constructor(dbPath) {
    this.dbPath = dbPath;
  }

  async exportTo(outPath) {
    const dbBuffer = fs.readFileSync(this.dbPath);
    const compressed = await gzip(dbBuffer);

    const header = Buffer.alloc(8);
    header.write('CMBK', 0, 'ascii');
    header.writeUInt32LE(1, 4); // version 1

    const final = Buffer.concat([header, compressed]);
    fs.writeFileSync(outPath, final);
    return { size: final.length, original: dbBuffer.length };
  }

  async importFrom(inPath) {
    const fileBuffer = fs.readFileSync(inPath);

    if (fileBuffer.length < 8) throw new Error('Yedek dosyası geçersiz (çok küçük)');
    const magic = fileBuffer.slice(0, 4).toString('ascii');
    if (magic !== 'CMBK') throw new Error('Yedek dosyası geçersiz (magic eşleşmiyor)');

    const version = fileBuffer.readUInt32LE(4);
    if (version !== 1) throw new Error(`Yedek dosyası bilinmeyen versiyon: ${version}`);

    const compressed = fileBuffer.slice(8);
    const decompressed = await gunzip(compressed);

    if (fs.existsSync(this.dbPath)) {
      const safetyBak = this.dbPath + '.before-restore-' + Date.now();
      fs.copyFileSync(this.dbPath, safetyBak);
    }

    fs.writeFileSync(this.dbPath, decompressed);
    return { size: decompressed.length };
  }
}

module.exports = BackupService;
