const mongoose = require('mongoose')

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URL);
        if (conn) {
            console.log('server created succesfully')
        }

    } catch (error) {
        console.log(error.message);
    }

}

module.exports = connectDB;
