const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Accomodation = require('../models/accomodation');
const Booking = require('../models/booking');
const Conversation = require('../models/conversation');
const Message = require('../models/message');
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
        const accommodations = await Accomodation.find({ status: 'verified' }).populate('host').sort({ createdAt: -1 });
        res.json({ success: true, accommodations });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/user/accommodations/:id - Get single verified accommodation
userRoutes.get('/accommodations/:id', userAuth, async (req, res) => {
    try {
        const accommodation = await Accomodation.findOne({ _id: req.params.id, status: 'verified' }).populate('host');
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

// ========== Bookings (protected) ==========

// POST /api/user/bookings - Create a booking request
userRoutes.post('/bookings', userAuth, async (req, res) => {
    try {
        const { accommodationId, checkIn, checkOut, spaces, selectedAmenities } = req.body;

        if (!accommodationId || !checkIn || !checkOut) {
            return res.status(400).json({ error: 'Accommodation, check-in and check-out dates are required' });
        }

        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);

        if (checkOutDate <= checkInDate) {
            return res.status(400).json({ error: 'Check-out must be after check-in' });
        }

        const accommodation = await Accomodation.findById(accommodationId);
        if (!accommodation) {
            return res.status(404).json({ error: 'Accommodation not found' });
        }
        if (accommodation.status !== 'verified') {
            return res.status(400).json({ error: 'Accommodation is not available for booking' });
        }

        const requestedSpaces = spaces || 1;

        if (requestedSpaces > accommodation.roomspace.available_space) {
            return res.status(400).json({ error: `Only ${accommodation.roomspace.available_space} space(s) available` });
        }

        // Check for overlapping active booking by same user at same accommodation
        const overlap = await Booking.findOne({
            user: req.user.userId,
            accommodation: accommodationId,
            status: { $in: ['pending', 'confirmed'] },
            checkIn: { $lt: checkOutDate },
            checkOut: { $gt: checkInDate }
        });
        if (overlap) {
            return res.status(400).json({ error: 'You already have an active booking for this accommodation in the selected dates' });
        }

        // Validate selected amenities against accommodation's actual amenities
        const validAmenities = [];
        if (Array.isArray(selectedAmenities) && selectedAmenities.length > 0) {
            const accAmenityMap = new Map(
                (accommodation.amenities || []).map(am => [am.name, am.rate])
            );
            for (const sel of selectedAmenities) {
                const rate = accAmenityMap.get(sel.name);
                if (rate !== undefined) {
                    validAmenities.push({ name: sel.name, rate });
                }
            }
        }

        const amenitiesTotal = validAmenities.reduce((sum, am) => sum + am.rate, 0);

        // Price = (accommodation price + selected amenities) * months * spaces
        const msPerMonth = 1000 * 60 * 60 * 24 * 30;
        const months = Math.max(1, Math.ceil((checkOutDate - checkInDate) / msPerMonth));
        const totalPrice = (accommodation.price + amenitiesTotal) * months * requestedSpaces;

        const booking = await Booking.create({
            user: req.user.userId,
            accommodation: accommodationId,
            host: accommodation.host,
            checkIn: checkInDate,
            checkOut: checkOutDate,
            spaces: requestedSpaces,
            selectedAmenities: validAmenities,
            totalPrice
        });

        res.status(201).json({ success: true, message: 'Booking request submitted', booking });
    } catch (err) {
        res.status(500).json({ error: err.message || 'Booking failed' });
    }
});

// GET /api/user/bookings - List all my bookings
userRoutes.get('/bookings', userAuth, async (req, res) => {
    try {
        const { status } = req.query;
        const filter = { user: req.user.userId };
        if (status) filter.status = status;

        const bookings = await Booking.find(filter)
            .populate('accommodation')
            .populate('host', 'name email phone')
            .sort({ createdAt: -1 });

        res.json({ success: true, bookings });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/user/bookings/:id - Get single booking detail
userRoutes.get('/bookings/:id', userAuth, async (req, res) => {
    try {
        const booking = await Booking.findOne({ _id: req.params.id, user: req.user.userId })
            .populate('accommodation')
            .populate('host', 'name email phone');

        if (!booking) return res.status(404).json({ error: 'Booking not found' });
        res.json({ success: true, booking });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/user/bookings/:id/cancel - Cancel a booking
userRoutes.put('/bookings/:id/cancel', userAuth, async (req, res) => {
    try {
        const booking = await Booking.findOne({ _id: req.params.id, user: req.user.userId });
        if (!booking) return res.status(404).json({ error: 'Booking not found' });

        if (!['pending', 'confirmed'].includes(booking.status)) {
            return res.status(400).json({ error: 'Only pending or confirmed bookings can be cancelled' });
        }

        // If it was confirmed, restore the available space
        if (booking.status === 'confirmed') {
            await Accomodation.findByIdAndUpdate(booking.accommodation, {
                $inc: { 'roomspace.available_space': booking.spaces }
            });
        }

        booking.status = 'cancelled';
        await booking.save();

        res.json({ success: true, message: 'Booking cancelled', booking });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== Chat / Conversations (protected) ==========

// POST /api/user/conversations - Start or get existing conversation
userRoutes.post('/conversations', userAuth, async (req, res) => {
    try {
        const { accommodationId } = req.body;
        if (!accommodationId) {
            return res.status(400).json({ error: 'Accommodation ID is required' });
        }

        const accommodation = await Accomodation.findById(accommodationId);
        if (!accommodation) {
            return res.status(404).json({ error: 'Accommodation not found' });
        }

        let conversation = await Conversation.findOne({
            seeker: req.user.userId,
            host: accommodation.host,
            accommodation: accommodationId
        });

        if (!conversation) {
            conversation = await Conversation.create({
                seeker: req.user.userId,
                host: accommodation.host,
                accommodation: accommodationId
            });
        }

        const populated = await Conversation.findById(conversation._id)
            .populate('host', 'name email phone')
            .populate('accommodation', 'name address city images');

        res.json({ success: true, conversation: populated });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/user/conversations - List my conversations
userRoutes.get('/conversations', userAuth, async (req, res) => {
    try {
        const conversations = await Conversation.find({ seeker: req.user.userId })
            .populate('host', 'name email phone')
            .populate('accommodation', 'name address city images')
            .sort({ lastMessageAt: -1 });

        res.json({ success: true, conversations });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/user/conversations/:id/messages - Get message history
userRoutes.get('/conversations/:id/messages', userAuth, async (req, res) => {
    try {
        const conversation = await Conversation.findOne({
            _id: req.params.id,
            seeker: req.user.userId
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

module.exports = userRoutes;
