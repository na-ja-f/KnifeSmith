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
    },
    discountStatus:{
        type:Boolean,
        default:false
      },
      discount:String,
      discountStart:Date,
      discountEnd:Date,
})

module.exports = mongoose.model('category', categoriesSchema)