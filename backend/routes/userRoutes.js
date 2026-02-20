const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Accomodation = require('../models/accomodation');
const userAuth = require('../middleware/userAuth');
const userRoutes = express.Router();

const STATIC_OTP = '1234';

// POST /api/user/register
userRoutes.post('/register', async (req, res) => {
    try {
        const { name, email, phone, address, dob, gender, occupation } = req.body;

        if (!name || !email || !phone || !address || !dob || !gender) {
            return res.status(400).json({ error: 'Name, email, phone, address, dob and gender are required' });
        }

        const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
        if (existingUser) {
            const field = existingUser.email === email ? 'Email' : 'Phone';
            return res.status(400).json({ error: `${field} already registered` });
        }

        const user = await User.create({
            name,
            email,
            phone,
            address,
            dob: new Date(dob),
            gender,
            occupation: occupation || 'Other'
        });

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            user: { id: user._id, name: user.name, email: user.email, phone: user.phone }
        });
    } catch (err) {
        res.status(500).json({ error: err.message || 'Registration failed' });
    }
});

// POST /api/user/login
userRoutes.post('/login', async (req, res) => {
    try {
        const { phone, otp } = req.body;

        if (!phone || !otp) {
            return res.status(400).json({ error: 'Phone number and OTP are required' });
        }

        const user = await User.findOne({ phone });
        if (!user) {
            return res.status(404).json({ error: 'Phone number not registered. Please register first.' });
        }

        if (otp !== STATIC_OTP) {
            return res.status(401).json({ error: 'Invalid OTP' });
        }

        const token = jwt.sign(
            { userId: user._id, role: 'user', phone: user.phone },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            token,
            expiresIn: '7d',
            user: { id: user._id, name: user.name, email: user.email, phone: user.phone }
        });
    } catch (err) {
        res.status(500).json({ error: err.message || 'Login failed' });
    }
});

// ========== Accommodations (verified only, protected) ==========

// GET /api/user/accommodations - List verified accommodations only
userRoutes.get('/accommodations', userAuth, async (req, res) => {
    try {
        const accommodations = await Accomodation.find({ status: 'verified' }).sort({ createdAt: -1 });
        res.json({ success: true, accommodations });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/user/accommodations/:id - Get single verified accommodation
userRoutes.get('/accommodations/:id', userAuth, async (req, res) => {
    try {
        const accommodation = await Accomodation.findOne({ _id: req.params.id, status: 'verified' });
        if (!accommodation) return res.status(404).json({ error: 'Accommodation not found' });
        res.json({ success: true, accommodation });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== Profile (protected) ==========

// GET /api/user/profile - Get own profile
userRoutes.get('/profile', userAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/user/profile - Edit own profile
userRoutes.put('/profile', userAuth, async (req, res) => {
    try {
        const { name, email, phone, address, dob, gender, occupation } = req.body;
        const updates = {};
        if (name !== undefined) updates.name = name;
        if (email !== undefined) updates.email = email;
        if (phone !== undefined) updates.phone = phone;
        if (address !== undefined) updates.address = address;
        if (dob !== undefined) updates.dob = new Date(dob);
        if (gender !== undefined) updates.gender = gender;
        if (occupation !== undefined) updates.occupation = occupation;

        const user = await User.findByIdAndUpdate(req.user.userId, updates, { new: true });
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/user/profile - Delete own profile
userRoutes.delete('/profile', userAuth, async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.user.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ success: true, message: 'Profile deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = userRoutes;
