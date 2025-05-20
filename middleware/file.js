const { S3Client } = require('@aws-sdk/client-s3');
const multer = require('multer');
const multerS3 = require('multer-s3');

const s3 = new S3Client({
  region: 'ru-central1',
  endpoint: 'https://storage.yandexcloud.net',
  forcePathStyle: true, // Важно для Yandex Cloud
  credentials: {
    accessKeyId: process.env.YC_ACCESS_KEY,
    secretAccessKey: process.env.YC_SECRET_KEY
  }
});

// Добавьте в начало file.js
async function checkS3Connection() {
  try {
    await s3.send(new ListBucketsCommand({}));
    console.log('✅ Connected to Yandex Cloud S3');
  } catch (err) {
    console.error('❌ S3 Connection Error:', err);
    throw err;
  }
}

// Вызовите перед использованием
checkS3Connection().catch(console.error);

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'job-board-avatars',
    acl: 'public-read',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      cb(null, `avatars/${Date.now()}-${file.originalname}`)
    }
  }),
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg']
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Недопустимый тип файла'), false)
    }
  }
})

module.exports = upload