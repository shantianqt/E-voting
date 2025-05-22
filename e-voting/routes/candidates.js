const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { body, validationResult } = require('express-validator');
const Candidate = require('../models/Candidate');

// File upload configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/candidates')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

// Validation middleware
const validateCandidate = [
    body('name')
        .trim()
        .isLength({ min: 2 })
        .withMessage('Name must be at least 2 characters long'),
    body('position')
        .isIn(['president', 'vice-president', 'secretary', 'treasurer', 'auditor'])
        .withMessage('Invalid position'),
    body('party')
        .trim()
        .notEmpty()
        .withMessage('Party/Affiliation is required'),
    body('bio')
        .trim()
        .isLength({ min: 50 })
        .withMessage('Biography must be at least 50 characters long')
];

// GET all candidates
router.get('/', async (req, res) => {
    try {
        const candidates = await Candidate.find().sort({ position: 1, name: 1 });
        res.json({
            success: true,
            data: candidates
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching candidates',
            error: error.message
        });
    }
});

// POST new candidate
router.post('/', upload.single('image'), validateCandidate, async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        // Check if image was uploaded
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Image is required'
            });
        }

        // Create new candidate
        const candidate = new Candidate({
            name: req.body.name,
            position: req.body.position,
            party: req.body.party,
            bio: req.body.bio,
            imageUrl: `/uploads/candidates/${req.file.filename}`
        });

        await candidate.save();

        res.status(201).json({
            success: true,
            message: 'Candidate added successfully',
            data: candidate
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error adding candidate',
            error: error.message
        });
    }
});

module.exports = router; 