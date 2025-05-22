const mongoose = require('mongoose');
const Candidate = require('../models/Candidate');
const Vote = require('../models/Vote');

// Sample candidates data
const sampleCandidates = [
    {
        name: "John Doe",
        position: "president",
        party: "Progressive Party",
        bio: "Experienced leader with 10 years of public service. Committed to transparency and community development.",
        imageUrl: "/uploads/candidates/default-president.jpg",
        votes: 0
    },
    {
        name: "Jane Smith",
        position: "vice-president",
        party: "Unity Party",
        bio: "Dedicated public servant with a focus on education and healthcare reform. Former school board member.",
        imageUrl: "/uploads/candidates/default-vice-president.jpg",
        votes: 0
    },
    {
        name: "Mike Johnson",
        position: "secretary",
        party: "Progressive Party",
        bio: "Detail-oriented professional with extensive experience in documentation and record-keeping.",
        imageUrl: "/uploads/candidates/default-secretary.jpg",
        votes: 0
    }
];

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/voting_system', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(async () => {
    console.log('Connected to MongoDB');

    try {
        // Clear existing data
        await Candidate.deleteMany({});
        await Vote.deleteMany({});
        console.log('Cleared existing data');

        // Insert sample candidates
        await Candidate.insertMany(sampleCandidates);
        console.log('Added sample candidates');

        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Error initializing database:', error);
    } finally {
        // Close the connection
        mongoose.connection.close();
    }
})
.catch((error) => {
    console.error('Error connecting to MongoDB:', error);
}); 