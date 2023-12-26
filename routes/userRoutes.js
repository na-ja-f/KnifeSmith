const express = require('express');
const router = express();

// * controllers
const userController = require('../controllers/userController')
const productController = require('../controllers/productController')
const cartController = require('../controllers/cartController')
const orderController = require('../controllers/orderController')
const addressController = require('../controllers/addressController')
const pdfController = require('../controllers/pdfController')
const couponController = require('../controllers/couponController')
const wishlistController = require('../controllers/wishlistController')

// * middlewares
const auth = require('../middlewares/auth')

// * setting user views
router.set('view engine', 'ejs');
router.set('views', './views/user');

// * static files
router.use(express.static("public"));

// ! GET routes
// user
router.get('/', userController.homepage);
router.get('/register', auth.isLogout, userController.register)
router.get('/otpVerification', userController.otpPage)
router.get('/login', auth.isLogout, userController.login)
router.get('/resendOtp', userController.resendOtp)
router.get('/profile', auth.isLogin, userController.profile)
router.get('/logout', auth.isLogin, userController.logout)
router.get('/resetPage', userController.resetPage)
router.get('/wallet', auth.isLogin, userController.loadWallet)

// products
router.get('/productList', productController.productList)
router.get('/productPage', productController.productPage)
router.get('/clearFilters', productController.clearFilters)
// cart
router.get('/cartPage', auth.isLogin, cartController.loadCart)
router.get('/removeCartItem', auth.isLogin, cartController.removeCartItem)
router.get('/clearCart', auth.isLogin, cartController.clearCart)
// order
router.get('/checkoutPage', auth.isLogin, orderController.checkoutPage)
router.get("/orderSuccess", auth.isLogin, orderController.loadOrderSuccess);
router.get('/userorderdetails', auth.isLogin, orderController.userOrderDetails)
router.get('/cancelOrder', auth.isLogin, orderController.changeOrderStatus)
router.get('/cancelSingleProduct', auth.isLogin, orderController.changeOrderStatus)
router.get('/returnOrder', auth.isLogin, orderController.changeOrderStatus)
router.get('/orderFailed', auth.isLogin, orderController.orderFailed)

// address
router.get('/addAddress', auth.isLogin, addressController.addAdressPage)
router.get('/deleteAddress', auth.isLogin, addressController.deleteAddress)
router.get('/editAddress', auth.isLogin, addressController.editAddress)
// pdf invoice
router.get('/generate-invoice/:orderId', pdfController.generateInvoice)
// profile
router.get('/couponPage', auth.isLogin, couponController.couponPage)
// wishlist
router.get('/addTowishlist', auth.isLogin, wishlistController.addToWishlist)
router.get('/wishlist', auth.isLogin, wishlistController.loadWishlist)
router.get("/removeFromWishlist", wishlistController.removeFromWishlist);
// other
router.get('/contact',userController.contact)



// ! POST routes
// user
router.post('/register', userController.insertUser)
router.post('/verifyOtp', userController.verifyOtp)
router.post('/login', userController.verifyLogin)
router.post('/resetPage', userController.forgetPassword)
router.post('/newPassword', userController.newPassword)
// product
router.post('/productList', productController.productList)
// cart
router.post('/productPage', cartController.insertToCart)
router.put('/updateQuantityAndSubtotal', cartController.updateQuantityAndSubtotal);
// address
router.post('/addAddress', addressController.insertAddress)
router.post('/editAddress', addressController.insertEditAddress)
// order
router.post('/postCheckout', orderController.postCheckout)
router.post('/applyCoupon', orderController.applyCoupon)
router.post('/razorpayOrder', orderController.razorpayOrder)





module.exports = router;