const { S3Client, ListBucketsCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const multer = require('multer');
const multerS3 = require('multer-s3');

// Инициализация S3 клиента для Yandex Cloud
const s3 = new S3Client({
  region: 'ru-central1',
  endpoint: 'https://storage.yandexcloud.net',
  forcePathStyle: true, // Обязательно для Yandex Cloud
  credentials: {
    accessKeyId: process.env.YC_ACCESS_KEY,
    secretAccessKey: process.env.YC_SECRET_KEY
  }
});

// Функция проверки подключения
async function checkS3Connection() {
  try {
    await s3.send(new ListBucketsCommand({}));
    console.log('✅ Successfully connected to Yandex Cloud S3');
    return true;
  } catch (err) {
    console.error('❌ S3 Connection Error:', err.message);
    if (err.$metadata) {
      console.error('Request ID:', err.$metadata.requestId);
    }
    return false;
  }
}

// Проверяем подключение при старте
checkS3Connection().then(success => {
  if (!success) {
    console.error('Failed to initialize S3 connection');
  }
});

// Настройка Multer для загрузки файлов
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.YC_BUCKET_NAME,
    acl: 'public-read',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      const uniquePrefix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, `avatars/${uniquePrefix}-${file.originalname}`);
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, JPEG and PNG images are allowed'), false);
    }
  }
});

module.exports = upload;