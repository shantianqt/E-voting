// CSRF Protection
const generateCSRFToken = () => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

const validateCSRFToken = (token) => {
    const storedToken = sessionStorage.getItem('csrfToken');
    return token === storedToken;
};

// Rate Limiting
const rateLimiter = {
    votes: new Map(),
    maxVotes: 1, // Maximum votes per minute
    windowMs: 60000, // 1 minute window

    canVote: function(userId) {
        const now = Date.now();
        const userVotes = this.votes.get(userId) || [];
        
        // Remove old votes outside the window
        const recentVotes = userVotes.filter(time => now - time < this.windowMs);
        
        if (recentVotes.length >= this.maxVotes) {
            return false;
        }
        
        recentVotes.push(now);
        this.votes.set(userId, recentVotes);
        return true;
    }
};

// Input Validation and Sanitization
const sanitizeInput = (input) => {
    if (typeof input !== 'string') return '';
    return input
        .replace(/[<>]/g, '') // Remove < and > to prevent XSS
        .trim();
};

const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const validatePassword = (password) => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
    return passwordRegex.test(password);
};

// Session Management
const sessionManager = {
    timeout: 30 * 60 * 1000, // 30 minutes
    lastActivity: Date.now(),

    init: function() {
        this.resetTimer();
        this.setupActivityListeners();
    },

    resetTimer: function() {
        this.lastActivity = Date.now();
    },

    setupActivityListeners: function() {
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
        events.forEach(event => {
            document.addEventListener(event, () => this.resetTimer());
        });
    },

    checkSession: function() {
        const now = Date.now();
        if (now - this.lastActivity > this.timeout) {
            this.handleSessionTimeout();
        }
    },

    handleSessionTimeout: function() {
        // Clear session data
        sessionStorage.clear();
        // Redirect to login page
        window.location.href = '/login.html';
    }
};

// Initialize session management
sessionManager.init();
setInterval(() => sessionManager.checkSession(), 60000); // Check every minute

export {
    generateCSRFToken,
    validateCSRFToken,
    rateLimiter,
    sanitizeInput,
    validateEmail,
    validatePassword,
    sessionManager
}; 