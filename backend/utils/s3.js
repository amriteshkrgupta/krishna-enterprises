/**
 * utils/s3.js
 * AWS S3 client configuration and Multer upload middleware with local fallback.
 */

const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');
const fs = require('fs');

// Determine if AWS S3 credentials are provided and valid
const hasS3Config = Boolean(
  process.env.AWS_ACCESS_KEY_ID &&
  process.env.AWS_SECRET_ACCESS_KEY &&
  process.env.AWS_BUCKET_NAME &&
  !process.env.AWS_ACCESS_KEY_ID.includes('your_')
);

// --- File Filter --------------------------------------------------------------
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(new Error('Only image files (jpg, jpeg, png, webp) are allowed.'));
};

let upload;
let s3Client = null;

if (hasS3Config) {
  // --- AWS S3 Storage ---------------------------------------------------------
  s3Client = new S3Client({
    region: process.env.AWS_REGION || 'ap-south-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  upload = multer({
    storage: multerS3({
      s3: s3Client,
      bucket: process.env.AWS_BUCKET_NAME,
      acl: 'public-read',
      contentType: multerS3.AUTO_CONTENT_TYPE,
      metadata: (req, file, cb) => {
        cb(null, { fieldName: file.fieldname });
      },
      key: (req, file, cb) => {
        const uniqueName = `products/${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
        cb(null, uniqueName);
      },
    }),
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  });
} else {
  // --- Local Disk Storage Fallback -------------------------------------------
  const uploadDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const localStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const base = path.basename(file.originalname, ext).replace(/\s+/g, '-');
      cb(null, `${Date.now()}-${base}${ext}`);
    },
  });

  upload = multer({
    storage: localStorage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
  });
}

// --- Delete Helper ------------------------------------------------------------
const deleteFromS3 = async (keyOrPath) => {
  if (hasS3Config && s3Client) {
    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: keyOrPath,
    });
    await s3Client.send(command);
  } else {
    const filename = path.basename(keyOrPath);
    const localFilePath = path.join(__dirname, '..', 'uploads', filename);
    if (fs.existsSync(localFilePath)) {
      try {
        fs.unlinkSync(localFilePath);
      } catch (err) {
        console.warn('Could not delete local file:', err.message);
      }
    }
  }
};

module.exports = { upload, deleteFromS3, s3Client, hasS3Config };
