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

async function getAvailableSpaces(accommodationId, checkIn, checkOut, excludeBookingId) {
    const accommodation = await Accomodation.findById(accommodationId);
    if (!accommodation) return null;

    const filter = {
        accommodation: accommodationId,
        status: { $in: ['confirmed'] },
        checkIn: { $lt: new Date(checkOut) },
        checkOut: { $gt: new Date(checkIn) }
    };
    if (excludeBookingId) filter._id = { $ne: excludeBookingId };

    const overlapping = await Booking.find(filter);
    const bookedSpaces = overlapping.reduce((sum, b) => sum + b.spaces, 0);

    return {
        total: accommodation.roomspace.total_space,
        booked: bookedSpaces,
        available: Math.max(0, accommodation.roomspace.total_space - bookedSpaces)
    };
}

// ========== Smart Matching Engine ==========

const ORDERED_ENUMS = {
    sleepTime: ['Early (Before 10 PM)', 'Night (10 PM-12 AM)', 'Late Night (After 12 AM)'],
    wakeUpTime: ['Early (Before 7 AM)', 'Morning (7-9 AM)', 'Late (After 9 AM)'],
    cleanlinessLevel: ['Very Clean', 'Moderate', 'Relaxed'],
    noiseTolerance: ['Quiet', 'Moderate', 'Lively'],
    guestPolicy: ['Guests Welcome', 'Occasional Guests', 'No Guests'],
    workSchedule: ['Regular (9-5)', 'Flexible', 'Night Owl'],
    socialNature: ['Introvert', 'Ambivert', 'Extrovert'],
    cookingHabits: ['Cooks Daily', 'Sometimes', 'Rarely/Never'],
    sharingResponsibility: ['Happy to Share', 'Prefer Separate', 'Flexible'],
    petPreference: ['Love Pets', 'Okay with Pets', 'No Pets'],
    stayDuration: ['Short-term (<3 months)', 'Medium (3-6 months)', 'Long-term (6+ months)'],
};

const PREF_WEIGHTS = {
    gender: 8, occupation: 6, foodPreference: 8, smoking: 9, drinking: 5,
    sleepTime: 8, wakeUpTime: 7, cleanlinessLevel: 9, noiseTolerance: 7,
    guestPolicy: 5, workSchedule: 5, socialNature: 4, cookingHabits: 3,
    sharingResponsibility: 5, petPreference: 5, stayDuration: 4, languages: 6,
};

function orderedMatch(field, valA, valB) {
    const order = ORDERED_ENUMS[field];
    if (!order) return valA === valB ? 1 : 0;
    const iA = order.indexOf(valA);
    const iB = order.indexOf(valB);
    if (iA === -1 || iB === -1) return 0;
    const diff = Math.abs(iA - iB);
    if (diff === 0) return 1;
    if (diff === 1) return 0.5;
    return 0;
}

