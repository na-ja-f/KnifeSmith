const mongoose = require('mongoose');

const wishlistItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
    }
});

const wishlistSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
    },
    items: [wishlistItemSchema],
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Wishlist', wishlistSchema);