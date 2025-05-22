import { auth, db } from './firebase-config.js';
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');
    const loginButton = document.getElementById('login-button');

    // Check for remembered email
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
        document.getElementById('email').value = rememberedEmail;
        document.getElementById('remember-me').checked = true;
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('remember-me').checked;

        // Enhanced input validation
        if (!email || !password) {
            showError('Please fill in all fields');
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showError('Please enter a valid email address');
            return;
        }

        // Validate password length
        if (password.length < 8) {
            showError('Password must be at least 8 characters long');
            return;
        }

        // Show loading state
        setLoading(true);

        try {
            // Sign in user
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Get user role from Firestore
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            const userData = userDoc.data();

            if (!userData) {
                throw new Error('User data not found');
            }

            if (!userData.isActive) {
                throw new Error('This account has been deactivated. Please contact administrator.');
            }

            // Store user role in session storage
            sessionStorage.setItem('userRole', userData.role);
            sessionStorage.setItem('userId', user.uid);
            sessionStorage.setItem('userEmail', user.email);

            // Remember email if checkbox is checked
            if (rememberMe) {
                localStorage.setItem('rememberedEmail', email);
            } else {
                localStorage.removeItem('rememberedEmail');
            }

            // Show success message
            showSuccess();

            // Redirect based on role
            switch(userData.role) {
                case 'admin':
                    showSuccess('Login successful! Redirecting to Admin Dashboard...');
                    setTimeout(() => window.location.href = 'admin.html', 1500);
                    break;
                case 'candidate':
                    showSuccess('Login successful! Redirecting to Candidate Dashboard...');
                    setTimeout(() => window.location.href = 'candidate.html', 1500);
                    break;
                case 'voter':
                    showSuccess('Login successful! Redirecting to Voter Dashboard...');
                    setTimeout(() => window.location.href = 'voter.html', 1500);
                    break;
                default:
                    showError('Invalid user role. Please contact administrator.');
                    break;
            }

        } catch (error) {
            console.error('Login error:', error);
            showError(getErrorMessage(error.code));
        } finally {
            setLoading(false);
        }
    });

    function setLoading(isLoading) {
        loginButton.disabled = isLoading;
        loginButton.textContent = isLoading ? 'Logging in...' : 'Login';
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        successMessage.style.display = 'none';
        
        // Clear error message after 5 seconds
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 5000);
    }

    function showSuccess(message) {
        errorMessage.style.display = 'none';
        successMessage.style.display = 'block';
        successMessage.textContent = message || 'Login successful!';
    }

    function getErrorMessage(errorCode) {
        switch (errorCode) {
            case 'auth/invalid-email':
                return 'Invalid email address format';
            case 'auth/user-disabled':
                return 'This account has been disabled. Please contact administrator.';
            case 'auth/user-not-found':
                return 'No account found with this email. Please check your email or register.';
            case 'auth/wrong-password':
                return 'Incorrect password. Please try again.';
            case 'auth/too-many-requests':
                return 'Too many failed login attempts. Please try again later.';
            case 'auth/network-request-failed':
                return 'Network error. Please check your internet connection.';
            default:
                return 'An error occurred during login. Please try again.';
        }
    }
}); 