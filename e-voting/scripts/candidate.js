import { auth, db } from './firebase-config.js';
import { 
    doc, 
    getDoc, 
    updateDoc, 
    onSnapshot,
    collection,
    getDocs 
} from "https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    const candidateId = sessionStorage.getItem('userId');
    const errorMessage = document.createElement('div');
    errorMessage.id = 'error-message';
    document.querySelector('main').insertBefore(errorMessage, document.querySelector('.card-container'));

    // Check session
    function checkSession() {
        const userRole = sessionStorage.getItem('userRole');
        const userId = sessionStorage.getItem('userId');
        
        if (!userRole || !userId) {
            window.location.href = 'login.html';
            return;
        }
        
        if (userRole !== 'candidate') {
            window.location.href = 'index.html';
            return;
        }
    }

    // Initialize modal
    const modal = document.getElementById('edit-profile-modal');
    const editBtn = document.getElementById('edit-profile-btn');
    const closeBtn = document.querySelector('.close');
    const editForm = document.getElementById('edit-profile-form');

    editBtn.onclick = () => {
        modal.style.display = "block";
    }

    closeBtn.onclick = () => {
        modal.style.display = "none";
    }

    window.onclick = (event) => {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }

    // Handle profile update
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const loadingIndicator = document.getElementById('loading-indicator');
        loadingIndicator.style.display = 'block';

        try {
            const name = document.getElementById('edit-name').value;
            const party = document.getElementById('edit-party').value;
            const district = document.getElementById('edit-district').value;

            await updateDoc(doc(db, 'candidates', candidateId), {
                name,
                party,
                district,
                updatedAt: new Date().toISOString()
            });

            modal.style.display = "none";
            alert('Profile updated successfully!');
        } catch (error) {
            console.error('Error updating profile:', error);
            errorMessage.textContent = error.message;
            errorMessage.style.display = 'block';
        } finally {
            loadingIndicator.style.display = 'none';
        }
    });

    // Real-time updates for candidate data
    function subscribeToVotes() {
        return onSnapshot(doc(db, 'candidates', candidateId), (doc) => {
            if (doc.exists()) {
                updateVoteDisplay(doc.data());
            }
        });
    }

    // Update vote display
    function updateVoteDisplay(data) {
        document.getElementById('candidate-name').textContent = data.name || 'Not specified';
        document.getElementById('candidate-party').textContent = data.party || 'Independent';
        document.getElementById('candidate-district').textContent = data.district || 'Not specified';
        document.getElementById('total-votes').textContent = data.votes || 0;

        // Update form fields
        document.getElementById('edit-name').value = data.name || '';
        document.getElementById('edit-party').value = data.party || '';
        document.getElementById('edit-district').value = data.district || '';
    }

    // Calculate and update statistics
    async function updateStatistics() {
        const loadingIndicator = document.getElementById('results-loading');
        loadingIndicator.style.display = 'block';

        try {
            const candidatesSnapshot = await getDocs(collection(db, 'candidates'));
            let totalVotes = 0;
            let candidateVotes = 0;

            candidatesSnapshot.forEach(doc => {
                const votes = doc.data().votes || 0;
                totalVotes += votes;
                if (doc.id === candidateId) {
                    candidateVotes = votes;
                }
            });

            const winningPercentage = totalVotes > 0 
                ? ((candidateVotes / totalVotes) * 100).toFixed(2)
                : '0.00';

            document.getElementById('winning-percentage').textContent = `${winningPercentage}%`;
            document.getElementById('total-voters').textContent = totalVotes;

        } catch (error) {
            console.error('Error updating statistics:', error);
            errorMessage.textContent = error.message;
            errorMessage.style.display = 'block';
        } finally {
            loadingIndicator.style.display = 'none';
        }
    }

    // Initialize
    checkSession();
    const unsubscribe = subscribeToVotes();
    updateStatistics();

    // Update statistics every 30 seconds
    setInterval(updateStatistics, 30000);

    // Cleanup on page unload
    window.addEventListener('unload', () => {
        unsubscribe();
    });
}); 