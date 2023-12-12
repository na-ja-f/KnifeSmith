const Banner = require("../models/bannerModel");
const Category = require("../models/categoriesModel");
const Product = require("../models/productModel");

// ! banner adding page
const loadBannerAdd = async (req, res) => {
    try {
        const category = await Category.find();
        const product = await Product.find();
        const admin = req.session.adminData;
        res.render("bannerAdd", { admin, category, product });
    } catch (error) {
        console.log(error.message);
    }
};

// ! add a banner
const addBanner = async (req, res) => {
    try {
        if (!req.body) {
            res.redirect("/admin/bannerAdd");
        }

        const image = req.file.filename;

        const {
            title,
            description,
            subtitle,
        } = req.body;
        const newBanner = new Banner({
            title,
            image,
            description,
            subtitle,
        });
        newBanner.bannerType = req.body.bannerType;
        await newBanner.save();

        res.redirect("/admin/bannerList");
    } catch (error) {
        console.log(error.message);
    }
};

// ! banner list page
const bannerList = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        let query = {};
        const limit = 7;
        const totalCount = await Banner.countDocuments(query);

        const totalPages = Math.ceil(totalCount / limit);

        const banner = await Banner.find({})
            .skip((page - 1) * limit)
            .limit(limit)
        res.render("bannerList", { banner, totalPages, currentPage: page });
    } catch (error) {
        console.log(error.message);
    }
};

// ! banner edit page
const loadBannerEdit = async (req, res) => {
    try {
        const BannerId = req.query.bannerId;
        const banner = await Banner.findById(BannerId)
        res.render("bannerEdit", {
            banner
        });
    } catch (error) {
        console.log(error.message);
    }
};

// ! edit a banner
const bannerEdit = async (req, res) => {
    try {
        const bannerId = req.body.bannerId;
        const bannerData = await Banner.findById(bannerId);
        if (req.body.title) {
            bannerData.title = req.body.title;
        }
        if (req.body.description) {
            bannerData.description = req.body.description;
        }
        if (req.body.subtitle) {
            bannerData.subtitle = req.body.subtitle;
        }
        if (req.file) {
            bannerData.image = req.file.filename;
        }
        await bannerData.save();
        res.redirect("/admin/bannerList");
    } catch (error) {
        console.log(error.message);
    }
};

// ! list and unlist banner
const blockBanner = async (req, res) => {
    try {
        const id = req.query.bannerId;
        const bannerData = await Banner.findById(id);

        if (bannerData.isListed === false) {
            bannerData.isListed = true;
        } else {
            bannerData.isListed = false;
        }

        await bannerData.save();
        res.redirect("/admin/bannerList");
    } catch (error) {
        console.log(error.message);
    }
};

module.exports = {
    loadBannerAdd,
    addBanner,
    bannerList,
    loadBannerEdit,
    bannerEdit,
    blockBanner,
};