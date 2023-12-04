const multer = require('multer');
const path = require('path');

const categoryStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../public/categoryImages'));
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
})
const categoryUpload = multer({ storage: categoryStorage });

// * setting multer for product
const productStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../public/productImages'));
    },
    filename: function (req, file, cb) {
        const uniqueFilename = Date.now() + '-' + file.originalname;
        cb(null, uniqueFilename);
    }
});
const productUpload = multer({ storage: productStorage, limits: { fileSize: 10 * 1024 * 1024 }, });


module.exports = {
    categoryUpload,
    productUpload
}