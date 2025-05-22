const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Vote = require('../models/Vote');
const Candidate = require('../models/Candidate');
const rateLimit = require('express-rate-limit');

// Rate limiting middleware
const voteLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 1, // 1 vote per minute
    message: {
        success: false,
        message: 'Too many votes, please try again later'
    }
});

// Validation middleware
const validateVote = [
    body('userId')
        .notEmpty()
        .withMessage('User ID is required'),
    body('candidateId')
        .notEmpty()
        .withMessage('Candidate ID is required')
        .isMongoId()
        .withMessage('Invalid candidate ID'),
    body('position')
        .isIn(['president', 'vice-president', 'secretary', 'treasurer', 'auditor'])
        .withMessage('Invalid position')
];

// POST new vote
router.post('/', voteLimiter, validateVote, async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { userId, candidateId, position } = req.body;

        // Check if user has already voted for this position
        const existingVote = await Vote.findOne({ userId, position });
        if (existingVote) {
            return res.status(400).json({
                success: false,
                message: 'You have already voted for this position'
            });
        }

        // Check if candidate exists
        const candidate = await Candidate.findById(candidateId);
        if (!candidate) {
            return res.status(404).json({
                success: false,
                message: 'Candidate not found'
            });
        }

        // Create new vote
        const vote = new Vote({
            userId,
            candidateId,
            position,
            ipAddress: req.ip
        });

        await vote.save();

        // Update candidate vote count
        candidate.votes += 1;
        await candidate.save();

        res.status(201).json({
            success: true,
            message: 'Vote recorded successfully',
            data: vote
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error recording vote',
            error: error.message
        });
    }
});

module.exports = router; 