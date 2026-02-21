const express = require('express');
const jwt = require('jsonwebtoken');
const path = require('path');
const Host = require('../models/host');
const Accomodation = require('../models/accomodation');
const Booking = require('../models/booking');
const Conversation = require('../models/conversation');
const Message = require('../models/message');
const hostAuth = require('../middleware/hostAuth');
const { uploadImages, slugify } = require('../config/multer');
const hostRoutes = express.Router();

const HOST_OTP = '9876';

const handleMulterError = (fn) => (req, res, next) => {
    fn(req, res, (err) => {
        if (err && err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large. Max 5MB per image.' });
        }
        if (err && err.message?.includes('Only image files')) {
            return res.status(400).json({ error: err.message });
        }
        if (err) return next(err);
        next();
    });
};

const parseBodyField = (val) => {
    if (typeof val === 'string') {
        try { return JSON.parse(val); } catch { return val; }
    }
    return val;
};

// ========== Auth ==========

// POST /api/host/register
hostRoutes.post('/register', async (req, res) => {
    try {
        const { name, email, phone } = req.body;

        if (!name || !email || !phone) {
            return res.status(400).json({ error: 'Name, email and phone are required' });
        }

        const existing = await Host.findOne({ $or: [{ email }, { phone }] });
        if (existing) {
            const field = existing.email === email ? 'Email' : 'Phone';
            return res.status(400).json({ error: `${field} already registered` });
        }

        const host = await Host.create({ name, email, phone });

        res.status(201).json({
            success: true,
            message: 'Host registration successful',
            host: { id: host._id, name: host.name, email: host.email, phone: host.phone }
        });
    } catch (err) {
        res.status(500).json({ error: err.message || 'Registration failed' });
    }
});

// POST /api/host/login
hostRoutes.post('/login', async (req, res) => {
    try {
        const { phone, otp } = req.body;

        if (!phone || !otp) {
            return res.status(400).json({ error: 'Phone number and OTP are required' });
        }

        const host = await Host.findOne({ phone });
        if (!host) {
            return res.status(404).json({ error: 'Phone number not registered. Please register first.' });
        }

        if (otp !== HOST_OTP) {
            return res.status(401).json({ error: 'Invalid OTP' });
        }

        const token = jwt.sign(
            { hostId: host._id, role: 'host', phone: host.phone },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            token,
            expiresIn: '7d',
            host: { id: host._id, name: host.name, email: host.email, phone: host.phone }
        });
    } catch (err) {
        res.status(500).json({ error: err.message || 'Login failed' });
    }
});

// ========== Profile (protected) ==========

