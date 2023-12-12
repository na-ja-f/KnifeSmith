const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  title: String,
  subtitle: String,
  image: String,
  description: String,
  isListed: {
    type: Boolean,
    default: true
  }

});



module.exports = mongoose.model('Banner', bannerSchema);;