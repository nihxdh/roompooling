const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
    seeker: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    host: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Host',
        required: true
    },
    accommodation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Accomodation',
        required: true
    },
    lastMessage: {
        type: String,
        default: ''
    },
    lastMessageAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

conversationSchema.index({ seeker: 1, host: 1, accommodation: 1 }, { unique: true });

module.exports = mongoose.model('Conversation', conversationSchema);
