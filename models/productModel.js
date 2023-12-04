const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: String,
  category: String,
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
  orderDate: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Product', productSchema);