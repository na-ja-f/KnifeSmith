const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    image: {
        type: String,
        require: true,
        default: "imgs/theme/avatar.png"
    },
    email: {
        type: String,
        required: true
    },
    mobile: {
        type: Number,
        required: true
    },
    password: {
        type: String,
        required: true
    },

    is_varified: {
        type: Number,
        default: 0
    },

    is_blocked: {
        type: Number,
        default: 0
    },
    createdDate: {
        type: Date,
        default: Date.now()
    },
    walletBalance: {
        type: Number,
        default: 0
    }
})

module.exports = mongoose.model('user', userSchema)