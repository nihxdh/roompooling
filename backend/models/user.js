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
    },
    preferences: {
        stayDuration: {
            type: String,
            enum: ['Short-term (<3 months)', 'Medium (3-6 months)', 'Long-term (6+ months)']
        },
        foodPreference: {
            type: String,
            enum: ['Vegetarian', 'Non-Vegetarian', 'Vegan', 'No Preference']
        },
        smoking: {
            type: String,
            enum: ['Smoker', 'Non-Smoker']
        },
        drinking: {
            type: String,
            enum: ['Drinks', "Doesn't Drink"]
        },
        guestPolicy: {
            type: String,
            enum: ['Guests Welcome', 'Occasional Guests', 'No Guests']
        },
        cleanlinessLevel: {
            type: String,
            enum: ['Very Clean', 'Moderate', 'Relaxed']
        },
        noiseTolerance: {
            type: String,
            enum: ['Quiet', 'Moderate', 'Lively']
        },
        workSchedule: {
            type: String,
            enum: ['Regular (9-5)', 'Flexible', 'Night Owl']
        },
        wakeUpTime: {
            type: String,
            enum: ['Early (Before 7 AM)', 'Morning (7-9 AM)', 'Late (After 9 AM)']
        },
        sleepTime: {
            type: String,
            enum: ['Early (Before 10 PM)', 'Night (10 PM-12 AM)', 'Late Night (After 12 AM)']
        },
        petPreference: {
            type: String,
            enum: ['Love Pets', 'Okay with Pets', 'No Pets']
        },
        cookingHabits: {
            type: String,
            enum: ['Cooks Daily', 'Sometimes', 'Rarely/Never']
        },
        socialNature: {
            type: String,
            enum: ['Introvert', 'Ambivert', 'Extrovert']
        },
        sharingResponsibility: {
            type: String,
            enum: ['Happy to Share', 'Prefer Separate', 'Flexible']
        },
        languages: [{ type: String }]
    }
}, { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);