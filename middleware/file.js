const multer = require('multer');
const fs = require('fs');
const path = require('path');


const imagesDir = path.join(__dirname, '..', 'images'); 


const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, imagesDir);
    },
    filename(req, file, cb) {
        const safeDate = new Date().toISOString().replace(/:/g, '-');
        cb(null, `${safeDate}-${file.originalname}`);
    }
});

const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];

const fileFilter = (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(null, false);
    }
};

module.exports = multer({
    storage,
    fileFilter
});