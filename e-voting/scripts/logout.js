import { auth } from './firebase-config.js';
import { signOut } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
    const logoutButton = document.getElementById('logout-button');
    
    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            try {
                // Sign out from Firebase
                await signOut(auth);
                
                // Clear session storage
                sessionStorage.clear();
                
                // Clear local storage
                localStorage.clear();
                
                // Show success message
                const successMessage = document.createElement('div');
                successMessage.className = 'success-message';
                successMessage.textContent = 'Logging out...';
                document.body.appendChild(successMessage);
                
                // Redirect to login page after 1 second
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1000);
                
            } catch (error) {
                console.error('Logout error:', error);
                const errorMessage = document.createElement('div');
                errorMessage.className = 'error-message';
                errorMessage.textContent = 'Error logging out. Please try again.';
                document.body.appendChild(errorMessage);
                
                // Remove error message after 3 seconds
                setTimeout(() => {
                    errorMessage.remove();
                }, 3000);
            }
        });
    }
}); 