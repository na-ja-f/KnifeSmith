// !  models
// * user model
const user = require("../models/userModel");
// * category model
const category = require('../models/categoriesModel')
// * product model
const product = require('../models/productModel')
// * cart model
const cart = require('../models/cartModel')
// * address model 
const address = require('../models/addressModel')
// * order model 
const order = require('../models/orderModel')
// * coupon model 
const Coupon = require('../models/couponModel')
// * transaction model 
const Transaction = require("../models/transactionModel");

// * helpers
const calculateTotal = require('../helpers/calculateTotal');

const mongoose = require('mongoose')

require("dotenv").config();
const Razorpay = require("razorpay");


const { RAZORPAY_ID_KEY, RAZORPAY_SECRET_KEY } = process.env;

const razorpay = new Razorpay({
    key_id: RAZORPAY_ID_KEY,
    key_secret: RAZORPAY_SECRET_KEY,
});


// ?==================================================== user side ===============================================


// ! checkoutPage
const checkoutPage = async (req, res) => {
    try {
        const userId = req.session.userId
        const orders = await cart.findOne({ user: userId }).populate('items.product')

        const addresses = await address.find({ user: userId }).sort({ createdDate: -1 }).exec();

        const productTotal = calculateTotal.calculateSubtotal(orders.items);

        res.render('checkoutPage', { orders: orders.items, productTotal, addresses })
    } catch (error) {
        console.log(error.message)
    }
}


// ! function to place order using cashondelivery and wallet
const postCheckout = async (req, res) => {
    const userId = req.session.userId;
    const { address, paymentMethod, couponCode } = req.body;
    const payment = paymentMethod;
    try {
        const userData = await user.findById(userId);
        const cartData = await cart.findOne({ user: userId })
            .populate({
                path: "items.product",
                model: "Product",
            })
            .populate("user");

        if (!userData || !cartData) {
            return res
                .status(500)
                .json({ success: false, error: "User or cart not found." });
        }

        const cartItems = cartData.items || [];
        let totalAmount = 0;

        for (const cartItem of cartItems) {
            const product = cartItem.product;

            if (!product) {
                return res
                    .status(500)
                    .json({ success: false, error: "Product not found.", userData });
            }

            if (product.quantity < cartItem.quantity) {
                return res
                    .status(400)
                    .json({ success: false, error: "Product Out Of Stock", userData });
            }
            const isDiscounted = product.discountStatus &&
                new Date(product.discountStart) <= new Date() &&
                new Date(product.discountEnd) >= new Date();

            const priceToConsider = isDiscounted ? product.discountPrice : product.price;

            product.quantity -= cartItem.quantity;
            const GST = (18 / 100) * totalAmount;

            const itemTotal = priceToConsider * cartItem.quantity + GST;
            totalAmount += parseFloat(itemTotal.toFixed(2));

            await product.save();
        }
        if (couponCode) {
            totalAmount = await applyCoup(couponCode, totalAmount, userId);
        }

        const orderData = new order({
            user: userId,
            address: address,
            orderDate: new Date(),
            status: "Pending",
            paymentMethod: payment,
            paymentStatus: "succesfull",
            deliveryDate: new Date(new Date().getTime() + 8 * 24 * 60 * 60 * 1000),
            totalAmount: totalAmount,
            items: cartItems.map(cartItem => {
                const product = cartItem.product;
                const isDiscounted = product.discountStatus &&
                    new Date(product.discountStart) <= new Date() &&
                    new Date(product.discountEnd) >= new Date();
                const priceToConsider = isDiscounted ? product.discountPrice : product.price;

                return {
                    product: product._id,
                    quantity: cartItem.quantity,
                    price: priceToConsider,
                };
            }),
        });

        await orderData.save();
        if (payment == "Cash On Delivery") {
            const transactiondebit = new Transaction({
                user: userId,
                amount: totalAmount,
                type: "debit",
                paymentMethod: orderData.paymentMethod,
                orderId: orderData._id,
                description: `Paid Using COD`,
            });
            await transactiondebit.save();
        }
        if (payment === "Wallet") {
            if (totalAmount <= userData.walletBalance) {
                userData.walletBalance -= totalAmount;
                await userData.save();

                const transactiondebit = new Transaction({
                    user: userId,
                    amount: totalAmount,
                    type: "debit",
                    paymentMethod: orderData.paymentMethod,
                    orderId: orderData._id,
                    description: `Debited from wallet `,
                });
                await transactiondebit.save();
            } else {
                await order.deleteOne({ _id: orderData._id });
                return res
                    .status(400)
                    .json({ success: false, error: "Insufficient Wallet Balance", userData });
            }
        }

        res
            .status(200)
            .json({ success: true, message: "Order placed successfully." });

        // res.redirect("/orderSuccess");
    } catch (error) {
        console.error("Error placing the order:", error);
    }
};

