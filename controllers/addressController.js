// !  models
// * address model 
const address = require('../models/addressModel')
// * user model
const user = require("../models/userModel");

// ! add address page
const addAdressPage = async (req, res) => {
    try {
        res.render('addAddress')
    } catch (error) {
        console.log(error.message)
    }
}

// !insert address
const insertAddress = async (req, res) => {
    try {
        const userId = req.session.userId
        const newAddress = new address({
            user: userId,
            type: req.body.type,
            phone: req.body.phone,
            houseName: req.body.houseName,
            name: req.body.name,
            street: req.body.street,
            city: req.body.city,
            state: req.body.state,
            pincode: req.body.pincode,
        })

        await newAddress.save();

        if (req.query.checkout) {
            res.redirect('/checkoutPage');
        } else {
            res.redirect('/profile');
        }



    } catch (error) {
        console.log(error.message)
    }
}

// ! delete address
const deleteAddress = async (req, res) => {
    try {
        const addressId = req.query.addressId
        await address.deleteOne({ _id: addressId })
        res.redirect('/profile');
    } catch (error) {
        console.log(error.message)
    }
}

// ! edit address
const editAddress = async (req, res) => {
    try {
        const addressId = req.query.addressId;
        const addressData = await address.findById(addressId);
        res.render('editAddress', { addressData });
    } catch (error) {
        console.log(error.message)
    }
}

// ! insert edit address
const insertEditAddress = async (req, res) => {
    try {
        const userId = req.session.userId
        const addressId = req.body.addressId;
        const addressData = await address.findById(addressId);

        if (req.body.type) {
            addressData.type = req.body.type
        }
        if (req.body.phone) {
            addressData.phone = req.body.phone
        }
        if (req.body.houseName) {
            addressData.houseName = req.body.houseName
        }
        if (req.body.name) {
            addressData.name = req.body.name
        }
        if (req.body.street) {
            addressData.street = req.body.street
        }
        if (req.body.city) {
            addressData.city = req.body.city
        }
        if (req.body.state) {
            addressData.state = req.body.state
        }
        if (req.body.pincode) {
            addressData.pincode = req.body.pincode
        }

        await addressData.save();

        res.redirect('/profile');

    } catch (error) {
        console.log(error.message)
    }
}

module.exports = {
    addAdressPage,
    insertAddress,
    deleteAddress,
    editAddress,
    insertEditAddress
}