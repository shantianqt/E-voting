const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Middleware to validate registration data
const validateRegistration = (req, res, next) => {
    const { email, password, confirmPassword, fullName, role } = req.body;

    // Check if all fields are present
    if (!email || !password || !confirmPassword || !fullName || !role) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate password requirements
    if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }
    if (!/[A-Z]/.test(password)) {
        return res.status(400).json({ error: 'Password must contain at least one uppercase letter' });
    }
    if (!/[a-z]/.test(password)) {
        return res.status(400).json({ error: 'Password must contain at least one lowercase letter' });
    }
    if (!/[0-9]/.test(password)) {
        return res.status(400).json({ error: 'Password must contain at least one number' });
    }

    // Check if passwords match
    if (password !== confirmPassword) {
        return res.status(400).json({ error: 'Passwords do not match' });
    }

    // Validate name format
    const nameRegex = /^[A-Za-z\s]{2,50}$/;
    if (!nameRegex.test(fullName)) {
        return res.status(400).json({ error: 'Invalid name format (2-50 characters, letters only)' });
    }

    // Validate role
    if (!['voter', 'candidate', 'admin'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role selected' });
    }

    next();
};

// Registration route
router.post('/register', validateRegistration, async (req, res) => {
    try {
        const { email, password, fullName, role } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Create new user
        const user = new User({
            email,
            password,
            fullName,
            role
        });

        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'Registration successful',
            token,
            user: {
                id: user._id,
                email: user.email,
                fullName: user.fullName,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'An error occurred during registration' });
    }
});

// Login route
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                email: user.email,
                fullName: user.fullName,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'An error occurred during login' });
    }
});

module.exports = router; 