import { auth, db } from './firebase-config.js';
import { 
    collection, 
    getDocs, 
    doc, 
    getDoc, 
    addDoc, 
    updateDoc, 
    deleteDoc 
} from "https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js";
import { 
    getStorage, 
    ref, 
    uploadBytes, 
    getDownloadURL,
    deleteObject 
} from "https://www.gstatic.com/firebasejs/11.7.1/firebase-storage.js";

document.addEventListener('DOMContentLoaded', async () => {
    // Check if user is logged in and is an admin
    const userRole = sessionStorage.getItem('userRole');
    if (!userRole || userRole !== 'admin') {
        window.location.href = 'login.html';
        return;
    }

    // Initialize Firebase Storage
    const storage = getStorage();

    // DOM Elements
    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');
    const loadingIndicator = document.getElementById('loading-indicator');
    const statsContainer = document.getElementById('stats-container');
    const candidatesGrid = document.getElementById('candidates-grid');
    const resultsDisplay = document.getElementById('results-display');
    const addCandidateBtn = document.getElementById('add-candidate-btn');
    const candidateModal = document.getElementById('candidate-modal');
    const candidateForm = document.getElementById('candidate-form');
    const closeModal = document.querySelector('.close');
    const imagePreview = document.getElementById('image-preview');
    const imageInput = document.getElementById('candidate-image');

    // Show loading indicator
    loadingIndicator.style.display = 'block';

    try {
        await loadCandidates();
        await loadStatistics();
    } catch (error) {
        showError('Error loading data: ' + error.message);
    } finally {
        loadingIndicator.style.display = 'none';
    }

    // Modal functionality
    addCandidateBtn.addEventListener('click', () => {
        candidateModal.style.display = 'block';
    });

    closeModal.addEventListener('click', () => {
        candidateModal.style.display = 'none';
        candidateForm.reset();
        imagePreview.innerHTML = '';
    });

    window.addEventListener('click', (e) => {
        if (e.target === candidateModal) {
            candidateModal.style.display = 'none';
            candidateForm.reset();
            imagePreview.innerHTML = '';
        }
    });

    // Image preview
    imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
            };
            reader.readAsDataURL(file);
        }
    });

    // Form submission
    candidateForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        loadingIndicator.style.display = 'block';

        try {
            const formData = {
                name: document.getElementById('candidate-name').value,
                position: document.getElementById('candidate-position').value,
                party: document.getElementById('candidate-party').value,
                bio: document.getElementById('candidate-bio').value,
                idNumber: document.getElementById('candidate-id').value,
                address: document.getElementById('candidate-address').value,
                contact: document.getElementById('candidate-contact').value,
                votes: 0,
                createdAt: new Date().toISOString()
            };

            // Upload image
            const imageFile = imageInput.files[0];
            if (!imageFile) {
                throw new Error('Please select an image');
            }

            const imageRef = ref(storage, `candidates/${Date.now()}_${imageFile.name}`);
            await uploadBytes(imageRef, imageFile);
            formData.imageUrl = await getDownloadURL(imageRef);

            // Add candidate to Firestore
            await addDoc(collection(db, 'candidates'), formData);

            showSuccess('Candidate added successfully!');
            candidateModal.style.display = 'none';
            candidateForm.reset();
            imagePreview.innerHTML = '';
            await loadCandidates();
            await loadStatistics();

        } catch (error) {
            showError('Error adding candidate: ' + error.message);
        } finally {
            loadingIndicator.style.display = 'none';
        }
    });

    // Load candidates
    async function loadCandidates() {
        try {
            const candidatesSnapshot = await getDocs(collection(db, 'candidates'));
            candidatesGrid.innerHTML = '';

            candidatesSnapshot.forEach(doc => {
                const candidate = doc.data();
                const card = createCandidateCard(doc.id, candidate);
                candidatesGrid.appendChild(card);
            });
        } catch (error) {
            throw new Error('Error loading candidates: ' + error.message);
        }
    }

    // Create candidate card
    function createCandidateCard(id, candidate) {
        const card = document.createElement('div');
        card.className = 'candidate-card';
        card.innerHTML = `
            <img src="${candidate.imageUrl}" alt="${candidate.name}" class="candidate-image">
            <div class="candidate-info">
                <h3 class="candidate-name">${candidate.name}</h3>
                <p class="candidate-position">${candidate.position}</p>
                <p class="candidate-party">${candidate.party}</p>
                <p class="candidate-votes">Votes: ${candidate.votes || 0}</p>
                <div class="candidate-actions">
                    <button class="edit-btn" onclick="editCandidate('${id}')">Edit</button>
                    <button class="delete-btn" onclick="deleteCandidate('${id}')">Delete</button>
                </div>
            </div>
        `;
        return card;
    }

    // Load statistics
    async function loadStatistics() {
        try {
            const candidatesSnapshot = await getDocs(collection(db, 'candidates'));
            const candidates = [];
            let totalVotes = 0;

            candidatesSnapshot.forEach(doc => {
                const data = doc.data();
                candidates.push(data);
                totalVotes += data.votes || 0;
            });

            statsContainer.innerHTML = `
                <div class="stat-card">
                    <h3>Total Candidates</h3>
                    <p>${candidates.length}</p>
                </div>
                <div class="stat-card">
                    <h3>Total Votes</h3>
                    <p>${totalVotes}</p>
                </div>
                <div class="stat-card">
                    <h3>Average Votes</h3>
                    <p>${(totalVotes / candidates.length || 0).toFixed(2)}</p>
                </div>
            `;
        } catch (error) {
            throw new Error('Error loading statistics: ' + error.message);
        }
    }

    // Delete candidate
    window.deleteCandidate = async (id) => {
        if (confirm('Are you sure you want to delete this candidate?')) {
            loadingIndicator.style.display = 'block';
            try {
                const candidateDoc = await getDoc(doc(db, 'candidates', id));
                const candidateData = candidateDoc.data();

                // Delete image from storage
                if (candidateData.imageUrl) {
                    const imageRef = ref(storage, candidateData.imageUrl);
                    await deleteObject(imageRef);
                }

                // Delete candidate document
                await deleteDoc(doc(db, 'candidates', id));

                showSuccess('Candidate deleted successfully!');
                await loadCandidates();
                await loadStatistics();
            } catch (error) {
                showError('Error deleting candidate: ' + error.message);
            } finally {
                loadingIndicator.style.display = 'none';
            }
        }
    };

    // Edit candidate
    window.editCandidate = async (id) => {
        // Implement edit functionality
        console.log('Edit candidate:', id);
    };

    // Utility functions
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 5000);
    }

    function showSuccess(message) {
        successMessage.textContent = message;
        successMessage.style.display = 'block';
        setTimeout(() => {
            successMessage.style.display = 'none';
        }, 3000);
    }
}); 