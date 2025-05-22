const express = require('express');
const router = express.Router();
const Candidate = require('../models/Candidate');

// GET voting results
router.get('/', async (req, res) => {
    try {
        // Get all candidates grouped by position
        const results = await Candidate.aggregate([
            {
                $group: {
                    _id: '$position',
                    candidates: {
                        $push: {
                            id: '$_id',
                            name: '$name',
                            party: '$party',
                            votes: '$votes',
                            imageUrl: '$imageUrl'
                        }
                    },
                    totalVotes: { $sum: '$votes' }
                }
            },
            {
                $project: {
                    position: '$_id',
                    candidates: {
                        $map: {
                            input: '$candidates',
                            as: 'candidate',
                            in: {
                                $mergeObjects: [
                                    '$$candidate',
                                    {
                                        percentage: {
                                            $multiply: [
                                                { $divide: ['$$candidate.votes', '$totalVotes'] },
                                                100
                                            ]
                                        }
                                    }
                                ]
                            }
                        }
                    },
                    totalVotes: 1,
                    _id: 0
                }
            },
            {
                $sort: {
                    position: 1,
                    'candidates.votes': -1
                }
            }
        ]);

        res.json({
            success: true,
            data: results
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching results',
            error: error.message
        });
    }
});

module.exports = router; 