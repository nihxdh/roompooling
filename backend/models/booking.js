const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    accommodation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Accomodation',
        required: true
    },
    host: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Host',
        required: true
    },
    checkIn: {
        type: Date,
        required: true
    },
    checkOut: {
        type: Date,
        required: true
    },
    spaces: {
        type: Number,
        required: true,
        default: 1,
        min: 1
    },
    selectedAmenities: [{
        name: { type: String, required: true },
        rate: { type: Number, required: true }
    }],
    totalPrice: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'rejected', 'cancelled'],
        default: 'pending'
    }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
