import { 
    generateCSRFToken, 
    validateCSRFToken, 
    rateLimiter, 
    sanitizeInput, 
    sessionManager 
} from './security.js';

document.addEventListener('DOMContentLoaded', () => {
    const voteForm = document.getElementById('voteForm');
    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');

    // Generate and store CSRF token
    const csrfToken = generateCSRFToken();
    sessionStorage.setItem('csrfToken', csrfToken);

    // Add CSRF token to form
    const csrfInput = document.createElement('input');
    csrfInput.type = 'hidden';
    csrfInput.name = 'csrfToken';
    csrfInput.value = csrfToken;
    voteForm.appendChild(csrfInput);

    // Form submission handler
    voteForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Validate CSRF token
        const formToken = voteForm.querySelector('input[name="csrfToken"]').value;
        if (!validateCSRFToken(formToken)) {
            showError('Invalid form submission. Please refresh the page and try again.');
            return;
        }

        // Get user ID from session
        const userId = sessionStorage.getItem('userId');
        if (!userId) {
            showError('Please log in to vote.');
            return;
        }

        // Check rate limit
        if (!rateLimiter.canVote(userId)) {
            showError('You can only vote once per minute. Please wait before voting again.');
            return;
        }

        // Get selected candidate
        const selectedCandidate = voteForm.querySelector('select').value;
        if (!selectedCandidate) {
            showError('Please select a candidate.');
            return;
        }

        try {
            // Send vote to server
            const response = await fetch('/api/votes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': formToken
                },
                body: JSON.stringify({
                    candidateId: selectedCandidate,
                    userId: userId
                })
            });

            if (!response.ok) {
                throw new Error('Failed to submit vote');
            }

            // Show success message
            showSuccess('Vote submitted successfully!');
            
            // Reset form
            voteForm.reset();
            
            // Refresh results
            loadResults();

        } catch (error) {
            showError('Failed to submit vote. Please try again.');
            console.error('Error:', error);
        }
    });

    // Load voting results
    async function loadResults() {
        try {
            const response = await fetch('/api/results');
            const results = await response.json();
            
            const resultsContainer = document.getElementById('results');
            resultsContainer.innerHTML = results.map(result => `
                <div class="result-item">
                    <span class="candidate-name">${result.name}</span>
                    <span class="vote-count">${result.votes} votes</span>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error loading results:', error);
            showError('Failed to load results.');
        }
    }

    // Helper functions
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        successMessage.style.display = 'none';
    }

    function showSuccess(message) {
        successMessage.textContent = message;
        successMessage.style.display = 'block';
        errorMessage.style.display = 'none';
    }

    // Initial load of results
    loadResults();
}); 