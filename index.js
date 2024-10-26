// index.js (main server file)
const express = require('express');
const bcrypt = require('bcrypt');
const connection = require('./config/db'); // Import the database connection
const app = express();
const port = 3000;

// Middleware to parse JSON
app.use(express.json());

// Test the database connection using promises
connection.query('SELECT 1')
    .then(() => {
        console.log('Database connection successful.');
    })
    .catch(err => {
        console.error('Database connection error:', err);
    });

// Route to register a new patient
app.post('/patients/register', async (req, res) => {
    const { first_name, last_name, email, password, phone, date_of_birth, gender, address } = req.body;

    console.log('Register request received:', req.body); // Log the request

    try {
        // Check if the email is already registered
        const [rows] = await connection.query('SELECT * FROM patients WHERE email = ?', [email]);

        if (rows.length > 0) {
            return res.json({ success: false, message: 'Email already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert the patient into the database
        const query = `
            INSERT INTO patients (first_name, last_name, email, password_hash, phone, date_of_birth, gender, address)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

        const [result] = await connection.query(query, [first_name, last_name, email, hashedPassword, phone, date_of_birth, gender, address]);
        
        console.log('Patient registered successfully with ID:', result.insertId); // Log the insert ID
        res.json({ success: true, message: 'Patient registered successfully' });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Route to login a patient
app.post('/patients/login', async (req, res) => {
    const { email, password } = req.body;

    console.log('Login request received:', req.body); // Log the request

    try {
        // Check if the email exists
        const [rows] = await connection.query('SELECT * FROM patients WHERE email = ?', [email]);

        if (rows.length === 0) {
            return res.json({ success: false, message: 'Email not found' });
        }

        const user = rows[0];

        // Compare password with the hash
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
            return res.json({ success: false, message: 'Invalid password' });
        }

        res.json({ success: true, message: 'Login successful', user });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
