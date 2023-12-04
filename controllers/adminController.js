
// ! require models
// * user model
const user = require("../models/userModel");
// * category model
const category = require('../models/categoriesModel')
// * product model
const product = require('../models/productModel')

// * dotenv
require("dotenv").config();

const adminLogin = async (req, res) => {
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

    if (
      email == process.env.ADMIN_EMAIL &&
      password == process.env.ADMIN_PASS
    ) {
      req.session.adminId = password;
      res.redirect("/admin/dashboard");
    } else {
      res.render("login", { message: "email and password incorrect" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

//   ! dashboard
const loadDashboard = async (req, res) => {
  try {
    res.render("dashboard");
  } catch (error) {
    console.log(error.message);
  }
};

// ! logout
const logout = async (req, res) => {
  try {
    req.session.destroy();
    res.redirect('/')
  } catch (error) {
    console.log(error.message);
  }
}

// ! load user
const loadUsers = async (req, res) => {
  try {
    const userData = await user.find({});
    const itemsPerPage = 5;
    let currentPage = parseInt(req.query.page) || 1;
    currentPage = currentPage > 0 ? currentPage : 1;
    const totalProducts = await user.countDocuments({})


    res.render("usersPage", { userData, currentPage, totalPages: Math.ceil(totalProducts / itemsPerPage) });
  } catch (error) {
    console.log(error.message);
  }
}

// ! block and unblock user
const blockUser = async (req, res) => {
  try {
    const id = req.query.id;
    if (id == req.session.userId) {
      delete req.session.userId;
    }
    await user.updateOne({ _id: id }, { is_blocked: 1 });
    res.redirect("/admin/usersPage");
  } catch (error) {
    console.log(error.message);
  }
}

const unblockUser = async (req, res) => {
  try {
    const id = req.query.id;
    await user.updateOne({ _id: id }, { is_blocked: 0 });
    res.redirect("/admin/usersPage");
  } catch (error) {
    console.log(error.message);
  }
}


module.exports = {
  adminLogin,
  verifyLogin,
  loadDashboard,
  logout,
  loadUsers,
  blockUser,
  unblockUser
};
