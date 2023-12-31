const express = require('express');
const router = express();
const multer = require('multer');
const path = require('path');

// * auth file
const auth = require('../middlewares/adminAuth')

// * setting user views
router.set('view engine', 'ejs');
router.set('views', './views/admin');

// * admin assets
router.use(express.static("public/assets-admin"));

// * controller
const adminController = require('../controllers/adminController')
const productController = require('../controllers/productController')
const catController = require('../controllers/categoryController')
const orderController = require('../controllers/orderController')
const couponController = require('../controllers/couponController')
const offerController = require('../controllers/offerController')
const bannerController = require('../controllers/bannerController')

// * getting multers
const multerMiddleware = require('../helpers/multers')


// ! get methods
// admin
router.get('/', auth.isLogout, adminController.adminLogin)
router.get('/dashboard', auth.isLogin, adminController.loadDashboard)
router.get('/logout', auth.isLogin, adminController.logout)
router.get('/usersPage', auth.isLogin, adminController.loadUsers)
router.get('/blockUser', auth.isLogin, adminController.blockUser)
router.get('/unblockUser', auth.isLogin, adminController.unblockUser)
// category
router.get('/categoriesList', auth.isLogin, catController.categoriesList)
router.get('/addCategories', auth.isLogin, catController.addCategories)
router.get('/unlistCat', auth.isLogin, catController.unlistCat)
router.get('/listCat', auth.isLogin, catController.listCat)
router.get('/editCategory', auth.isLogin, catController.editCategory)
// product
router.get('/adminProductList', auth.isLogin, productController.adminProductList)
router.get('/addProductPage', auth.isLogin, productController.addProductPage)
router.get('/unlistProduct', auth.isLogin, productController.unlistProduct)
router.get('/listProduct', auth.isLogin, productController.listProduct)
router.get('/viewProductInfo', auth.isLogin, productController.viewProductInfo)
router.get('/editProduct', auth.isLogin, productController.editProduct)
// order
router.get('/orderList', auth.isLogin, orderController.listUserOrders)
router.get('/orderstatus', auth.isLogin, orderController.changeOrderStatus)
router.get('/orderdetails', auth.isLogin, orderController.adminOrderDetails)
router.get('/cancelProduct', auth.isLogin, orderController.produtCancel)
router.get('/refundOrder', auth.isLogin, orderController.returnOrder)
router.get('/cancelOrder', auth.isLogin, orderController.orderCancel)
router.get("/transactionList", auth.isLogin, orderController.transactionList)
router.get("/salesReport", auth.isLogin, orderController.loadSalesReport);


// coupon
router.get('/addCoupon', auth.isLogin, couponController.addCouponPage)
router.get('/couponList', auth.isLogin, couponController.couponList)
router.get('/couponUnlist', auth.isLogin, couponController.unlistCoupon)
router.get('/couponDetails', auth.isLogin, couponController.couponDetails)
router.get('/loadEditCoupon', auth.isLogin, couponController.loadEditCoupon)
// offer
router.get('/addOffer', auth.isLogin, offerController.loadOfferAdd)
router.get('/offerList', auth.isLogin, offerController.OfferList)
router.get('/blockOffer', auth.isLogin, offerController.offerBlock)
router.get('/offerEdit', auth.isLogin, offerController.loadOfferEdit)
// Banner 
router.get("/bannerAdd", auth.isLogin, bannerController.loadBannerAdd);
router.get("/bannerList", auth.isLogin, bannerController.bannerList);
router.get("/bannerEdit", auth.isLogin, bannerController.loadBannerEdit);
router.get('/blockBanner', auth.isLogin, bannerController.blockBanner)



// !post methods
// admin login
router.post('/', adminController.verifyLogin)
// category
router.post('/addCategories', multerMiddleware.categoryUpload.single('image'), catController.insertCategory)
router.post('/editCategory', multerMiddleware.categoryUpload.single('image'), catController.insertEditCategory);
// product
router.post('/addProductPage', multerMiddleware.productUpload.array('image', 4), productController.insertProduct);
router.post('/editProduct', multerMiddleware.productUpload.array('image', 4), productController.insertEditProduct);
// coupon
router.post('/addCoupon', couponController.insertCoupon)
router.post('/loadEditCoupon', couponController.insertEditCoupon)
// offer
router.post('/addOffer', offerController.addOffer)
router.post('/offerEdit', offerController.editOffer)
// banner
router.post("/bannerAdd", multerMiddleware.bannerUpload.single("image"), bannerController.addBanner);
router.post("/bannerEdit", multerMiddleware.bannerUpload.single("image"), bannerController.bannerEdit);



module.exports = router;