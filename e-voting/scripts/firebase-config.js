// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-storage.js";

// Your web app's Firebase configuration
// Replace these values with your Firebase project configuration
const firebaseConfig = {
    apiKey: "AIzaSyClbIt-R3Vywa6E4NCz2jaESqpsOKnykD4",
    authDomain: "voting-system-d7349.firebaseapp.com",
    projectId: "voting-system-d7349",
    storageBucket: "voting-system-d7349.appspot.com",
    messagingSenderId: "224286551928",
    appId: "1:224286551928:web:c3023fe77d7dca6646a28d",
    measurementId: "G-HPET614SEY"
};

// Initialize Firebase services
let app;
let auth;
let db;
let storage;

try {
    // Initialize Firebase
    app = initializeApp(firebaseConfig);

    // Initialize Firebase Authentication
    auth = getAuth(app);

    // Initialize Cloud Firestore
    db = getFirestore(app);

    // Initialize Firebase Storage
    storage = getStorage(app);

    console.log('Firebase services initialized successfully');
} catch (error) {
    console.error('Error initializing Firebase services:', error);
    // Show error to user
    const errorMessage = document.createElement('div');
    errorMessage.className = 'error-message';
    errorMessage.textContent = 'Error initializing the application. Please refresh the page or try again later.';
    document.body.prepend(errorMessage);
}

// Export Firebase services
export { auth, db, storage };

// Test Firebase services
async function testFirebaseServices() {
    try {
        // Test Auth
        const currentUser = auth.currentUser;
        console.log('Auth status:', currentUser ? 'Logged in' : 'Not logged in');

        // Test Firestore
        const testDoc = await getDocs(collection(db, 'candidates'));
        console.log('Firestore connection:', 'Success');

        // Test Storage
        const testRef = ref(storage, 'test.txt');
        console.log('Storage connection:', 'Success');

        return true;
    } catch (error) {
        console.error('Firebase services test failed:', error);
        return false;
    }
}

// Run test when page loads
document.addEventListener('DOMContentLoaded', () => {
    testFirebaseServices().then(success => {
        if (!success) {
            showError('Error connecting to Firebase services. Please check your configuration.');
        }
    });
});