function computePairwiseScore(seekerUser, roommateUser) {
    const seekerPrefs = seekerUser.preferences || {};
    const roommatePrefs = roommateUser.preferences || {};
    let totalWeight = 0;
    let totalScore = 0;
    const matchingTraits = [];
    const conflictingTraits = [];

    // Gender (from user model)
    if (seekerUser.gender && roommateUser.gender) {
        const w = PREF_WEIGHTS.gender;
        const match = seekerUser.gender === roommateUser.gender ? 1 : 0.4;
        totalWeight += w;
        totalScore += w * match;
        if (match >= 0.8) matchingTraits.push('Gender');
    }

    // Occupation (from user model)
    if (seekerUser.occupation && roommateUser.occupation) {
        const w = PREF_WEIGHTS.occupation;
        const match = seekerUser.occupation === roommateUser.occupation ? 1 : 0.4;
        totalWeight += w;
        totalScore += w * match;
        if (match >= 0.8) matchingTraits.push('Occupation');
    }

    // Food — exact match scoring
    if (seekerPrefs.foodPreference && roommatePrefs.foodPreference) {
        const w = PREF_WEIGHTS.foodPreference;
        let match;
        if (seekerPrefs.foodPreference === roommatePrefs.foodPreference) match = 1;
        else if (seekerPrefs.foodPreference === 'No Preference' || roommatePrefs.foodPreference === 'No Preference') match = 0.6;
        else match = 0.2;
        totalWeight += w;
        totalScore += w * match;
        if (match >= 0.8) matchingTraits.push(seekerPrefs.foodPreference);
        else if (match <= 0.3) conflictingTraits.push('Food Preference');
    }

    // Smoking — binary
    if (seekerPrefs.smoking && roommatePrefs.smoking) {
        const w = PREF_WEIGHTS.smoking;
        const match = seekerPrefs.smoking === roommatePrefs.smoking ? 1 : 0;
        totalWeight += w;
        totalScore += w * match;
        if (match >= 0.8) matchingTraits.push(seekerPrefs.smoking);
        else conflictingTraits.push('Smoking');
    }

    // Drinking — binary with partial
    if (seekerPrefs.drinking && roommatePrefs.drinking) {
        const w = PREF_WEIGHTS.drinking;
        const match = seekerPrefs.drinking === roommatePrefs.drinking ? 1 : 0.3;
        totalWeight += w;
        totalScore += w * match;
        if (match >= 0.8) matchingTraits.push('Drinking Habit');
    }

    // Ordered enum fields
    const orderedFields = ['sleepTime', 'wakeUpTime', 'cleanlinessLevel', 'noiseTolerance',
        'guestPolicy', 'workSchedule', 'socialNature', 'cookingHabits',
        'sharingResponsibility', 'petPreference', 'stayDuration'];

    const traitLabels = {
        sleepTime: 'Sleep Schedule', wakeUpTime: 'Wake-up Time', cleanlinessLevel: 'Cleanliness',
        noiseTolerance: 'Noise Level', guestPolicy: 'Guest Policy', workSchedule: 'Work Schedule',
        socialNature: 'Social Nature', cookingHabits: 'Cooking', sharingResponsibility: 'Sharing',
        petPreference: 'Pet Preference', stayDuration: 'Stay Duration',
    };

    for (const field of orderedFields) {
        if (seekerPrefs[field] && roommatePrefs[field]) {
            const w = PREF_WEIGHTS[field];
            const match = orderedMatch(field, seekerPrefs[field], roommatePrefs[field]);
            totalWeight += w;
            totalScore += w * match;
            if (match >= 0.8) matchingTraits.push(traitLabels[field]);
            else if (match === 0) conflictingTraits.push(traitLabels[field]);
        }
    }

    // Languages — any common language = full match
    if (seekerPrefs.languages?.length && roommatePrefs.languages?.length) {
        const w = PREF_WEIGHTS.languages;
        const common = seekerPrefs.languages.filter(l =>
            roommatePrefs.languages.some(rl => rl.toLowerCase() === l.toLowerCase())
        );
        const match = common.length > 0 ? 1 : 0.2;
        totalWeight += w;
        totalScore += w * match;
        if (common.length > 0) matchingTraits.push(`Common language: ${common.join(', ')}`);
    }

    const score = totalWeight > 0 ? Math.round((totalScore / totalWeight) * 100) : 0;
    return { score, matchingTraits, conflictingTraits };
}

function checkHouseRulesHardFilter(seeker, rules) {
    if (!rules) return true;
    if (rules.genderAllowed === 'Male Only' && seeker.gender !== 'Male') return false;
    if (rules.genderAllowed === 'Female Only' && seeker.gender !== 'Female') return false;
    if (!rules.smokingAllowed && seeker.preferences?.smoking === 'Smoker') return false;
    if (rules.foodPolicy === 'Veg Only' && seeker.preferences?.foodPreference === 'Non-Vegetarian') return false;
    return true;
}

