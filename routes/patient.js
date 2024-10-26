const express = require('express');
const router = express.Router();
const db = require('../database'); // Adjust to match your database connection file

// Route to get the medical history for a logged-in patient
router.get('/medical-history', (req, res) => {
    const patientId = req.user.id; // Assuming you have middleware that sets `req.user`

    const query = `
        SELECT date, doctor_name, specialty, treatment
        FROM medical_history
        WHERE patient_id = ? 
        ORDER BY date DESC;
    `;

    db.query(query, [patientId], (error, results) => {
        if (error) {
            console.error('Error fetching medical history:', error);
            return res.status(500).json({ success: false, message: 'Database query error' });
        }
        res.json({ success: true, history: results });
    });
});

module.exports = router;
