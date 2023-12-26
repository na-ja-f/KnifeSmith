// !  models
// * user model
const user = require("../models/userModel");
// * category model
const category = require('../models/categoriesModel')
// * product model
const product = require('../models/productModel')

//? -------------------------------------------------user side----------------------------------------------------------


// const productList = async (req, res) => {
//     try {
//         const categoryData = await category.find({});
//         const itemsPerPage = 9;
//         let currentPage = parseInt(req.query.page) || 1;
//         currentPage = currentPage > 0 ? currentPage : 1;

//         if (req.query.category) {
//             const Category = req.query.category;
//             const totalProducts = await product.countDocuments({ category: Category });
//             const productData = await product
//                 .find({ category: Category })
//                 .skip((currentPage - 1) * itemsPerPage)
//                 .limit(itemsPerPage);

//             res.render('productList', {
//                 productData, categoryData, currentPage, totalProducts,
//                 totalPages: Math.ceil(totalProducts / itemsPerPage),
//             });
//         } else {
//             const totalProducts = await product.countDocuments({});
//             const productData = await product
//                 .find({})
//                 .skip((currentPage - 1) * itemsPerPage)
//                 .limit(itemsPerPage);

//             res.render('productList', {
//                 productData, categoryData, currentPage, totalProducts,
//                 totalPages: Math.ceil(totalProducts / itemsPerPage),
//             });
//         }
//     } catch (error) {
//         console.log(error.message);
//     }
// };


// ! product list page 

const productList = async (req, res) => {
    try {
        const categoryData = await category.find({});
        const itemsPerPage = 9;
        let currentPage = parseInt(req.query.page) || 1;
        currentPage = currentPage > 0 ? currentPage : 1;

        let filterCriteria = {};

        const searchQuery = req.query.search;
        if (searchQuery) {
            filterCriteria.name = { $regex: new RegExp(searchQuery, "i") };
        }

        // filter search
        if(req.query.searchcategory){
            filterCriteria.category = { $in: req.query.searchcategory };
        }
        if(req.query.searchcolor){
            filterCriteria.productColor = { $in: req.query.searchcolor };
        }
        if(req.query.searchmechanism){
            filterCriteria.mechanism = { $in: req.query.searchmechanism };
        }
        if(req.query.searchstyle){
            filterCriteria.bladeStyle = { $in: req.query.searchstyle };
        }
        if(req.query.searchsteel){
            filterCriteria.bladeSteel = { $in: req.query.searchsteel };
        }
        if(req.query.searchweight){
            filterCriteria.weight = { $in: req.query.searchweight };
        }
        // filter search end

        // ? for category part in home page
        if (req.query.category) {
            filterCriteria.category = req.query.category
        }

        // ? checking what are the filters 

        if (req.body.category) {
            filterCriteria.category = { $in: req.body.category };
        }

        if (req.body.color) {
            filterCriteria.productColor = { $in: req.body.color };
        }

        if (req.body.mechanism) {
            filterCriteria.mechanism = { $in: req.body.mechanism };
        }

        if (req.body.style) {
            filterCriteria.bladeStyle = { $in: req.body.style };
        }
        if (req.body.steel) {
            filterCriteria.bladeSteel = { $in: req.body.steel };
        }
        if (req.body.weight) {
            filterCriteria.weight = { $in: req.body.weight };
        }



        const totalProducts = await product.countDocuments(filterCriteria);
        let num = 0;
        if (req.query.sort) {
            num = req.query.sort
        }
        const productData = await product.find(filterCriteria).populate('category').sort({ price: num }).skip((currentPage - 1) * itemsPerPage).limit(itemsPerPage);

        // Save selected filter values to be passed to the template
        const selectedFilters = {
            category: req.body.category?req.body.category:req.query.searchCategory || [],
            color: req.body.color?req.body.color:req.query.searchcolor || [],
            mechanism: req.body.mechanism?req.body.mechanism:req.query.searchmechanism || [],
            style: req.body.style?req.body.style:req.query.searchstyle || [],
            steel: req.body.steel?req.body.steel:req.query.searchsteel || [],
            weight: req.body.weight?req.body.weight:req.query.searchweight || [],
        };

        res.render('productList', {
            productData, categoryData, currentPage, totalProducts, num,
            totalPages: Math.ceil(totalProducts / itemsPerPage), selectedFilters
        });
    } catch (error) {
        console.log(error.message);
    }
};

const clearFilters = async (req, res) => {
    try {
        res.redirect('/productList');
    } catch (error) {
        console.log(error.message);
    }
};

// ! product page 
const productPage = async (req, res) => { 
    try {
        const id = req.query.id;
        const relatedProducts = await product.find({ _id: { $ne: id } }).populate('category').limit(4)
        const productData = await product.findOne({ _id: id }).populate('category')
        res.render('productPage', { productData, relatedProducts })
    } catch (error) {
        console.log(error.message);
    }
}

// ? -------------------------------------------------USER SIDE END------------------------------------------------------

// ?-------------------------------------------------ADMIN SIDE----------------------------------------------------------