// GET /api/host/profile
hostRoutes.get('/profile', hostAuth, async (req, res) => {
    try {
        const host = await Host.findById(req.hostData.hostId);
        if (!host) return res.status(404).json({ error: 'Host not found' });
        res.json({ success: true, host });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/host/profile
hostRoutes.put('/profile', hostAuth, async (req, res) => {
    try {
        const { name, email, phone } = req.body;
        const updates = {};
        if (name !== undefined) updates.name = name;
        if (email !== undefined) updates.email = email;
        if (phone !== undefined) updates.phone = phone;

        const host = await Host.findByIdAndUpdate(req.hostData.hostId, updates, { new: true });
        if (!host) return res.status(404).json({ error: 'Host not found' });
        res.json({ success: true, host });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/host/profile
hostRoutes.delete('/profile', hostAuth, async (req, res) => {
    try {
        const host = await Host.findByIdAndDelete(req.hostData.hostId);
        if (!host) return res.status(404).json({ error: 'Host not found' });
        await Accomodation.deleteMany({ host: req.hostData.hostId });
        res.json({ success: true, message: 'Host and all accommodations deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== Accommodation management (protected) ==========

// GET /api/host/accommodations - List own accommodations
hostRoutes.get('/accommodations', hostAuth, async (req, res) => {
    try {
        const accommodations = await Accomodation.find({ host: req.hostData.hostId }).sort({ createdAt: -1 });
        res.json({ success: true, accommodations });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/host/accommodations/:id - Get single own accommodation
hostRoutes.get('/accommodations/:id', hostAuth, async (req, res) => {
    try {
        const accommodation = await Accomodation.findOne({ _id: req.params.id, host: req.hostData.hostId });
        if (!accommodation) return res.status(404).json({ error: 'Accommodation not found' });
        res.json({ success: true, accommodation });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/host/accommodations - Create accommodation (always pending)
hostRoutes.post('/accommodations', hostAuth, async (req, res) => {
    const hostId = req.hostData.hostId;
    if (!hostId) {
        return res.status(401).json({ error: 'Invalid session. Please logout and login again.' });
    }

    const multerDone = await new Promise((resolve) => {
        handleMulterError(uploadImages)(req, res, (err) => {
            if (err) return resolve(err);
            resolve(null);
        });
    });
    if (multerDone) return;

    try {
        const { name, address, city, price, description, roomspace, amenities, reviews } = req.body;

        const roomspaceObj = parseBodyField(roomspace);
        const amenitiesArr = parseBodyField(amenities);
        const reviewsArr = parseBodyField(reviews);

        const folderName = slugify(name || 'unnamed');
        const imagePaths = (req.files || []).map(f => `/uploads/accommodations/${folderName}/${f.filename}`);

        if (!name || !address || !city || !price || !description) {
            return res.status(400).json({ error: 'Name, address, city, price and description are required' });
        }
        if (!imagePaths.length) {
            return res.status(400).json({ error: 'At least one image is required' });
        }

        const totalSpaceNum = roomspaceObj && (roomspaceObj.total_space !== undefined && roomspaceObj.total_space !== '')
            ? Number(roomspaceObj.total_space)
            : undefined;
        if (totalSpaceNum === undefined || isNaN(totalSpaceNum)) {
            return res.status(400).json({ error: 'roomspace.total_space is required' });
        }

        const accommodation = await Accomodation.create({
            name,
            address,
            city,
            price: Number(price),
            description,
            images: imagePaths,
            roomspace: { total_space: totalSpaceNum, available_space: totalSpaceNum },
            amenities: Array.isArray(amenitiesArr) ? amenitiesArr : [],
            host: hostId,
            reviews: Array.isArray(reviewsArr) ? reviewsArr : []
        });

        res.status(201).json({
            success: true,
            message: 'Accommodation submitted for verification',
            accommodation
        });
    } catch (err) {
        res.status(500).json({ error: err.message || 'Failed to create accommodation' });
    }
});

// PUT /api/host/accommodations/:id - Update own accommodation
hostRoutes.put('/accommodations/:id', hostAuth, async (req, res) => {
    const hostId = req.hostData.hostId;

    const multerDone = await new Promise((resolve) => {
        handleMulterError(uploadImages)(req, res, (err) => {
            if (err) return resolve(err);
            resolve(null);
        });
    });
    if (multerDone) return;

    try {
        const accommodation = await Accomodation.findOne({ _id: req.params.id, host: hostId });
        if (!accommodation) return res.status(404).json({ error: 'Accommodation not found' });

        const { name, address, city, price, description, images, roomspace, amenities, availability, reviews } = req.body;
        const updates = {};

        if (name !== undefined) updates.name = name;
        if (address !== undefined) updates.address = address;
        if (city !== undefined) updates.city = city;
        if (price !== undefined) updates.price = Number(price);
        if (description !== undefined) updates.description = description;
        if (roomspace !== undefined) updates.roomspace = parseBodyField(roomspace);
        if (amenities !== undefined) updates.amenities = parseBodyField(amenities) || [];
        if (availability !== undefined) updates.availability = availability === 'false' ? false : availability !== false;
        if (reviews !== undefined) updates.reviews = parseBodyField(reviews) || [];

        if (req.files?.length) {
            const accName = name || accommodation.name || 'unnamed';
            const folderName = slugify(accName);
            updates.images = req.files.map(f => `/uploads/accommodations/${folderName}/${f.filename}`);
        } else if (images !== undefined) {
            updates.images = parseBodyField(images) || [];
        }

        const updated = await Accomodation.findByIdAndUpdate(req.params.id, updates, { new: true });
        res.json({ success: true, accommodation: updated });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/host/accommodations/:id - Delete own accommodation
hostRoutes.delete('/accommodations/:id', hostAuth, async (req, res) => {
    try {
        const accommodation = await Accomodation.findOne({ _id: req.params.id, host: req.hostData.hostId });
        if (!accommodation) return res.status(404).json({ error: 'Accommodation not found' });

        await Accomodation.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Accommodation deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== Booking management (protected) ==========

// GET /api/host/bookings - List all bookings for my accommodations
hostRoutes.get('/bookings', hostAuth, async (req, res) => {
    try {
        const { status } = req.query;
        const filter = { host: req.hostData.hostId };
        if (status) filter.status = status;

        const bookings = await Booking.find(filter)
            .populate('user', 'name email phone occupation')
            .populate('accommodation', 'name address city price images')
            .sort({ createdAt: -1 });

        res.json({ success: true, bookings });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/host/bookings/:id/confirm - Confirm a pending booking
hostRoutes.put('/bookings/:id/confirm', hostAuth, async (req, res) => {
    try {
        const booking = await Booking.findOne({ _id: req.params.id, host: req.hostData.hostId });
        if (!booking) return res.status(404).json({ error: 'Booking not found' });

        if (booking.status !== 'pending') {
            return res.status(400).json({ error: 'Only pending bookings can be confirmed' });
        }

        const accommodation = await Accomodation.findById(booking.accommodation);
        if (!accommodation) return res.status(404).json({ error: 'Accommodation not found' });

        if (booking.spaces > accommodation.roomspace.available_space) {
            return res.status(400).json({ error: `Only ${accommodation.roomspace.available_space} space(s) available` });
        }

        // Decrement available space
        accommodation.roomspace.available_space -= booking.spaces;
        await accommodation.save();

        booking.status = 'confirmed';
        await booking.save();

        const populated = await Booking.findById(booking._id)
            .populate('user', 'name email phone occupation')
            .populate('accommodation', 'name address city price images');

        res.json({ success: true, message: 'Booking confirmed', booking: populated });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/host/bookings/:id/reject - Reject a pending booking
hostRoutes.put('/bookings/:id/reject', hostAuth, async (req, res) => {
    try {
        const booking = await Booking.findOne({ _id: req.params.id, host: req.hostData.hostId });
        if (!booking) return res.status(404).json({ error: 'Booking not found' });

        if (booking.status !== 'pending') {
            return res.status(400).json({ error: 'Only pending bookings can be rejected' });
        }

        booking.status = 'rejected';
        await booking.save();

        const populated = await Booking.findById(booking._id)
            .populate('user', 'name email phone occupation')
            .populate('accommodation', 'name address city price images');

        res.json({ success: true, message: 'Booking rejected', booking: populated });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== Chat / Conversations (protected) ==========

// GET /api/host/conversations - List my conversations
hostRoutes.get('/conversations', hostAuth, async (req, res) => {
    try {
        const conversations = await Conversation.find({ host: req.hostData.hostId })
            .populate('seeker', 'name email phone occupation')
            .populate('accommodation', 'name address city images')
            .sort({ lastMessageAt: -1 });

        res.json({ success: true, conversations });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/host/conversations/:id/messages - Get message history
hostRoutes.get('/conversations/:id/messages', hostAuth, async (req, res) => {
    try {
        const conversation = await Conversation.findOne({
            _id: req.params.id,
            host: req.hostData.hostId
        });
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        const messages = await Message.find({ conversation: req.params.id })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Message.countDocuments({ conversation: req.params.id });

        res.json({
            success: true,
            messages: messages.reverse(),
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = hostRoutes;
