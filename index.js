// index.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); // For handling JWT authentication
const connection = require('./config/db'); // Import the database connection
const path = require('path'); // Import path for serving static files
const patientsRoutes = require('./routes/patient'); // Importing patient routes
const app = express();
const port = 3000;

// Middleware to parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Use patient routes
app.use('/patient', patientsRoutes);

// Test the database connection
async function testDatabaseConnection() {
    try {
        await connection.query('SELECT 1');
        console.log('Database connection successful.');
    } catch (err) {
        console.error('Database connection error:', err);
    }
}
testDatabaseConnection();

// Route to register a new patient
app.post('/patients/register', async (req, res) => {
    const { first_name, last_name, email, password, phone, date_of_birth, gender, address } = req.body;

    console.log('Register request received:', req.body);

    try {
        // Check if the email is already registered
        const [rows] = await connection.query('SELECT * FROM patients WHERE email = ?', [email]);
        if (rows.length > 0) {
            return res.status(400).json({ success: false, message: 'Email already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert the patient into the database
        const query = `
            INSERT INTO patients (first_name, last_name, email, password_hash, phone, date_of_birth, gender, address)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

        const [result] = await connection.query(query, [first_name, last_name, email, hashedPassword, phone, date_of_birth, gender, address]);
        console.log('Patient registered successfully with ID:', result.insertId);
        res.status(201).json({ success: true, message: 'Patient registered successfully' });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Route to login a patient
app.post('/patients/login', async (req, res) => {
    const { email, password } = req.body;

    console.log('Login request received:', req.body);

    try {
        // Check if the email exists
        const [rows] = await connection.query('SELECT * FROM patients WHERE email = ?', [email]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Email not found' });
        }

        const user = rows[0];

        // Compare password with the hash
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
            return res.status(401).json({ success: false, message: 'Invalid password' });
        }

        // Generate JWT token
        const token = jwt.sign({ id: user.id }, 'your_jwt_secret', { expiresIn: '1h' });

        res.json({ success: true, message: 'Login successful', user, token });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Route to fetch appointments for a patient
app.get('/patients/:id/appointments', async (req, res) => {
    const patientId = req.params.id;

    try {
        const [appointments] = await connection.query('SELECT * FROM appointments WHERE patient_id = ?', [patientId]);
        res.json({ success: true, appointments });
    } catch (error) {
        console.error('Error fetching appointments:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Route to fetch medical history for a patient
app.get('/patients/:id/medical-history', async (req, res) => {
    const patientId = req.params.id;

    try {
        const [medicalHistory] = await connection.query(
            'SELECT date, doctor_name, specialty, treatment FROM medical_history WHERE patient_id = ?',
            [patientId]
        );

        if (medicalHistory.length === 0) {
            return res.status(404).json({ success: false, message: 'No medical history found for this patient.' });
        }

        res.json({ success: true, medicalHistory });
    } catch (error) {
        console.error('Error fetching medical history:', error);
        res.status(500).json({ success: false, message: 'Error loading medical history' });
    }
});

// Route to fetch list of doctors
app.get('/doctors', async (req, res) => {
    try {
        const [doctors] = await connection.query('SELECT * FROM doctors');
        res.json({ success: true, doctors });
    } catch (error) {
        console.error('Error fetching doctors:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Route to book a new appointment
app.post('/appointments', async (req, res) => {
    console.log('Booking appointment request received:', req.body); // Log the request body
    const { doctorId, date, time, patientId } = req.body;

    try {
        if (!doctorId || !patientId || !date || !time) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        const query = `
            INSERT INTO appointments (doctor_id, patient_id, appointment_date, appointment_time)
            VALUES (?, ?, ?, ?)`;

        await connection.query(query, [doctorId, patientId, date, time]);
        res.status(201).json({ success: true, message: 'Appointment booked successfully' });
    } catch (error) {
        console.error('Error booking appointment:', error); 
        res.status(500).json({ success: false, message: 'Failed to book appointment: ' + (error.sqlMessage || error.message) });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
