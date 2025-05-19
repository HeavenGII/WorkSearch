const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(), // Хранение в памяти, а не на диске
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Разрешены только изображения (JPEG, PNG)'), false);
    }
  }
});

module.exports = upload.single('avatar');