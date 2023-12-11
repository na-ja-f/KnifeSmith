const bcrypt = require("bcrypt");
const nodemailer = require('nodemailer');
const { body, validationResult } = require('express-validator');

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

// ? node mailer
const sendVarifyMail = async (req, name, email) => {
  try {
    const otp = sendOtpVerification(4);
    req.session.otp = otp;
    console.log(req.session.otp);
    req.session.otpGeneratedTime = Date.now();
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: "neganishere73@gmail.com",
        pass: "rrhm xbbp yrnh cras",
      },
    });

    const mailOptions = {
      from: "neganishere73@gmail.com",
      to: email,
      subject: "For verification purpose",
      html: `<p>Hello ${name}, please enter this OTP: <strong>${otp}</strong> to verify your email.</p>`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
      } else {
        console.log("Email has been sent:", info.response);
      }
    });
  } catch (error) {
    console.log(error);
  }
};

// ! home
const homepage = async (req, res) => {
  try {
    const productData = await product.find({}).limit(5)
    const catData = await category.find({});
    const banData = await Banner.find({});
    res.render("home", { session: req.session, catData, productData,banData });
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

// ! Validation middleware for registration route
const registrationValidation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Invalid email address'),
  body('mobile').isLength({ min: 10 }).withMessage('Mobile number should have at least 10 characters'),
  body('password').isLength({ min: 6 }).withMessage('Password should have at least 6 characters'),
];

// ! user insert
const insertUser = async (req, res) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
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
        sendVarifyMail(req, req.body.name, req.body.email);
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

// * send otp verification
// *otp senting
function sendOtpVerification(length) {
  const characters = "0123456789";
  let otp = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    otp += characters[randomIndex];
  }

  return otp;
}

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

      sendVarifyMail(req, userData.name, userData.email);

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

    res.render('profile', { userData, addresses, orderData })
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

// * mailoption for password change
const sendResetPassword = async (email, password) => {
  try {
    const mailOptions = {
      from: process.env.AUTH_EMAIL,
      to: email,
      subject: 'your password',
      html: `<p>this is your <b> ${password} <b> password</p>`
    };

    await transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
      } else {
        console.log('email has been sent', info.response);
      }
    });

    return true;
  } catch (error) {
    return false;
  }
};

// *sending mail for password change
const forgetPassword = async (req, res) => {
  try {
    const email = req.body.email;
    const userData = await user.findOne({ email: email })
    if (userData) {
      await sendResetPassword(email, userData.password);
      res.render('newPassword');
    } else {
      res.render('resetPassword', { message: 'email does not exist,please register or try another email' })
    }
  } catch (error) {
    console.log(error.message)
  }
}

// * changing password page
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

    res.render("wallet", { User: userData });
  } catch (error) {
    console.log(error.message);
  }
};


module.exports = {
  homepage,
  register,
  insertUser,
  login,
  registrationValidation,
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
  loadWallet
};
