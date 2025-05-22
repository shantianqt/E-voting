import { auth, db } from './firebase-config.js';
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-form');
    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');
    const registerButton = document.getElementById('register-button');
    const buttonText = registerButton.querySelector('.button-text');
    const spinner = registerButton.querySelector('.spinner');

    // Password requirements elements
    const lengthCheck = document.getElementById('length');
    const uppercaseCheck = document.getElementById('uppercase');
    const lowercaseCheck = document.getElementById('lowercase');
    const numberCheck = document.getElementById('number');

    // Show/hide password functionality
    const togglePassword = document.getElementById('toggle-password');
    const passwordInput = document.getElementById('password');
    
    togglePassword.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        togglePassword.textContent = type === 'password' ? '👁️' : '👁️‍🗨️';
    });

    // Password strength checker
    passwordInput.addEventListener('input', () => {
        const password = passwordInput.value;
        
        // Check length
        if (password.length >= 8) {
            lengthCheck.classList.add('valid');
        } else {
            lengthCheck.classList.remove('valid');
        }

        // Check uppercase
        if (/[A-Z]/.test(password)) {
            uppercaseCheck.classList.add('valid');
        } else {
            uppercaseCheck.classList.remove('valid');
        }

        // Check lowercase
        if (/[a-z]/.test(password)) {
            lowercaseCheck.classList.add('valid');
        } else {
            lowercaseCheck.classList.remove('valid');
        }

        // Check number
        if (/[0-9]/.test(password)) {
            numberCheck.classList.add('valid');
        } else {
            numberCheck.classList.remove('valid');
        }
    });

    // Form validation
    function validateForm(email, password, confirmPassword, fullName, role) {
        if (!email || !password || !confirmPassword || !fullName || !role) {
            throw new Error('All fields are required');
        }

        if (password.length < 8) {
            throw new Error('Password must be at least 8 characters long');
        }

        if (!/[A-Z]/.test(password)) {
            throw new Error('Password must contain at least one uppercase letter');
        }

        if (!/[a-z]/.test(password)) {
            throw new Error('Password must contain at least one lowercase letter');
        }

        if (!/[0-9]/.test(password)) {
            throw new Error('Password must contain at least one number');
        }

        if (password !== confirmPassword) {
            throw new Error('Passwords do not match');
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new Error('Invalid email format');
        }

        const nameRegex = /^[A-Za-z\s]{2,50}$/;
        if (!nameRegex.test(fullName)) {
            throw new Error('Invalid name format (2-50 characters, letters only)');
        }

        if (role !== 'voter' && role !== 'candidate' && role !== 'admin') {
            throw new Error('Invalid role selected');
        }
    }

    // Registration handler
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        const fullName = document.getElementById('full-name').value;
        const role = document.getElementById('role').value;

        try {
            // Set loading state
            setLoading(true);

            // Validate form
            validateForm(email, password, confirmPassword, fullName, role);

            // Create user account in Firebase Authentication
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Create user document in Firestore
            await setDoc(doc(db, 'users', user.uid), {
                email: email,
                fullName: fullName,
                role: role,
                createdAt: new Date().toISOString(),
                isActive: true
            });

            // If role is candidate, create candidate document
            if (role === 'candidate') {
                await setDoc(doc(db, 'candidates', user.uid), {
                    userId: user.uid,
                    email: email,
                    fullName: fullName,
                    votes: 0,
                    createdAt: new Date().toISOString()
                });
            }

            // Show success message
            showMessage('Registration successful! Redirecting to login...', 'success');

            // Redirect to login page after 2 seconds
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);

        } catch (error) {
            console.error('Registration error:', error);
            showMessage(getErrorMessage(error.code), 'error');
        } finally {
            setLoading(false);
        }
    });

    function setLoading(isLoading) {
        registerButton.disabled = isLoading;
        buttonText.style.display = isLoading ? 'none' : 'inline';
        spinner.style.display = isLoading ? 'inline-block' : 'none';
    }

    function showMessage(message, type) {
        const messageElement = type === 'error' ? errorMessage : successMessage;
        messageElement.textContent = message;
        messageElement.style.display = 'block';
        
        if (type === 'error') {
            setTimeout(() => {
                messageElement.style.display = 'none';
            }, 5000);
        }
    }

    function getErrorMessage(errorCode) {
        switch (errorCode) {
            case 'auth/email-already-in-use':
                return 'This email is already registered';
            case 'auth/invalid-email':
                return 'Invalid email address';
            case 'auth/operation-not-allowed':
                return 'Registration is currently disabled';
            case 'auth/weak-password':
                return 'Password is too weak';
            default:
                return 'An error occurred during registration. Please try again.';
        }
    }
}); 