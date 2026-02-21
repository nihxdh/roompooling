const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Accomodation = require('../models/accomodation');
const Booking = require('../models/booking');
const adminAuth = require('../middleware/adminAuth');
const adminRoutes = express.Router();
const validOccupations = ['Student', 'Employee', 'Other'];

// POST /api/admin/login (public)
adminRoutes.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
        return res.status(500).json({ error: 'Admin credentials not configured' });
    }

    if (email !== adminEmail || password !== adminPassword) {
        return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    const token = jwt.sign(
        { role: 'admin', email },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );

    res.json({
        success: true,
        token,
        expiresIn: '24h'
    });
});

// ========== User CRUD (protected) ==========

// GET /api/admin/users - List all users
adminRoutes.get('/users', adminAuth, async (req, res) => {
    try {
        const users = await User.find().sort({ createdAt: -1 });
        res.json({ success: true, users });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/admin/users/:id - Get user by ID
adminRoutes.get('/users/:id', adminAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/admin/users - Create user
adminRoutes.post('/users', adminAuth, async (req, res) => {
    try {
        const { name, email, phone, address, dob, gender, occupation } = req.body;
        if (!name || !email || !phone || !address || !dob || !gender) {
            return res.status(400).json({ error: 'Name, email, phone, address, dob and gender are required' });
        }
        if (occupation && !validOccupations.includes(occupation)) {
            return res.status(400).json({ error: 'Occupation must be Student, Employee, or Other' });
        }
        const user = await User.create({
            name, email, phone, address,
            dob: new Date(dob),
            gender,
            occupation: occupation || 'Other'
        });
        res.status(201).json({ success: true, user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/admin/users/:id - Update user
adminRoutes.put('/users/:id', adminAuth, async (req, res) => {
    try {
        const { name, email, phone, address, dob, gender, occupation } = req.body;
        const updates = {};
        if (name !== undefined) updates.name = name;
        if (email !== undefined) updates.email = email;
        if (phone !== undefined) updates.phone = phone;
        if (address !== undefined) updates.address = address;
        if (dob !== undefined) updates.dob = new Date(dob);
        if (gender !== undefined) updates.gender = gender;
        if (occupation !== undefined) {
            if (!validOccupations.includes(occupation)) {
                return res.status(400).json({ error: 'Occupation must be Student, Employee, or Other' });
            }
            updates.occupation = occupation;
        }

        const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true });
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/admin/users/:id - Delete user
adminRoutes.delete('/users/:id', adminAuth, async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ success: true, message: 'User deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== Accommodation verification (protected) ==========

// GET /api/admin/accommodations - List all (optional ?status=pending|verified|rejected)
adminRoutes.get('/accommodations', adminAuth, async (req, res) => {
    try {
        const { status } = req.query;
        const filter = status ? { status } : {};
        const accommodations = await Accomodation.find(filter).populate('host').sort({ createdAt: -1 });
        res.json({ success: true, accommodations });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/admin/accommodations/:id - Get single accommodation by ID
adminRoutes.get('/accommodations/:id', adminAuth, async (req, res) => {
    try {
        const accommodation = await Accomodation.findById(req.params.id).populate('host');
        if (!accommodation) return res.status(404).json({ error: 'Accommodation not found' });
        res.json({ success: true, accommodation });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/admin/accommodations/:id/verify - Verify or reject
adminRoutes.put('/accommodations/:id/verify', adminAuth, async (req, res) => {
    try {
        const { status } = req.body;
        if (!['verified', 'rejected'].includes(status)) {
            return res.status(400).json({ error: 'Status must be verified or rejected' });
        }
        const accommodation = await Accomodation.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        ).populate('host');
        if (!accommodation) return res.status(404).json({ error: 'Accommodation not found' });
        res.json({ success: true, accommodation });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== Bookings overview (protected) ==========

// GET /api/admin/bookings - List all bookings (optional ?status filter)
adminRoutes.get('/bookings', adminAuth, async (req, res) => {
    try {
        const { status } = req.query;
        const filter = status ? { status } : {};

        const bookings = await Booking.find(filter)
            .populate('user', 'name email phone')
            .populate('accommodation', 'name address city price')
            .populate('host', 'name email phone')
            .sort({ createdAt: -1 });

        res.json({ success: true, bookings });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = adminRoutes;