function computeAccommodationRuleScore(seeker, rules) {
    if (!rules) return 100;
    let score = 100;
    let factors = 0;
    let total = 0;

    // Noise alignment
    const noiseMap = { 'Quiet Zone': 'Quiet', 'Moderate': 'Moderate', 'No Restriction': 'Lively' };
    if (seeker.preferences?.noiseTolerance && rules.noisePolicy) {
        factors++;
        const aligned = noiseMap[rules.noisePolicy];
        if (seeker.preferences.noiseTolerance === aligned) total += 1;
        else total += 0.5;
    }

    // Occupation match
    if (seeker.occupation && rules.preferredOccupation && rules.preferredOccupation !== 'Any') {
        factors++;
        total += seeker.occupation === rules.preferredOccupation ? 1 : 0.4;
    }

    // Guest alignment
    const guestMap = { 'Allowed': 'Guests Welcome', 'Occasionally': 'Occasional Guests', 'Not Allowed': 'No Guests' };
    if (seeker.preferences?.guestPolicy && rules.guestsAllowed) {
        factors++;
        const aligned = guestMap[rules.guestsAllowed];
        if (seeker.preferences.guestPolicy === aligned) total += 1;
        else total += 0.5;
    }

    // Pet alignment
    if (seeker.preferences?.petPreference && rules.petFriendly !== undefined) {
        factors++;
        if (rules.petFriendly && seeker.preferences.petPreference !== 'No Pets') total += 1;
        else if (!rules.petFriendly && seeker.preferences.petPreference === 'No Pets') total += 1;
        else total += 0.4;
    }

    if (factors === 0) return 100;
    return Math.round((total / factors) * 100);
}

function generateInsights(seekerUser, roommates) {
    const insights = [];
    const seekerPrefs = seekerUser.preferences || {};

    if (roommates.length === 0) return insights;

    // Gender insight
    const genderCounts = {};
    roommates.forEach(r => { genderCounts[r.gender] = (genderCounts[r.gender] || 0) + 1; });
    const sameGender = genderCounts[seekerUser.gender] || 0;
    if (sameGender > 0) {
        insights.push({ type: 'match', category: 'Gender', text: `${sameGender} ${seekerUser.gender.toLowerCase()} roommate${sameGender > 1 ? 's' : ''}` });
    }

    // Occupation insight
    const occCounts = {};
    roommates.forEach(r => { occCounts[r.occupation] = (occCounts[r.occupation] || 0) + 1; });
    const sameOcc = occCounts[seekerUser.occupation] || 0;
    if (sameOcc > 0) {
        insights.push({ type: 'match', category: 'Occupation', text: `${sameOcc} ${seekerUser.occupation.toLowerCase()}${sameOcc > 1 ? 's' : ''} already here` });
    }

    // Food insight
    if (seekerPrefs.foodPreference && seekerPrefs.foodPreference !== 'No Preference') {
        const sameFood = roommates.filter(r => r.preferences?.foodPreference === seekerPrefs.foodPreference).length;
        const diffFood = roommates.filter(r => r.preferences?.foodPreference && r.preferences.foodPreference !== seekerPrefs.foodPreference && r.preferences.foodPreference !== 'No Preference').length;
        if (sameFood > 0) insights.push({ type: 'match', category: 'Food', text: `${sameFood} roommate${sameFood > 1 ? 's' : ''} ${sameFood > 1 ? 'are' : 'is'} ${seekerPrefs.foodPreference}` });
        if (diffFood > 0) insights.push({ type: 'warning', category: 'Food', text: `${diffFood} roommate${diffFood > 1 ? 's have' : ' has'} different food preference` });
    }

    // Smoking insight
    if (seekerPrefs.smoking === 'Non-Smoker') {
        const smokers = roommates.filter(r => r.preferences?.smoking === 'Smoker').length;
        if (smokers > 0) insights.push({ type: 'warning', category: 'Smoking', text: `${smokers} roommate${smokers > 1 ? 's are' : ' is a'} smoker${smokers > 1 ? 's' : ''}` });
        const nonSmokers = roommates.filter(r => r.preferences?.smoking === 'Non-Smoker').length;
        if (nonSmokers > 0) insights.push({ type: 'match', category: 'Smoking', text: `${nonSmokers} non-smoker${nonSmokers > 1 ? 's' : ''}` });
    }

    // Sleep schedule insight
    if (seekerPrefs.sleepTime) {
        const sameSleep = roommates.filter(r => r.preferences?.sleepTime === seekerPrefs.sleepTime).length;
        if (sameSleep > 0) insights.push({ type: 'match', category: 'Sleep', text: `Similar sleep schedule with ${sameSleep} roommate${sameSleep > 1 ? 's' : ''}` });
    }

    // Cleanliness insight
    if (seekerPrefs.cleanlinessLevel) {
        const sameClean = roommates.filter(r => r.preferences?.cleanlinessLevel === seekerPrefs.cleanlinessLevel).length;
        if (sameClean > 0) insights.push({ type: 'match', category: 'Cleanliness', text: `${sameClean} roommate${sameClean > 1 ? 's share' : ' shares'} your cleanliness standard` });
    }

    // Language insight
    if (seekerPrefs.languages?.length) {
        const allLangs = new Set();
        roommates.forEach(r => (r.preferences?.languages || []).forEach(l => allLangs.add(l)));
        const common = seekerPrefs.languages.filter(l => allLangs.has(l));
        if (common.length > 0) insights.push({ type: 'info', category: 'Languages', text: `Roommates speak ${common.join(', ')}` });
    }

    return insights;
}

