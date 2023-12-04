const mongoose = require('mongoose');

const userotpVerificationSchema = new mongoose.Schema({
    userId: String,
    otp: String,
    createdAt: Date,
    expiresAt: Date
})

const userOtpVerification = mongoose.model('userOtpVerification', userotpVerificationSchema);

module.exports = userOtpVerification;