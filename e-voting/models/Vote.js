const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: [true, 'User ID is required']
    },
    candidateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Candidate',
        required: [true, 'Candidate ID is required']
    },
    position: {
        type: String,
        required: [true, 'Position is required'],
        enum: ['president', 'vice-president', 'secretary', 'treasurer', 'auditor']
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    ipAddress: {
        type: String,
        required: [true, 'IP address is required']
    }
});

// Compound index to prevent duplicate votes
voteSchema.index({ userId: 1, position: 1 }, { unique: true });

module.exports = mongoose.model('Vote', voteSchema); 