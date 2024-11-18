const express = require('express');
const router = express.Router();
const dataService = require('./dataService');

router.post('/save-results', async (req, res) => {
    try {
        const participantData = req.body;
        const result = await dataService.saveParticipantData(participantData);
        res.json({ success: true, id: result });
    } catch (error) {
        console.error('Error saving results:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;