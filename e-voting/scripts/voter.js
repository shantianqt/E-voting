import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-auth.js";
import { 
    collection, 
    getDocs, 
    doc, 
    getDoc, 
    updateDoc, 
    onSnapshot,
    query,
    where,
    increment
} from "https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    const candidatesContainer = document.getElementById('candidates-container');
    const resultsContainer = document.getElementById('results-container');
    const voteButton = document.getElementById('vote-button');
    const loadingSpinner = document.getElementById('loading-spinner');
    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');

    let selectedCandidateId = null;
    let hasVoted = false;

    // Show loading state
    function showLoading() {
        loadingSpinner.style.display = 'block';
        voteButton.disabled = true;
    }

    // Hide loading state
    function hideLoading() {
        loadingSpinner.style.display = 'none';
        voteButton.disabled = false;
    }

    // Show error message
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        successMessage.style.display = 'none';
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 5000);
    }

    // Show success message
    function showSuccess(message) {
        successMessage.textContent = message;
        successMessage.style.display = 'block';
        errorMessage.style.display = 'none';
        setTimeout(() => {
            successMessage.style.display = 'none';
        }, 5000);
    }

    // Load candidates
    async function loadCandidates() {
        try {
            showLoading();
            const candidatesSnapshot = await getDocs(collection(db, 'candidates'));
            
            candidatesContainer.innerHTML = '';
            candidatesSnapshot.forEach((doc) => {
                const candidate = doc.data();
                const candidateElement = document.createElement('div');
                candidateElement.className = 'candidate-card';
                candidateElement.innerHTML = `
                    <h3>${candidate.name}</h3>
                    <p>${candidate.description || ''}</p>
                    <button class="select-btn" data-id="${doc.id}">Select</button>
                `;
                candidatesContainer.appendChild(candidateElement);
            });

            // Add click handlers for select buttons
            document.querySelectorAll('.select-btn').forEach(button => {
                button.addEventListener('click', () => {
                    selectedCandidateId = button.dataset.id;
                    document.querySelectorAll('.select-btn').forEach(btn => {
                        btn.classList.remove('selected');
                    });
                    button.classList.add('selected');
                    voteButton.disabled = false;
                });
            });

        } catch (error) {
            showError('Error loading candidates: ' + error.message);
        } finally {
            hideLoading();
        }
    }

    // Load results
    async function loadResults() {
        try {
            const candidatesSnapshot = await getDocs(collection(db, 'candidates'));
            
            resultsContainer.innerHTML = '';
            candidatesSnapshot.forEach((doc) => {
                const candidate = doc.data();
                const resultElement = document.createElement('div');
                resultElement.className = 'result-item';
                resultElement.innerHTML = `
                    <span class="candidate-name">${candidate.name}</span>
                    <span class="vote-count">${candidate.votes || 0} votes</span>
                `;
                resultsContainer.appendChild(resultElement);
            });
        } catch (error) {
            showError('Error loading results: ' + error.message);
        }
    }

    // Submit vote
    async function submitVote() {
        if (!selectedCandidateId) {
            showError('Please select a candidate first');
            return;
        }

        if (hasVoted) {
            showError('You have already voted');
            return;
        }

        try {
            showLoading();
            const user = auth.currentUser;
            if (!user) {
                throw new Error('You must be logged in to vote');
            }

            // Check if user has already voted
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.data().hasVoted) {
                hasVoted = true;
                throw new Error('You have already voted');
            }

            // Update candidate votes
            await updateDoc(doc(db, 'candidates', selectedCandidateId), {
                votes: increment(1)
            });

            // Mark user as voted
            await updateDoc(doc(db, 'users', user.uid), {
                hasVoted: true,
                votedFor: selectedCandidateId,
                votedAt: new Date().toISOString()
            });

            hasVoted = true;
            showSuccess('Vote submitted successfully!');
            await loadResults();
            voteButton.disabled = true;

        } catch (error) {
            showError('Error submitting vote: ' + error.message);
        } finally {
            hideLoading();
        }
    }

    // Initialize page
    async function initializePage() {
        try {
            await loadCandidates();
            await loadResults();

            // Set up real-time updates for results
            const candidatesRef = collection(db, 'candidates');
            onSnapshot(candidatesRef, () => {
                loadResults();
            });

        } catch (error) {
            showError('Error initializing page: ' + error.message);
        }
    }

    // Event Listeners
    voteButton.addEventListener('click', submitVote);

    // Check authentication state
    onAuthStateChanged(auth, (user) => {
        if (user) {
            initializePage();
        } else {
            window.location.href = 'login.html';
        }
    });

    // Add this at the end of the DOMContentLoaded callback
    window.loadMyVote = async function() {
        const myVoteDetails = document.getElementById('my-vote-details');
        myVoteDetails.innerHTML = 'Loading...';
        try {
            const user = auth.currentUser;
            if (!user) {
                myVoteDetails.innerHTML = '<span style="color:red">You must be logged in to view your vote.</span>';
                return;
            }
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            const userData = userDoc.data();
            if (!userData || !userData.hasVoted || !userData.votedFor) {
                myVoteDetails.innerHTML = '<span style="color:orange">You have not voted yet.</span>';
                return;
            }
            // Fetch candidate info
            const candidateDoc = await getDoc(doc(db, 'candidates', userData.votedFor));
            if (!candidateDoc.exists()) {
                myVoteDetails.innerHTML = '<span style="color:red">Voted candidate not found.</span>';
                return;
            }
            const candidate = candidateDoc.data();
            myVoteDetails.innerHTML = `
                <strong>You voted for:</strong><br>
                <span style="font-size:1.2em;">${candidate.name}</span><br>
                <span>Position: ${candidate.position || 'N/A'}</span><br>
                <span>At: ${userData.votedAt ? new Date(userData.votedAt).toLocaleString() : 'Unknown time'}</span>
            `;
        } catch (error) {
            myVoteDetails.innerHTML = '<span style="color:red">Error loading your vote: ' + error.message + '</span>';
        }
    };

    // Example candidate data
    const candidates = [
        { name: "Alice Johnson", party: "Party A" },
        { name: "Bob Smith", party: "Party B" },
        { name: "Carol Lee", party: "Party C" }
    ];

    function showCandidates() {
        const container = document.getElementById('candidatesContainer');
        container.innerHTML = ''; // Clear previous content

        if (candidates.length === 0) {
            container.textContent = "No candidates available.";
            return;
        }

        const list = document.createElement('ul');
        candidates.forEach(candidate => {
            const item = document.createElement('li');
            item.textContent = `${candidate.name} (${candidate.party})`;
            list.appendChild(item);
        });
        container.appendChild(list);
    }
}); 