async function getAccommodationRoommates(accommodationId) {
    const now = new Date();
    const bookings = await Booking.find({
        accommodation: accommodationId,
        status: 'confirmed',
        checkOut: { $gt: now }
    });
    if (bookings.length === 0) return [];
    const userIds = [...new Set(bookings.map(b => b.user.toString()))];
    return User.find({ _id: { $in: userIds } });
}

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

// GET /api/user/accommodations - List verified accommodations (with optional ?smart=true)
userRoutes.get('/accommodations', userAuth, async (req, res) => {
    try {
        const accommodations = await Accomodation.find({ status: 'verified' }).populate('host').sort({ createdAt: -1 });

        if (req.query.smart !== 'true') {
            return res.json({ success: true, accommodations });
        }

        const seeker = await User.findById(req.user.userId);
        if (!seeker || !seeker.preferences || Object.keys(seeker.preferences.toObject?.() || seeker.preferences).filter(k => k !== '_id').length === 0) {
            return res.json({ success: true, accommodations, smartMode: false, reason: 'no_preferences' });
        }

        const results = [];
        for (const acc of accommodations) {
            if (!checkHouseRulesHardFilter(seeker, acc.houseRules)) continue;

            const roommates = await getAccommodationRoommates(acc._id);
            const roommatesExcludingSelf = roommates.filter(r => r._id.toString() !== seeker._id.toString());

            let roommateScore = 0;
            if (roommatesExcludingSelf.length > 0) {
                const scores = roommatesExcludingSelf.map(r => computePairwiseScore(seeker, r).score);
                roommateScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
            }

            const ruleScore = computeAccommodationRuleScore(seeker, acc.houseRules);
            const finalScore = roommatesExcludingSelf.length > 0
                ? Math.round(roommateScore * 0.7 + ruleScore * 0.3)
                : ruleScore;

            const insights = generateInsights(seeker, roommatesExcludingSelf);
            const topInsight = insights.find(i => i.type === 'match')?.text || (roommatesExcludingSelf.length === 0 ? 'Be the first one here!' : null);

            const accObj = acc.toObject();
            accObj.compatibility = {
                score: finalScore,
                roommateCount: roommatesExcludingSelf.length,
                topInsight
            };
            results.push(accObj);
        }

        results.sort((a, b) => b.compatibility.score - a.compatibility.score);
        res.json({ success: true, accommodations: results, smartMode: true });
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

// GET /api/user/accommodations/:id/availability - Check date-specific availability
userRoutes.get('/accommodations/:id/availability', userAuth, async (req, res) => {
    try {
        const { checkIn, checkOut } = req.query;
        if (!checkIn || !checkOut) {
            return res.status(400).json({ error: 'checkIn and checkOut query params are required' });
        }

        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        if (checkOutDate <= checkInDate) {
            return res.status(400).json({ error: 'Check-out must be after check-in' });
        }

        const result = await getAvailableSpaces(req.params.id, checkInDate, checkOutDate);
        if (!result) {
            return res.status(404).json({ error: 'Accommodation not found' });
        }

        res.json({ success: true, ...result });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/user/accommodations/:id/compatibility - Detailed roommate compatibility
userRoutes.get('/accommodations/:id/compatibility', userAuth, async (req, res) => {
    try {
        const accommodation = await Accomodation.findOne({ _id: req.params.id, status: 'verified' });
        if (!accommodation) return res.status(404).json({ error: 'Accommodation not found' });

        const seeker = await User.findById(req.user.userId);
        if (!seeker) return res.status(404).json({ error: 'User not found' });

        const hasPrefs = seeker.preferences && Object.keys(seeker.preferences.toObject?.() || seeker.preferences).filter(k => k !== '_id').length > 0;
        if (!hasPrefs) {
            return res.json({
                success: true,
                hasPreferences: false,
                score: 0,
                roommateCount: 0,
                roommates: [],
                insights: [],
                houseRules: accommodation.houseRules || {}
            });
        }

        const allRoommates = await getAccommodationRoommates(accommodation._id);
        const roommates = allRoommates.filter(r => r._id.toString() !== seeker._id.toString());

        const roommateDetails = roommates.map(r => {
            const { score, matchingTraits, conflictingTraits } = computePairwiseScore(seeker, r);
            return { score, matchingTraits, conflictingTraits };
        });

        let roommateScore = 0;
        if (roommateDetails.length > 0) {
            roommateScore = Math.round(roommateDetails.reduce((a, r) => a + r.score, 0) / roommateDetails.length);
        }

        const ruleScore = computeAccommodationRuleScore(seeker, accommodation.houseRules);
        const finalScore = roommateDetails.length > 0
            ? Math.round(roommateScore * 0.7 + ruleScore * 0.3)
            : ruleScore;

        const insights = generateInsights(seeker, roommates);

        res.json({
            success: true,
            hasPreferences: true,
            score: finalScore,
            ruleScore,
            roommateScore,
            roommateCount: roommateDetails.length,
            roommates: roommateDetails.sort((a, b) => b.score - a.score),
            insights,
            houseRules: accommodation.houseRules || {}
        });
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

// ========== Preferences (protected) ==========

// GET /api/user/preferences - Get own preferences
userRoutes.get('/preferences', userAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ success: true, preferences: user.preferences || {} });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/user/preferences - Save/update preferences
userRoutes.put('/preferences', userAuth, async (req, res) => {
    try {
        const allowedFields = [
            'stayDuration', 'foodPreference', 'smoking', 'drinking', 'guestPolicy',
            'cleanlinessLevel', 'noiseTolerance', 'workSchedule', 'wakeUpTime', 'sleepTime',
            'petPreference', 'cookingHabits', 'socialNature', 'sharingResponsibility', 'languages'
        ];

        const updates = {};
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[`preferences.${field}`] = req.body[field];
            }
        }

        const user = await User.findByIdAndUpdate(
            req.user.userId,
            { $set: updates },
            { new: true, runValidators: true }
        );
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ success: true, preferences: user.preferences });
    } catch (err) {
        if (err.name === 'ValidationError') {
            return res.status(400).json({ error: err.message });
        }
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

        // Date-aware availability: count confirmed bookings overlapping these dates
        const availability = await getAvailableSpaces(accommodationId, checkInDate, checkOutDate);
        if (requestedSpaces > availability.available) {
            const msg = availability.available === 0
                ? 'No spaces available for the selected dates'
                : `Only ${availability.available} space(s) available for the selected dates`;
            return res.status(400).json({ error: msg, availableSpaces: availability.available });
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

        booking.status = 'cancelled';
        await booking.save();

        // Recalculate the static available_space indicator
        if (booking.status === 'cancelled') {
            const accommodation = await Accomodation.findById(booking.accommodation);
            if (accommodation) {
                const now = new Date();
                const farFuture = new Date('2099-12-31');
                const confirmedOverlap = await Booking.find({
                    accommodation: booking.accommodation,
                    status: 'confirmed',
                    checkIn: { $lt: farFuture },
                    checkOut: { $gt: now }
                });
                const bookedSpaces = confirmedOverlap.reduce((sum, b) => sum + b.spaces, 0);
                accommodation.roomspace.available_space = Math.max(0, accommodation.roomspace.total_space - bookedSpaces);
                await accommodation.save();
            }
        }

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