// ! online payment 
const razorpayOrder = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { address, paymentMethod, couponCode } = req.body;

        const userData = await user.findById(userId);
        const cartData = await cart.findOne({ user: userId })
            .populate({
                path: "items.product",
                model: "Product",
            })
            .populate("user");

        if (!userData || !cartData) {
            console.error("User or cart not found.");
        }

        const cartItems = cartData.items || [];
        let totalAmount = 0;

        for (const cartItem of cartItems) {
            const product = cartItem.product;

            if (!product) {
                return res
                    .status(400)
                    .json({ success: false, error: "Product Not Found" });
            }

            if (product.quantity < cartItem.quantity) {
                return res
                    .status(400)
                    .json({ success: false, error: "Product Out Of Stock" });
            }

            const priceToConsider = product.discountPrice;
            product.quantity -= cartItem.quantity;

            const itemTotal = priceToConsider * cartItem.quantity;
            totalAmount += itemTotal;

            await product.save();
        }

        if (couponCode) {
            totalAmount = await applyCoup(couponCode, totalAmount, userId);
        }

        const orderData = new order({
            user: userId,
            address: address,
            orderDate: new Date(),
            status: "succesfull",
            paymentMethod: paymentMethod,
            deliveryDate: new Date(new Date().getTime() + 8 * 24 * 60 * 60 * 1000),
            totalAmount: totalAmount,
            items: cartItems.map(cartItem => {
                const product = cartItem.product;

                const priceToConsider = product.discountPrice;

                return {
                    product: product._id,
                    quantity: cartItem.quantity,
                    price: priceToConsider,
                };
            }),
        });

        await orderData.save();

        const options = {
            amount: totalAmount * 100,
            currency: "INR",
            receipt: orderData._id,
        };

        razorpay.orders.create(options, async (err, razorpayOrder) => {
            if (err) {
                console.error("Error creating Razorpay order:", err);
                return res
                    .status(400)
                    .json({ success: false, error: "Payment Failed", user });
            } else {
                res.status(200).json({
                    message: "Order placed successfully.",
                    order: razorpayOrder,
                });
            }
        });
    } catch (error) {
        console.error("An error occurred while placing the order: ", error);
        return res.status(400).json({ success: false, error: "Payment Failed" });
    }
};

// ! Apply coupon Function
async function applyCoup(couponCode, discountedTotal, userId) {
    const coupon = await Coupon.findOne({ code: couponCode });
    if (!coupon) {
        return { error: "Coupon not found." };
    }
    const currentDate = new Date();
    if (currentDate > coupon.expiry) {
        return { error: "Coupon has expired." };
    }
    if (coupon.usersUsed.length >= coupon.limit) {
        return { error: "Coupon limit reached." };
    }

    if (coupon.usersUsed.includes(userId)) {
        return { error: "You have already used this coupon." };
    }
    if (coupon.type === "percentage") {
        discountedTotal = calculateTotal.calculateDiscountedTotal(
            discountedTotal,
            coupon.discount
        );
    } else if (coupon.type === "fixed") {
        discountedTotal = discountedTotal - coupon.discount;
    }
    coupon.limit--;
    coupon.usersUsed.push(userId);
    await coupon.save();
    return discountedTotal;
}

