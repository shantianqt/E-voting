const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
    candidateId: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters long']
    },
    position: {
        type: String,
        required: [true, 'Position is required'],
        enum: ['president', 'vice-president', 'secretary', 'treasurer', 'auditor']
    },
    party: {
        type: String,
        required: [true, 'Party/Affiliation is required'],
        trim: true
    },
    bio: {
        type: String,
        required: [true, 'Biography is required'],
        minlength: [50, 'Biography must be at least 50 characters long']
    },
    imageUrl: {
        type: String,
        required: [true, 'Image is required'],
        validate: {
            validator: function(v) {
                return /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/.test(v);
            },
            message: props => `${props.value} is not a valid URL!`
        }
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'pending'],
        default: 'pending'
    },
    votes: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});

// Update lastUpdated timestamp before saving
candidateSchema.pre('save', function(next) {
    this.lastUpdated = new Date();
    next();
});

module.exports = mongoose.model('Candidate', candidateSchema); 