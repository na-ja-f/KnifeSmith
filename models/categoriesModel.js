const mongoose = require('mongoose');

const categoriesSchema = new mongoose.Schema({
    category: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    isListed: {
        type: Boolean,
        default: true
    }
})

module.exports = mongoose.model('category', categoriesSchema)