// ! order success page
const loadOrderSuccess = async (req, res) => {
    try {
        const user = req.session.userId;
        await cart.deleteOne({ user: user });

        const orderData = await order.findOne({ user: user })
            .populate("user")
            .populate({
                path: "address",
                model: "Address",
            })
            .populate({
                path: "items.product",
                model: "Product",
            })
            .sort({ orderDate: -1 });
        if (
            orderData.paymentMethod == "Online Payment" ||
            orderData.paymentMethod == "Wallet"
        ) {
            order.paymentStatus = "Payment Successful";
            await orderData.save();
            if (orderData.paymentMethod == "Online Payment") {
                const transactiondebit = new Transaction({
                    user: user,
                    amount: orderData.totalAmount,
                    type: "debit",
                    paymentMethod: orderData.paymentMethod,
                    orderId: orderData._id,
                    description: `Paid using RazorPay `,
                });
                await transactiondebit.save();
            }
        }

        res.render("orderSuccess", { orderData });
    } catch (error) {
        console.error("Error fetching order details:", error);
    }
};

// ! order failed page
const orderFailed = async (req, res) => {
    try {
        const error = req.query.error;
        res.render("orderFailed", { error });
    } catch (error) {
        console.log(error.message);
    }
};


//   ! user order details page
const userOrderDetails = async (req, res) => {
    try {
        const orderId = req.query.orderId;
        const orderData = await order.findOne({ _id: orderId })
            .populate("user")
            .populate({
                path: "address",
                model: "Address",
            })
            .populate({
                path: "items.product",
                model: "Product",
            });
        res.render("userOrderDetails", { orders: orderData });
    } catch (error) {
        console.log(error.message);
    }
};

// ! function to cancel order
const changeOrderStatus = async (req, res) => {
    try {
        const OrderStatus = req.query.status;
        const orderId = req.query.orderId;
        const Order = await order.findById(orderId).populate({
            path: "items.product",
            model: "Product",
        });

        if (OrderStatus == 'Product Cancel') {
            const productId = req.query.productId
            for (const item of Order.items) {
                if (item.product._id == productId) {
                    item.status = "Cancel Requested"
                }
            }
            await Order.save();
            return res.redirect(`/userorderdetails?orderId=${orderId}`)
        }
        if (OrderStatus == "Cancelled") {
            for (const item of Order.items) {
                const productId = item.product._id;
                const orderedQuantity = item.quantity;
                const Product = await product.findById(productId);
                if (Order.paymentMethod == "Cash On Delivery") {
                    Order.paymentStatus = "Declined";
                } else {
                    Order.paymentStatus == "Refunded";
                }
                if (Product) {
                    Product.quantity += orderedQuantity;
                    await Product.save();
                }
            }
        }
        if (OrderStatus == "Delivered") {
            Order.deliveryDate = new Date();
            Order.paymentStatus = "Payment Successful";
        }

        Order.status = OrderStatus;
        if (req.query.reason) {
            Order.reason = req.query.reason;
        }
        await Order.save();

        if (req.query.orderDetails) {
            res.redirect(`/admin/orderdetails?orderId=${orderId}`);
        } else if (
            Order.status == "Return Requested" ||
            Order.status == "Cancel Requested"
        ) {
            res.redirect(`/userorderdetails?orderId=${orderId}`);
        } else {
            res.redirect("/admin/orderList");
        }
    } catch (error) {
        console.log(error.message);
    }
};

// ! apply couopon
const applyCoupon = async (req, res) => {
    try {
        const { couponCode } = req.body;
        const userId = req.session.userId;
        const coupon = await Coupon.findOne({ code: couponCode });

        let errorMessage;

        if (!coupon) {
            errorMessage = "Coupon not found";
            return res.json({ errorMessage });
        }

        const currentDate = new Date();

        if (coupon.expiry && currentDate > coupon.expiry) {
            errorMessage = "Coupon Expired";
            return res.json({ errorMessage });
        }

        if (coupon.usersUsed.length >= coupon.limit) {
            errorMessage = "Coupon limit Reached";
            return res.json({ errorMessage });
        }

        if (coupon.usersUsed.includes(userId)) {
            errorMessage = "You already used this coupon";
            return res.json({ errorMessage });
        }

        const cartData = await cart.findOne({ user: userId })
            .populate({
                path: "items.product",
                model: "Product",
            })
            .exec();

        const cartItems = cartData.items || [];
        const orderTotal = calculateTotal.calculateSubtotal(cartItems);
        let discountedTotal = 0;

        if (coupon.type === "percentage") {
            discountedTotal = calculateTotal.calculateDiscountedTotal(orderTotal, coupon.discount);
        } else if (coupon.type === "fixed") {
            discountedTotal = orderTotal - coupon.discount;
        }

        res.json({ discountedTotal, errorMessage });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ errorMessage: "Internal Server Error" });
    }
};

