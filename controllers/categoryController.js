// !  models
// * user model
const user = require("../models/userModel");
// * user otp model
const userOtpVerification = require("../models/otpVerificationModel");
// * category model
const category = require('../models/categoriesModel')
// * product model
const product = require('../models/productModel')


// ! categories list 
const categoriesList = async (req, res) => {
  try {
    const itemsPerPage = 5;
    let currentPage = parseInt(req.query.page) || 1;
    currentPage = currentPage > 0 ? currentPage : 1
    const totalProducts = await category.countDocuments({})

    const catData = await category.find({}).skip((currentPage - 1) * itemsPerPage).limit(itemsPerPage);

    res.render('categoriesList', { catData, currentPage, totalPages: Math.ceil(totalProducts / itemsPerPage) });

  } catch (error) {
    console.log(error.message);
  }
}

// !  add categories page 
const addCategories = async (req, res) => {
  try {
    res.render('addCategories');
  } catch (error) {
    console.log(errror.message);
  }
}

// ! insert category
const insertCategory = async (req, res) => {
  try {
    let cat = new category({
      category: req.body.name,
      description: req.body.description,
      image: req.file.filename
    })

    let sameCat = await category.findOne({ category: { $regex: new RegExp(cat.category, "i") } })
    if (sameCat) {
      res.render('addCategories', { message: 'category exists' })
    } else {
      await cat.save();
      res.redirect('/admin/categoriesList')
    }
  } catch (error) {
    console.log(error.message);
  }
}

// ! list and unlist ctegory
const listCat = async (req, res) => {
  try {
    const id = req.query.id;
    await category.updateOne({ _id: id }, { isListed: true });
    const catData = await category.findOne({ _id: id })
    await product.updateMany({ category: catData.category }, { $set: { isListed: true } })
    res.redirect("/admin/categoriesList");
  } catch (error) {
    console.log(error.message);
  }
}
const unlistCat = async (req, res) => {
  try {
    const id = req.query.id;
    await category.updateOne({ _id: id }, { isListed: false });
    const catData = await category.findOne({ _id: id })
    await product.updateMany({ category: catData.category }, { $set: { isListed: false } })
    res.redirect("/admin/categoriesList");
  } catch (error) {
    console.log(error.message);
  }
}

// ! edit categories page
const editCategory = async (req, res) => {
  try {
    const id = req.query.id;
    const catData = await category.findOne({ _id: id });
    res.render('editCategory', { catData });
  } catch (error) {
    console.log(error.message);
  }
}

// ! insert edit category
const insertEditCategory = async (req, res) => {
  try {
    const id = req.body.id;
    const sameCat = await category.findOne({ _id: { $ne: id }, category: { $regex: new RegExp(req.body.name, "i") } });
    const updateData = await category.findById(id);
    if (sameCat) {
      res.render('editCategory', { catData: updateData, message: 'Category with the same name exists, try another name' });
    } else {

      if (req.body.name) {
        updateData.category = req.body.name;
      }

      if (req.body.description) {
        updateData.description = req.body.description;
      }

      if (req.file) {
        updateData.image = req.file.filename;
      }

      await updateData.save();
      res.redirect("/admin/categoriesList");
    }
  } catch (error) {
    console.log(error.message);
  }
}


module.exports = {
  categoriesList,
  addCategories,
  insertCategory,
  unlistCat,
  listCat,
  editCategory,
  insertEditCategory,
}