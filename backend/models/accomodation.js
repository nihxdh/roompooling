const mongoose = require('mongoose');

const accomodationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    images: {
        type: [String],
        required: true
    },
    roomspace: {
        total_space: {
            type: Number,
            required: true
        },
        available_space: {
            type: Number
        }
    },
    amenities: [{
        name: { type: String, required: true },
        rate: { type: Number, required: true }
    }],
    availability: {
        type: Boolean,
        default: true
    },
    rating: {
        type: Number,
        default: 0
    },
    reviews: {
        type: [String],
        required: true
    },
    host: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Host',
        required: true
    },
    status: {
        type: String,
        enum: ['verified', 'pending', 'rejected'],
        default: 'pending'
    }
}, { timestamps: true }
);

module.exports = mongoose.model('Accomodation', accomodationSchema);