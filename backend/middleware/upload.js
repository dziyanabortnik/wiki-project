const multer = require('multer');
const fs = require('fs');
const path = require('path');

const UPLOAD_DIR = path.join(__dirname, '../uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  console.log(`Upload folder created at ${UPLOAD_DIR}`);
}

// Validate file types before saving
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf'
  ];
  
  console.log('Validating file:', file.originalname, 'MIME:', file.mimetype);
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    console.log('REJECTED file:', file.originalname, 'with MIME:', file.mimetype);
    cb(new Error(`Invalid file type: ${file.mimetype}. Only images and PDFs are allowed.`), false);
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});

// Custom middleware that handles Multer errors properly
const handleFileUpload = (req, res, next) => {
  upload.array('files', 5)(req, res, (err) => {
    if (err) {
      console.log('Multer error caught:', err.message);
      
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          const filePath = path.join(UPLOAD_DIR, file.filename);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log('Deleted invalid file:', filePath);
          }
        });
      }
      
      if (err.message.includes('Invalid file type')) {
        return res.status(400).json({ error: err.message });
      }
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File size too large. Maximum 10MB allowed.' });
      }
      return res.status(500).json({ error: 'File upload error: ' + err.message });
    }
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No valid files uploaded. Only images and PDFs are allowed.' });
    }
    
    next();
  });
};

module.exports = { upload, handleFileUpload };
