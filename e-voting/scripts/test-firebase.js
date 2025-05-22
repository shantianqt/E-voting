import { auth, db } from './firebase-config.js';
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-auth.js";
import { collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js";

// Test Firebase Authentication
async function testAuth() {
    try {
        console.log('Testing Firebase Authentication...');
        // Try to sign in with test credentials
        const userCredential = await signInWithEmailAndPassword(auth, 'test@example.com', 'password123');
        console.log('Authentication successful!', userCredential.user);
        return true;
    } catch (error) {
        console.error('Authentication test failed:', error.message);
        return false;
    }
}

// Test Firestore
async function testFirestore() {
    try {
        console.log('Testing Firestore...');
        // Try to add a test document
        const testCollection = collection(db, 'test');
        const docRef = await addDoc(testCollection, {
            test: 'Hello Firebase!',
            timestamp: new Date()
        });
        console.log('Document written with ID:', docRef.id);

        // Try to read the test document
        const querySnapshot = await getDocs(testCollection);
        querySnapshot.forEach((doc) => {
            console.log('Document data:', doc.data());
        });
        return true;
    } catch (error) {
        console.error('Firestore test failed:', error.message);
        return false;
    }
}

// Run tests
async function runTests() {
    console.log('Starting Firebase connection tests...');
    
    const authResult = await testAuth();
    const firestoreResult = await testFirestore();
    
    if (authResult && firestoreResult) {
        console.log('All tests passed! Firebase is properly configured.');
    } else {
        console.log('Some tests failed. Please check the errors above.');
    }
}

// Run the tests when the page loads
document.addEventListener('DOMContentLoaded', runTests);

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.createElement('div');
    errorMessage.id = 'error-message';
    errorMessage.style.display = 'none';
    errorMessage.style.color = 'red';
    errorMessage.style.marginBottom = '10px';
    loginForm.parentNode.insertBefore(errorMessage, loginForm);

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            await signInWithEmailAndPassword(auth, email, password);
            // Redirect to home or dashboard
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Login error:', error);
            errorMessage.textContent = error.message;
            errorMessage.style.display = 'block';
        }
    });
}); 