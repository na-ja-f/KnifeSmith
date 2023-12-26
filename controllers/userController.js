const bcrypt = require("bcrypt");

// ? requiring dotenv
require('dotenv').config();

// !  models
// * user model
const user = require("../models/userModel");
// * category model
const category = require('../models/categoriesModel')
// * product model
const product = require('../models/productModel')
// * address model 
const address = require('../models/addressModel')
// * order model 
const order = require('../models/orderModel')
// * banner model 
const Banner = require('../models/bannerModel')
// * transaction model 
const Transaction = require("../models/transactionModel");

// * helpers
const mailing = require('../helpers/mailing')


// ! home
const homepage = async (req, res) => {
  try {
    const productData = await product.find({}).limit(5)
    const catData = await category.find({});
    const banData = await Banner.find({ isListed: true });
    res.render("home", { session: req.session, catData, productData, banData });
  } catch (error) {
    console.log(error.message);
  }
};

// ! registration
const register = async (req, res) => {
  try {
    res.render("register", { errors: '' });
  } catch (error) {
    console.log(error.message);
  }
};

// * password hash
const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
    throw error;
  }
};

// ! user insert
const insertUser = async (req, res) => {
  try {
    req.session.referralCode = req.body.referralCode || null;
    const referralCode = req.session.referralCode;

    let referrer;
    if (referralCode) {
      referrer = await user.findOne({ referralCode });

      if (!referrer) {
        res.render("registration", { message: "Invalid referral code." });
      }

      if (referrer.referredUsers.includes(req.body.email)) {
        res.render("registration", {
          message: "Referral code has already been used by this email.",
        });
      }
    }

    const spassword = await securePassword(req.body.password);
    const User = new user({
      name: req.body.name,
      email: req.body.email,
      mobile: req.body.mobile,
      password: spassword,
    });

    const semail = await user.findOne({ email: User.email })

    if (semail) {
      return res.render('register', { message: "email exists" })
    } else {
      const userData = await User.save();
      req.session.user_id = userData._id;
      req.session.email = userData.email;

      if (userData) {
        mailing.sendVarifyMail(req, req.body.name, req.body.email);
        return res.redirect('/otpVerification');
      } else {
        return res.render('register', { message: "registration have failed try again" })
      }
    }
  } catch (error) {
    console.error(error);
    return res.render('register', { message: "An error occurred during registration try again" });
  }
};


