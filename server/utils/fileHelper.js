const fs = require('fs').promises;
const path = require('path');

class FileHelper {
  static async deleteFile(filePath) {
    try {
      await fs.unlink(filePath);
      console.log(`📁 File deleted: ${filePath}`);
      return true;
    } catch (error) {
      console.error(`❌ Error deleting file: ${filePath}`, error);
      return false;
    }
  }

  static async deleteFiles(filePaths) {
    const results = await Promise.allSettled(
      filePaths.map(filePath => this.deleteFile(filePath))
    );
    
    return results.map((result, index) => ({
      filePath: filePaths[index],
      success: result.status === 'fulfilled' && result.value
    }));
  }

  static getFileExtension(filename) {
    return path.extname(filename).toLowerCase();
  }

  static getFileSize(filePath) {
    try {
      const stats = fs.statSync(filePath);
      return stats.size;
    } catch (error) {
      return 0;
    }
  }

  static formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  static isValidImageType(mimetype) {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    return validTypes.includes(mimetype);
  }

  static isValidDocumentType(mimetype) {
    const validTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    return validTypes.includes(mimetype);
  }

  static generateFileName(originalName, prefix = '') {
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1E9);
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext);
    
    return `${prefix}${baseName}-${timestamp}-${random}${ext}`;
  }
}

module.exports = FileHelper;
