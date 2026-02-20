const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    dob: {
        type: Date,
        required: true
    },
    gender: {
        type: String,
        required: true
    },
    occupation: {
        type: String,
        enum: ['Student', 'Employee', 'Other'],
        default: 'Other'
    }
}, { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);