// ! verifying otp
const verifyOtp = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const userData = await user.findById(userId);

    const otpGeneratedTime = req.session.otpGeneratedTime;
    const currentTime = Date.now();

    if (currentTime - otpGeneratedTime > 60 * 1000) {
      res.render("otp-validation", {
        message: "OTP expired",
        otpGeneratedTime,
      });
      return;
    }

    if (userData) {
      const firstDigit = req.body.first;
      const secondDigit = req.body.second;
      const thirdDigit = req.body.third;
      const fourthDigit = req.body.fourth;
      const fullOTP = firstDigit + secondDigit + thirdDigit + fourthDigit;

      if (fullOTP === req.session.otp) {
        delete req.session.otp;
        delete req.session.user_id;
        delete req.session.registerOtpVerify;

        if (req.session.referralCode) {
          await user.updateOne({ _id: userId }, { walletBalance: 50 });
          const referrer = await user.findOne({
            referralCode: req.session.referralCode,
          });
          const User = await user.findOne({ _id: userId });
          referrer.referredUsers.push(User.email);
          referrer.walletBalance += 100;
          await referrer.save();

          const referredUserTransaction = new Transaction({
            user: referrer._id,
            amount: 100,
            type: "credit",
            date: Date.now(),
            paymentMethod: "Wallet",
            description: "Referral Bonus",
          });
          const referrerTransaction = new Transaction({
            user: userId,
            amount: 50,
            type: "credit",
            date: Date.now(),
            paymentMethod: "Wallet",
            description: "Referral Bonus",
          });
          await referredUserTransaction.save();
          await referrerTransaction.save();
        }

        userData.is_varified = 1;
        await userData.save();
        res.render("verifiedOtp");
      } else {
        res.render("otpVerification", {
          message: "Invalid otp",
          otpGeneratedTime: otpGeneratedTime,
        });
      }
    } else {
      res.render("otpVerification", {
        message: "User Not Found",
        otpGeneratedTime: otpGeneratedTime,
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

// ! Resend OTP
const resendOtp = async (req, res) => {
  try {
    const otpGeneratedTime = req.session.otpGeneratedTime;
    const userId = req.session.user_id;
    const userData = await user.findById(userId);
    if (userData) {
      delete req.session.otp;

      mailing.sendVarifyMail(req, userData.name, userData.email);

      res.render("otpVerification", {
        message: "OTP has been resent.",
        otpGeneratedTime: otpGeneratedTime,
      });
    } else {
      res.render("otpVerification", {
        message: "User not found",
        otpGeneratedTime: otpGeneratedTime,
      });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


// ! otpPage
const otpPage = async (req, res) => {
  try {
    const otpGeneratedTime = req.session.otpGeneratedTime;
    res.render("otpVerification", { otpGeneratedTime });
  } catch (error) {
    console.log(error.message);
  }
};

// ! login
const login = async (req, res) => {
  try {
    res.render("login");
  } catch (error) {
    console.log(error.message);
  }
};

// ! verify login
const verifyLogin = async (req, res) => {
  try {
    let email = req.body.email;
    let password = req.body.password;

    const userData = await user.findOne({ email: email });

    if (userData) {
      let passwordMatch = await bcrypt.compare(password, userData.password);
      if (passwordMatch) {
        if (userData.is_varified == 0) {
          res.render('login', { message: 'account isnt verified' });
        } else if (userData.is_blocked == 1) {
          res.render('login', { message: 'account is blocked by admin' });
        } else {
          req.session.userId = userData._id;
          res.redirect('/');
        }
      } else {
        res.render('login', { message: 'email and password incorrect' })
      }
    } else {
      res.render('login', { message: 'user not found,please register or try another email' })
    }

  } catch (error) {
    console.log(error);
  }
}

// ! 404
const errorPage = (req, res) => {
  try {
    res.render('404')
  } catch (error) {
    console.log(error.message);
  }
}

// !userprofile
const profile = async (req, res) => {
  try {
    const id = req.session.userId
    const userData = await user.find({ _id: id });
    const addresses = await address.find({ user: id }).sort({ createdDate: -1 }).exec();
    const userOrders = await order.find({
      user: id,
      paymentStatus: "Payment Successful",
    });
    const totalOrders = userOrders.length;
    const totalSpending = userOrders.reduce(
      (acc, order) => acc + order.totalAmount,
      0
    );
    const uniqueProductIds = new Set(userOrders.flatMap(order => order.items.map(item => item.product)));
    const totalUniqueProducts = uniqueProductIds.size;
    const orderData = await order.find({ user: id })
      .populate('user')
      .populate({
        path: 'address',
        model: 'Address',
      })
      .populate({
        path: 'items.product',
        model: 'Product',
      }).sort({ orderDate: -1 })

    res.render('profile', { userData, addresses, orderData, totalOrders, totalSpending, totalUniqueProducts })
  } catch (error) {
    console.log(error.message);
  }
}

// ! logout
const logout = async (req, res) => {
  try {
    req.session.destroy();
    res.redirect('/')
  } catch (error) {
    console.log(error.message);
  }
}

// ! resetPage
const resetPage = async (req, res) => {
  try {
    res.render('resetPassword')
  } catch (error) {
    console.log(error.mesasge);
  }
}

// ! sending mail for password change
const forgetPassword = async (req, res) => {
  try {
    const email = req.body.email;
    const userData = await user.findOne({ email: email })
    if (userData) {
      await mailing.sendResetPassword(email, userData.password);
      res.render('newPassword');
    } else {
      res.render('resetPassword', { message: 'email does not exist,please register or try another email' })
    }
  } catch (error) {
    console.log(error.message)
  }
}

// ! changing password page
const newPassword = async (req, res) => {
  try {
    const code = req.body.code;
    const password = req.body.password;
    const userData = await user.findOne({ password: code });
    const spassword = await securePassword(password);
    const updatePassword = await user.updateOne({ password: code }, { $set: { password: spassword } })
    if (updatePassword) {
      res.render('newPassword', { message: 'password changed go to login page' })
    } else {
      res.render('newPassword', { message: 'invalid code' })
    }

  } catch (error) {
    console.log(error.message);
  }
}

// ! load wallet 

const loadWallet = async (req, res) => {
  try {
    const id = req.session.userId;
    const userData = await user.findById(id);
    const transactions = await Transaction.aggregate([
      { $match: { user: userData._id, paymentMethod: "Wallet" } },
      { $sort: { date: -1 } },
    ]);

    res.render("wallet", { User: userData, transactions });
  } catch (error) {
    console.log(error.message);
  }
};

// ! contact
const contact = async (req, res) => {
  try {
    res.render('contact')
  } catch (error) {
    console.log(error)
  }
}


module.exports = {
  homepage,
  register,
  insertUser,
  login,
  verifyOtp,
  resendOtp,
  otpPage,
  errorPage,
  verifyLogin,
  profile,
  logout,
  resetPage,
  forgetPassword,
  newPassword,
  loadWallet,
  contact,
};