// ! load product list 
const adminProductList = async (req, res) => {
    try {
        const itemsPerPage = 5;
        let currentPage = parseInt(req.query.page) || 1;
        currentPage = currentPage > 0 ? currentPage : 1
        const totalProducts = await product.countDocuments({})

        if (req.query.view) {
            view = req.query.view;
            const productData = await product.find({ isListed: view }).populate('category').skip((currentPage - 1) * itemsPerPage).limit(itemsPerPage)
            res.render('adminProductList', { productData, currentPage, totalPages: Math.ceil(totalProducts / itemsPerPage) })
        }

        const productData = await product.find({}).populate('category').skip((currentPage - 1) * itemsPerPage).limit(itemsPerPage)
        res.render('adminProductList', { productData, currentPage, totalPages: Math.ceil(totalProducts / itemsPerPage) })
    } catch (error) {
        console.log(error.message)
    }
}

//! ad dproduct page
const addProductPage = async (req, res) => {
    try {
        const Category = await category.find({})
        res.render('addProduct', { Category })
    } catch (error) {
        console.log(error.message);
    }
}

// ! insert product 
const insertProduct = async (req, res) => {
    try {
        const image = [];
        if (req.files) {
            for (const file of req.files) {
                image.push(file.filename);
            }
        }

        const productData = new product({
            name: req.body.title,
            category: req.body.category,
            price: req.body.price,
            discountPrice: req.body.price,
            quantity: req.body.quantity,
            productImages: image,
            productColor: req.body.color,
            handle: req.body.handle,
            mechanism: req.body.mechanism,
            bladeStyle: req.body.style,
            bladeSteel: req.body.steel,
            weight: req.body.weight,
            bladeLength: req.body.length,
            description: req.body.description
        });

        const sameProduct = await product.findOne({ name: productData.name });

        if (sameProduct) {
            const Category = await category.find({})
            res.render('addProduct', { Category, message: 'same product title exists' })
        } else {
            await productData.save();
            res.redirect('/admin/adminProductList')
        }


    } catch (error) {
        console.log(error.message);
    }
}

// ! list and unlist product
const listProduct = async (req, res) => {
    try {
        const id = req.query.id;
        await product.updateOne({ _id: id }, { isListed: true });

        res.redirect("/admin/adminProductList");
    } catch (error) {
        console.log(error.message);
    }
}
const unlistProduct = async (req, res) => {
    try {
        const id = req.query.id;
        await product.updateOne({ _id: id }, { isListed: false });

        res.redirect("/admin/adminProductList");
    } catch (error) {
        console.log(error.message);
    }
}

// ! product info page
const viewProductInfo = async (req, res) => {
    try {
        const id = req.query.id;
        const products = await product.findOne({ _id: id });
        res.render('viewProductInfo', { products })
    } catch (error) {
        console.log(error.message);
    }
}

// ! edit product
const editProduct = async (req, res) => {
    try {
        const id = req.query.id
        const productData = await product.findOne({ _id: id })
        const Category = await category.find({})
        res.render('editProduct', { message: '', Category, productData })
    } catch (error) {
        console.log(error);
    }
}

// ! insert edit product
const insertEditProduct = async (req, res) => {
    try {
        const id = req.body.id;
        const updateData = await product.findOne({ _id: id });
        if (!updateData) {
            res.render('editProduct', { message: 'user not found' })
        }

        const existingImages = updateData.productImages;

        if (req.body.title) {
            updateData.name = req.body.title
        }
        if (req.body.category) {
            updateData.category = req.body.category
        }
        if (req.body.price) {
            updateData.price = req.body.price;
            updateData.discountPrice = req.body.price;
        }
        if (req.body.quantity) {
            updateData.quantity = req.body.quantity
        }
        if (req.body.color) {
            updateData.productColor = req.body.color
        }
        if (req.body.handle) {
            updateData.handle = req.body.handle
        }
        if (req.body.mechanism) {
            updateData.mechanism = req.body.mechanism
        }
        if (req.body.style) {
            updateData.bladeStyle = req.body.style
        }
        if (req.body.steel) {
            updateData.bladeSteel = req.body.steel
        }
        if (req.body.weight) {
            updateData.weight = req.body.weight
        }
        if (req.body.length) {
            updateData.bladeLength = req.body.length
        }
        if (req.body.description) {
            updateData.description = req.body.description
        }
        if (req.files) {
            req.files.forEach((file, index) => {
                if (existingImages[index]) {
                    existingImages[index] = file.filename
                }
            });

            updateData.productImages = existingImages
        }

        await updateData.save();
        res.redirect('/admin/adminProductList')

    } catch (error) {
        console.log(error.message);
    }
}


// ?-------------------------------------------------ADMIN SIDE END----------------------------------------------------------

module.exports = {
    productList,
    productPage,
    clearFilters,
    adminProductList,
    addProductPage,
    insertProduct,
    listProduct,
    unlistProduct,
    viewProductInfo,
    editProduct,
    insertEditProduct
}