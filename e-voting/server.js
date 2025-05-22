require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { db, auth } = require('./config/firebase');
const multer = require('multer');
const { body, validationResult } = require('express-validator');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

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

// Import routes
const candidateRoutes = require('./routes/candidates');
const voteRoutes = require('./routes/votes');
const resultRoutes = require('./routes/results');
const authRoutes = require('./routes/auth');

// Use routes
app.use('/api/candidates', candidateRoutes);
app.use('/api/votes', voteRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/auth', authRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
}); 