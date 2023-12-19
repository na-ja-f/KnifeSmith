const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: String,
  category:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'category'
  },
  price: Number,
  discountPrice: Number,
  quantity: Number,
  productImages: [String],
  productColor: String,
  handle: String,
  mechanism: String,
  bladeStyle: String,
  bladeSteel: String,
  weight: String,
  bladeLength: String,
  description: String,
  isListed: {
    type: Boolean,
    default: true
  },
  createDate: {
    type: Date,
    default: Date.now,
  },
  discountStatus: {
    type: Boolean,
    default: false
  },
  discount: Number,
  discountStart: Date,
  discountEnd: Date,
});

module.exports = mongoose.model('Product', productSchema);