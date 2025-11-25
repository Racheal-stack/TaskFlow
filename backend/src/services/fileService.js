const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');

class FileService {
  constructor() {
    this.uploadDir = path.join(__dirname, '../../public/uploads');
    this.maxFileSize = process.env.MAX_FILE_SIZE || 10 * 1024 * 1024; // 10MB
    this.allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    this.allowedDocTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    this.ensureDirectoryExists();
  }

  async ensureDirectoryExists() {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
      console.log('📁 Upload directory created');
    }
  }

  // Multer configuration for file uploads
  getMulterConfig(options = {}) {
    const storage = multer.diskStorage({
      destination: async (req, file, cb) => {
        const subfolder = options.subfolder || 'general';
        const uploadPath = path.join(this.uploadDir, subfolder);
        
        try {
          await fs.access(uploadPath);
        } catch {
          await fs.mkdir(uploadPath, { recursive: true });
        }
        
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const uniqueId = uuidv4();
        const extension = path.extname(file.originalname);
        const filename = `${uniqueId}${extension}`;
        cb(null, filename);
      }
    });

    const fileFilter = (req, file, cb) => {
      const allowedTypes = [...this.allowedImageTypes, ...this.allowedDocTypes];
      
      if (options.imagesOnly && !this.allowedImageTypes.includes(file.mimetype)) {
        return cb(new Error('Only image files are allowed'), false);
      }
      
      if (!options.imagesOnly && !allowedTypes.includes(file.mimetype)) {
        return cb(new Error('File type not allowed'), false);
      }
      
      cb(null, true);
    };

    return multer({
      storage,
      fileFilter,
      limits: {
        fileSize: options.maxSize || this.maxFileSize
      }
    });
  }

  // Avatar upload configuration
  getAvatarUpload() {
    return this.getMulterConfig({
      subfolder: 'avatars',
      imagesOnly: true,
      maxSize: 2 * 1024 * 1024 // 2MB for avatars
    }).single('avatar');
  }

  // Project file upload configuration
  getProjectFileUpload() {
    return this.getMulterConfig({
      subfolder: 'projects',
      maxSize: this.maxFileSize
    }).array('files', 5); // Max 5 files
  }

  // Task attachment upload configuration
  getTaskAttachmentUpload() {
    return this.getMulterConfig({
      subfolder: 'tasks',
      maxSize: this.maxFileSize
    }).array('attachments', 3); // Max 3 attachments
  }

  // Process and optimize images
  async processImage(filePath, options = {}) {
    try {
      const {
        width = 800,
        height = 600,
        quality = 80,
        format = 'jpeg'
      } = options;

      const processedPath = filePath.replace(/\.[^.]+$/, `_processed.${format}`);
      
      await sharp(filePath)
        .resize(width, height, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: format === 'jpeg' ? quality : undefined })
        .png({ quality: format === 'png' ? quality : undefined })
        .toFile(processedPath);

      // Remove original file
      await fs.unlink(filePath);
      
      return processedPath;
    } catch (error) {
      console.error('Image processing failed:', error);
      return filePath; // Return original if processing fails
    }
  }

  // Generate avatar thumbnails
  async processAvatar(filePath) {
    const thumbnailPath = filePath.replace(/\.[^.]+$/, '_thumb.jpg');
    
    try {
      // Create thumbnail (150x150)
      await sharp(filePath)
        .resize(150, 150, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 90 })
        .toFile(thumbnailPath);

      // Process main avatar (400x400)
      const processedPath = await this.processImage(filePath, {
        width: 400,
        height: 400,
        quality: 90,
        format: 'jpeg'
      });

      return {
        original: processedPath,
        thumbnail: thumbnailPath
      };
    } catch (error) {
      console.error('Avatar processing failed:', error);
      return { original: filePath };
    }
  }

  // Delete file
  async deleteFile(filePath) {
    try {
      const fullPath = path.isAbsolute(filePath) ? filePath : path.join(this.uploadDir, filePath);
      await fs.unlink(fullPath);
      return true;
    } catch (error) {
      console.error('File deletion failed:', error);
      return false;
    }
  }

  // Get file URL
  getFileUrl(filename, subfolder = 'general') {
    const baseUrl = process.env.API_URL || 'http://localhost:5001';
    return `${baseUrl}/uploads/${subfolder}/${filename}`;
  }

  // Validate file type
  isValidFileType(mimetype, allowedTypes) {
    return allowedTypes.includes(mimetype);
  }

  // Get file size in readable format
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

module.exports = new FileService();