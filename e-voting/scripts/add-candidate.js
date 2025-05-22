import { auth, db } from './firebase-config.js';
import { 
    collection, 
    addDoc, 
    getDocs, 
    deleteDoc, 
    doc, 
    updateDoc 
} from "https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js";
import { 
    getStorage, 
    ref, 
    uploadBytes, 
    getDownloadURL 
} from "https://www.gstatic.com/firebasejs/11.7.1/firebase-storage.js";

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('add-candidate-form');
    const imageInput = document.getElementById('candidate-image');
    const imagePreview = document.getElementById('image-preview');
    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');
    const candidatesGrid = document.getElementById('candidates-grid');

    // Check if user is admin
    const userRole = sessionStorage.getItem('userRole');
    if (userRole !== 'admin') {
        window.location.href = 'index.html';
    }

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
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
            const name = document.getElementById('candidate-name').value;
            const position = document.getElementById('candidate-position').value;
            const party = document.getElementById('candidate-party').value;
            const bio = document.getElementById('candidate-bio').value;
            const imageFile = imageInput.files[0];

            if (!imageFile) {
                throw new Error('Please select an image');
            }

            // Upload image to Firebase Storage
            const storage = getStorage();
            const imageRef = ref(storage, `candidates/${Date.now()}_${imageFile.name}`);
            await uploadBytes(imageRef, imageFile);
            const imageUrl = await getDownloadURL(imageRef);

            // Add candidate to Firestore
            const candidateData = {
                name,
                position,
                party,
                bio,
                imageUrl,
                votes: 0,
                createdAt: new Date()
            };

            await addDoc(collection(db, 'candidates'), candidateData);

            // Show success message
            showMessage('Candidate added successfully!', 'success');
            form.reset();
            imagePreview.innerHTML = '';
            loadCandidates(); // Reload the candidates list

        } catch (error) {
            console.error('Error adding candidate:', error);
            showMessage(error.message, 'error');
        }
    });

    // Load existing candidates
    async function loadCandidates() {
        try {
            const querySnapshot = await getDocs(collection(db, 'candidates'));
            candidatesGrid.innerHTML = '';

            querySnapshot.forEach((doc) => {
                const candidate = doc.data();
                const card = createCandidateCard(doc.id, candidate);
                candidatesGrid.appendChild(card);
            });
        } catch (error) {
            console.error('Error loading candidates:', error);
            showMessage('Error loading candidates', 'error');
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
                <div class="candidate-actions">
                    <button class="edit-btn" onclick="editCandidate('${id}')">Edit</button>
                    <button class="delete-btn" onclick="deleteCandidate('${id}')">Delete</button>
                </div>
            </div>
        `;
        return card;
    }

    // Show message
    function showMessage(message, type) {
        const messageElement = type === 'error' ? errorMessage : successMessage;
        messageElement.textContent = message;
        messageElement.style.display = 'block';
        
        setTimeout(() => {
            messageElement.style.display = 'none';
        }, 3000);
    }

    // Delete candidate
    window.deleteCandidate = async (id) => {
        if (confirm('Are you sure you want to delete this candidate?')) {
            try {
                await deleteDoc(doc(db, 'candidates', id));
                showMessage('Candidate deleted successfully!', 'success');
                loadCandidates();
            } catch (error) {
                console.error('Error deleting candidate:', error);
                showMessage('Error deleting candidate', 'error');
            }
        }
    };

    // Edit candidate
    window.editCandidate = (id) => {
        // Implement edit functionality
        console.log('Edit candidate:', id);
    };

    // Load candidates on page load
    loadCandidates();
}); 