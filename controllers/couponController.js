const User = require("../models/userModel");
const Coupon = require("../models/couponModel");


// ! add coupon page
const addCouponPage = async (req, res) => {
    try {
        res.render('addCoupon')
    } catch (error) {
        console.log(error)
    }
}

// ! insert coupon
const insertCoupon = async (req, res) => {
    try {

        let {
            couponCode,
            discount,
            expiryDate,
            limit,
            DiscountType,
            maxRedeemableAmt,
            minCartAmt,
        } = req.body;

        couponCode = couponCode.replace(/\s/g, "");

        console.log(req.body);
        console.log(couponCode);

        if (!couponCode) {
            return res.render("addCoupon", {
                message: "Coupon code cannot be empty"
            });
        }

        const existingCoupon = await Coupon.findOne({
            code: { $regex: new RegExp("^" + couponCode, "i") },
        });

        if (existingCoupon) {
            return res.render("addCoupon", {
                message: "Coupon code already exists"
            });
        }

        const newCoupon = new Coupon({
            code: couponCode,
            discount: discount,
            limit: limit,
            type: DiscountType,
            expiry: expiryDate,
            maxRedeemableAmt: maxRedeemableAmt,
            minCartAmt: minCartAmt,
        });

        await newCoupon.save();
        res.redirect("/admin/couponList");
    } catch (error) {
        console.log(error.message);
    }
};

//   ! coupon list
const couponList = async (req, res) => {
    try {
        // pagination
        const page = parseInt(req.query.page) || 1;
        let query = {};
        const limit = 7;
        const totalCount = await Coupon.countDocuments(query);
        const totalPages = Math.ceil(totalCount / limit);

        const coupon = await Coupon.find()
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ createdDate: -1 });
        res.render("couponList", { coupon, totalPages, currentPage: page });
    } catch (error) {
        console.log(error.message);
    }
};

//   ! list and unnlist coupon
const unlistCoupon = async (req, res) => {
    try {
        const id = req.query.couponId;
        const couponData = await Coupon.findById({ _id: id });

        if (couponData.is_listed == false) {
            couponData.is_listed = true;
        } else {
            couponData.is_listed = false;
        }

        await couponData.save();
        res.redirect("/admin/couponList");
    } catch (error) {
        console.log(error.message);
    }
};

// ! coupon detail page
const couponDetails = async (req, res) => {
    try {
        const id = req.query.couponId;
        const coupon = await Coupon.findById(id)
            .populate("usersUsed")
            .sort({ _id: -1 })
            .exec();
        const users = coupon.usersUsed;
        res.render('couponDetails', { coupon, users })
    } catch (error) {
        console.log(error)
    }
}

// ! edit coupon page
const loadEditCoupon = async (req, res) => {
    try {
        const couponId = req.query.couponId;
        const coupon = await Coupon.findById(couponId);
        const expiry = new Date(coupon.expiry).toISOString().split("T")[0];
        res.render("editCoupon", { coupon, expiry });
    } catch (error) {
        console.log(error.message);
    }
};

//   ! insert edit coupon
const insertEditCoupon = async (req, res) => {
    try {
        const couponId = req.body.couponId;
        const editCoupon = await Coupon.findById(couponId);
        if (req.body.couponCode) {
            editCoupon.code = req.body.couponCode;
        }
        if (req.body.discount) {
            editCoupon.discount = req.body.discount;
        }
        if (req.body.expiry) {
            editCoupon.expiry = req.body.expiry;
        }
        if (req.body.DiscountType) {
            editCoupon.type = req.body.DiscountType;
        }
        if (req.body.maxRedeemableAmt) {
            editCoupon.maxRedeemableAmt = req.body.maxRedeemableAmt;
        }
        if (req.body.minCartAmt) {
            editCoupon.minCartAmt = req.body.minCartAmt;
        }
        if (req.body.limit) {
            editCoupon.limit = req.body.limit;
        }
        await editCoupon.save();
        res.redirect("/admin/couponList");
    } catch (error) {
        console.log(error.message);
    }
};

// ? ------------------------------------------ user side ------------------------------------------------------

// ! coupon page
const couponPage = async (req, res) => {
    try {
        const User = req.session.userId
        const coupon = await Coupon.find({})
        res.render('coupon', { coupon, User })
    } catch (error) {
        console.log(error)
    }
}


module.exports = {
    addCouponPage,
    insertCoupon,
    couponList,
    unlistCoupon,
    couponDetails,
    loadEditCoupon,
    insertEditCoupon,
    couponPage
}

