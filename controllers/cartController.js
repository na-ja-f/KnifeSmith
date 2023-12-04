// !  models
// * user model
const user = require("../models/userModel");
// * user otp model
const userOtpVerification = require("../models/otpVerificationModel");
// * category model
const category = require('../models/categoriesModel')
// * product model
const product = require('../models/productModel')
// * cart model
const cart = require('../models/cartModel')

// ! load cart page
const loadCart = async (req, res) => {
    try {
        const userId = req.session.userId
        const cartData = await cart.findOne({ user: userId }).populate('items.product')

        const Cart = cartData ? cartData.items : [];
        const productTotal = calculateProductTotal(Cart);

        let outOfStockError = false;
        if (Cart.length > 0) {
            for (const cartItem of Cart) {
                const product = cartItem.product;

                if (product.quantity < cartItem.quantity) {
                    outOfStockError = true;
                    break;
                }
            }
        }

        res.render('cart', { cartData, outOfStockError, productTotal })
    } catch (error) {
        console.log(error)
    }
}

// ! product total
const calculateProductTotal = (cart) => {
    let productTotals = 0;
    for (const cartItem of cart) {
        const total = cartItem.product.discountPrice * cartItem.quantity;
        productTotals += total
    }
    return productTotals;
};

// ! insert to cart
const insertToCart = async (req, res) => {
    try {
        const productId = req.query.id;
        const userId = req.session.userId;
        const { qty } = req.body;

        const existingCart = await cart.findOne({ user: userId });
        let newCart = {};

        if (existingCart) {
            const existingCartItem = existingCart.items.find((item) => item.product.toString() === productId);

            if (existingCartItem) {
                existingCartItem.quantity += parseInt(qty);
            } else {
                existingCart.items.push({
                    product: productId,
                    quantity: parseInt(qty),
                });
            }

            existingCart.total = existingCart.items.reduce(
                (total, item) => total + (item.quantity || 0),
                0
            );

            await existingCart.save();

        } else {
            newCart = new cart({
                user: userId,
                items: [{ product: productId, quantity: parseInt(qty) }],
                total: parseInt(qty, 10),
            });

            await newCart.save();
        }

        req.session.cartLength = (existingCart || newCart).items.length;

        res.redirect(`/productPage?id=${productId}`)
    } catch (error) {
        console.log(error)
    }
}

// ! updating quantity and subtotal
const updateQuantityAndSubtotal = async (req, res) => {
    try {
        const { productId, newQuantity } = req.query;
        const userId = req.session.userId;

        const Cart = await cart.findOne({ user: userId });

        const cartItem = Cart.items.find(item => item.product.toString() === productId);

        if (cartItem) {
            cartItem.quantity = parseInt(newQuantity);
            await Cart.save();

            const subtotal = cartItem.product.discountPrice * cartItem.quantity;

            res.json({ success: true, subtotal });
        } else {
            res.json({ success: false, error: 'Item not found in the cart' });
        }
    } catch (error) {
        console.error('Error updating quantity and subtotal:', error);
        res.json({ success: false, error: 'Failed to update quantity and subtotal' });
    }
};

// ! remove single item from cart
const removeCartItem = async (req, res) => {
    try {
        const productId = req.query.id;
        const userId = req.session.userId

        const userCart = await cart.findOne({ user: userId });

        const cartItemIndex = userCart.items.findIndex((item) =>
            item.product.equals(productId)
        );

        if (cartItemIndex === -1) {
            return res.status(404).json({ error: 'Product not found in cart.' });
        }

        userCart.items.splice(cartItemIndex, 1);

        userCart.items.reduce(
            (total, item) => total - (item.quantity || 0),
            0)

        await userCart.save();
        if (userCart.items.length === 0) {
            res.redirect('/clearCart')
        } else {
            res.redirect('/cartPage');
        }


    } catch (error) {
        console.log(error.message)
    }
}

// ! clear cart
const clearCart = async (req, res) => {
    try {
        const userId = req.session.userId
        await cart.deleteOne({ user: userId })
        res.redirect('/cartPage');
    } catch (error) {
        console.log(error.message)
    }
}






module.exports = {
    loadCart,
    insertToCart,
    updateQuantityAndSubtotal,
    removeCartItem,
    clearCart,
}