// ! Function to cancel single product in an order
const produtCancel = async (req, res) => {
    try {
        const orderId = req.query.orderId;
        const productId = req.query.productId;
        console.log(productId)
        const Order = await order.findOne({ _id: orderId })
            .populate("user")
            .populate({
                path: "items.product",
                model: "Product",
            });
        for (const item of Order.items) {
            if (item.product._id == productId) {
                item.status = "Cancelled";
                Order.totalAmount -= item.product.discountPrice;
                Order.user.walletBalance += item.product.discountPrice;
                item.product.quantity += item.quantity;

            }
        }
        await Order.save();
        res.redirect(`/admin/orderDetails?orderId=${orderId}`);
    } catch (error) {
        console.log(error.message);
    }
}




// ?=================================================== admin side ===============================================


//! function to get orderlist in adminside
const listUserOrders = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        let query = {};
        if (req.query.status) {
            if (req.query.status === "Pending") {
                query.status = "Pending";
            } else if (req.query.status === "Shipped") {
                query.status = "Shipped";
            } else if (req.query.status === "Out For Delivery") {
                query.status = "Out For Delivery";
            } else if (req.query.status === "Order Confirmed") {
                query.status = "Order Confirmed";
            } else if (req.query.status === "Out For Delivery") {
                query.status = "Out For Delivery";
            } else if (req.query.status === "Delivered") {
                query.status = "Delivered";
            } else if (req.query.status === "Return Requested") {
                query.status = "Return Requested";
            } else if (req.query.status === "Return Successfull") {
                query.status = "Return Successfull";
            } else if (req.query.status === "Cancelled") {
                query.status = "Cancelled";
            }
        }
        const limit = 7;
        const totalCount = await order.countDocuments(query);

        const totalPages = Math.ceil(totalCount / limit);

        const Orders = await order.find(query)
            .populate("user")
            .populate({
                path: "address",
                model: "Address",
            })
            .populate({
                path: "items.product",
                model: "Product",
            })
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ orderDate: -1 });
        res.render("orderList", { orders: Orders, totalPages, currentPage: page });
    } catch (error) {
        console.log(error.message);
    }
};


// ! function to confirm return by admin
const returnOrder = async (req, res) => {
    try {
        const orderId = req.query.orderId;

        const Order = await order.findOne({ _id: orderId })
            .populate("user")
            .populate({
                path: "items.product",
                model: "Product",
            });

        const user = Order.user;
        user.walletBalance += Order.totalAmount;
        await Order.save();

        for (const item of Order.items) {
            const productId = item.product._id;
            const orderedQuantity = item.quantity;
            const product = await Product.findById(productId);

            if (product) {
                product.quantity += orderedQuantity;
                await product.save();
            }
        }

        const transactiondebit = new Transaction({
            user: user._id,
            amount: Order.totalAmount,
            type: "credit",
            paymentMethod: Order.paymentMethod,
            orderId: Order._id,
            description: `Credited from wallet`,
        });
        await transactiondebit.save();

        Order.status = "Return Successfull";
        Order.paymentStatus = "Refunded";
        await Order.save();

        res.redirect(`/admin/orderDetails?orderId=${orderId}`);
    } catch (error) {
        console.log(error.message);
    }
};


// ! get order details in the adminside  
const adminOrderDetails = async (req, res) => {
    try {
        const orderId = req.query.orderId;
        const Order = await order.findOne({ _id: orderId })
            .populate("user")
            .populate({
                path: "address",
                model: "Address",
            })
            .populate({
                path: "items.product",
                model: "Product",
            });
        res.render("show-order", { orders: Order });
    } catch (error) {
        console.log(error.message);
    }
};

