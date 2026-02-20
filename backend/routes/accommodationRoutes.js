const express = require('express');
const jwt = require('jsonwebtoken');
const path = require('path');
const Accomodation = require('../models/accomodation');
const hostAuth = require('../middleware/hostAuth');
const { uploadImages } = require('../config/multer');
const accommodationRoutes = express.Router();

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

const HOST_OTP = im;

// POST /api/accommodation/login - Host login (phone + OTP)
accommodationRoutes.post('/login', async (req, res) => {
    try {
        const { phone, otp } = req.body;

        if (!phone || !otp) {
            return res.status(400).json({ error: 'Phone number and OTP are required' });
        }

        const accommodation = await Accomodation.findOne({ 'host.phone': phone });
        if (!accommodation) {
            return res.status(404).json({ error: 'Phone number not registered as accommodation host. Please list an accommodation first.' });
        }

        if (otp !== HOST_OTP) {
            return res.status(401).json({ error: 'Invalid OTP' });
        }

        const token = jwt.sign(
            { role: 'host', phone },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            token,
            expiresIn: '7d',
            host: { name: accommodation.host.name, email: accommodation.host.email, phone }
        });
    } catch (err) {
        res.status(500).json({ error: err.message || 'Login failed' });
    }
});

// POST /api/accommodation - Create accommodation (always pending, multipart with image uploads)
accommodationRoutes.post('/', handleMulterError(uploadImages), async (req, res) => {
    try {
        const {
            name, address, city, price, description,
            roomspace, amenities, host, availability, reviews
        } = req.body;

        const roomspaceObj = parseBodyField(roomspace);
        const amenitiesArr = parseBodyField(amenities);
        const hostObj = parseBodyField(host);
        const reviewsArr = parseBodyField(reviews);

        const imagePaths = (req.files || []).map(f => `/uploads/accommodations/${path.basename(f.filename)}`);

        if (!name || !address || !city || !price || !description) {
            return res.status(400).json({ error: 'Name, address, city, price and description are required' });
        }
        if (!imagePaths.length) {
            return res.status(400).json({ error: 'At least one image is required' });
        }
        if (!roomspaceObj || roomspaceObj.total_space === undefined || roomspaceObj.available_space === undefined) {
            return res.status(400).json({ error: 'roomspace.total_space and roomspace.available_space are required' });
        }
        if (!hostObj?.name || !hostObj?.email || !hostObj?.phone) {
            return res.status(400).json({ error: 'host.name, host.email and host.phone are required' });
        }

        const accommodation = await Accomodation.create({
            name,
            address,
            city,
            price: Number(price),
            description,
            images: imagePaths,
            roomspace: roomspaceObj || { total_space: 0, available_space: 0 },
            amenities: Array.isArray(amenitiesArr) ? amenitiesArr : [],
            host: hostObj,
            availability: availability === 'false' ? false : availability !== false,
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

// PUT /api/accommodation/:id - Update own accommodation (multipart with optional image uploads)
accommodationRoutes.put('/:id', hostAuth, handleMulterError(uploadImages), async (req, res) => {
    try {
        const accommodation = await Accomodation.findById(req.params.id);
        if (!accommodation) return res.status(404).json({ error: 'Accommodation not found' });
        if (accommodation.host?.phone !== req.user.phone) {
            return res.status(403).json({ error: 'You can only update your own accommodation' });
        }

        const { name, address, city, price, description, images, roomspace, amenities, host, availability, reviews } = req.body;
        const updates = {};

        if (name !== undefined) updates.name = name;
        if (address !== undefined) updates.address = address;
        if (city !== undefined) updates.city = city;
        if (price !== undefined) updates.price = Number(price);
        if (description !== undefined) updates.description = description;
        if (roomspace !== undefined) updates.roomspace = parseBodyField(roomspace);
        if (amenities !== undefined) updates.amenities = parseBodyField(amenities) || [];
        if (host !== undefined) updates.host = parseBodyField(host);
        if (availability !== undefined) updates.availability = availability === 'false' ? false : availability !== false;
        if (reviews !== undefined) updates.reviews = parseBodyField(reviews) || [];

        if (req.files?.length) {
            updates.images = req.files.map(f => `/uploads/accommodations/${path.basename(f.filename)}`);
        } else if (images !== undefined) {
            updates.images = parseBodyField(images) || [];
        }

        const updated = await Accomodation.findByIdAndUpdate(req.params.id, updates, { new: true });
        res.json({ success: true, accommodation: updated });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/accommodation/:id - Delete own accommodation (host phone must match logged-in host)
accommodationRoutes.delete('/:id', hostAuth, async (req, res) => {
    try {
        const accommodation = await Accomodation.findById(req.params.id);
        if (!accommodation) return res.status(404).json({ error: 'Accommodation not found' });
        if (accommodation.host?.phone !== req.user.phone) {
            return res.status(403).json({ error: 'You can only delete your own accommodation' });
        }

        await Accomodation.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Accommodation deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = accommodationRoutes;