// ! confirm Cancel Order
const orderCancel = async (req, res) => {
    try {
        const orderId = req.query.orderId;
        console.log(orderId);
        const Order = await order.findOne({ _id: orderId })
            .populate("user")
            .populate({
                path: "address",
                model: "Address",
            })
            .populate({
                path: "items.product",
                model: "Product",
            });
        const user = Order.user;

        for (const item of Order.items) {
            const productId = item.product._id;
            const orderedQuantity = item.quantity;
            const Product = await product.findById(productId);

            if (Product) {
                Product.quantity += orderedQuantity;
                await Product.save();
            }
        }

        Order.status = "Cancelled";
        if (
            Order.paymentMethod == "Wallet" ||
            (Order.paymentMethod == "Online Payment" &&
                Order.paymentStatus == "Payment Successful")
        ) {
            Order.paymentStatus = "Refunded";
        } else {
            Order.paymentStatus = "Declined";
        }
        await Order.save();

        if (
            Order.paymentMethod == "Wallet" ||
            Order.paymentMethod == "Online Payment"
        ) {
            user.walletBalance += Order.totalAmount;
            await user.save();
            const transactiondebit = new Transaction({
                user: user._id,
                amount: Order.totalAmount,
                type: "credit",
                paymentMethod: Order.paymentMethod,
                orderId: Order._id,
                description: `Credited to wallet`,
            });
            await transactiondebit.save();
        }
        if (req.query.orderList) {
            res.redirect("/admin/orderList");
        }
        res.redirect(`/admin/orderdetails?orderId=${orderId}`);
    } catch (error) {
        console.log(error.message);
    }
};


// ! Transaction List
const transactionList = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        let query = {};
        if (req.query.type) {
            if (req.query.type === "debit") {
                query.type = "debit";
            } else if (req.query.type === "credit") {
                query.type = "credit";
            }
        }
        const limit = 7;
        const totalCount = await Transaction.countDocuments(query);

        const totalPages = Math.ceil(totalCount / limit);

        const transactions = await Transaction.aggregate([
            { $match: query },
            { $sort: { date: -1 } },
            { $skip: (page - 1) * limit },
            { $limit: limit },
        ]);
        res.render("transactionList", {
            transactions,
            totalPages,
            currentPage: page,
        });
    } catch (error) {
        console.log(error.message);
    }
};

// ! Sales Report Page 
const loadSalesReport = async (req, res) => {
    try {
        let query = { paymentStatus: "Payment Successful" };

        if (req.query.paymentMethod) {
            if (req.query.paymentMethod === "Online Payment") {
                query.paymentMethod = "Online Payment";
            } else if (req.query.paymentMethod === "Wallet") {
                query.paymentMethod = "Wallet";
            } else if (req.query.paymentMethod === "Cash On Delivery") {
                query.paymentMethod = "Cash On Delivery";
            }
        }

        const orders = await order.find(query)
            .populate("user")
            .populate({
                path: "address",
                model: "Address",
            })
            .populate({
                path: "items.product",
                model: "Product",
            })
            .sort({ orderDate: -1 });

        // total revenue
        const totalRevenue = orders.reduce(
            (acc, order) => acc + order.totalAmount,
            0
        );

        const totalSales = orders.length;

        // total Sold Products
        const totalProductsSold = orders.reduce(
            (acc, order) => acc + order.items.length,
            0
        );

        res.render("salesReport", {
            orders,
            totalRevenue,
            totalSales,
            totalProductsSold,
            req,
        });
    } catch (error) {
        console.log(error.message);
    }
};

module.exports = {
    checkoutPage,
    postCheckout,
    loadOrderSuccess,
    userOrderDetails,
    changeOrderStatus,
    returnOrder,
    listUserOrders,
    adminOrderDetails,
    applyCoupon,
    orderFailed,
    razorpayOrder,
    orderCancel,
    produtCancel,
    transactionList,
    loadSalesReport
}