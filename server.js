const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');
const { exec } = require('child_process');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ✅ Route first
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

// ✅ Static middleware second
app.use(express.static(path.join(__dirname, 'public')));


// PostgreSQL connection setup
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'ams',
  password: 'ssk1',
  port: 5432,
});

// Registration
app.post('/register', async (req, res) => {
  const { name, email, password, role, flat_number } = req.body;
  try {
    await pool.query(
      'INSERT INTO users (name, email, password, role, flat_number) VALUES ($1, $2, $3, $4, $5)',
      [name, email, password, role, flat_number]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Registration error:', err.message);
    res.json({ success: false, message: 'Registration failed. Check server logs.' });
  }
});

// Login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND password = $2',
      [email, password]
    );
    if (result.rows.length > 0) {
      res.json({ success: true, user: result.rows[0] });
    } else {
      res.json({ success: false, message: 'Invalid email or password' });
    }
  } catch (err) {
    console.error('Login error:', err.message);
    res.json({ success: false, message: 'Server error during login' });
  }
});

// Submit Complaint
app.post('/submit-complaint', async (req, res) => {
  const { user_id, complaint_text } = req.body;
  try {
    const user = await pool.query('SELECT flat_number, role FROM users WHERE user_id = $1', [user_id]);
    if (user.rows.length === 0) return res.status(404).send('User not found');

    const { flat_number, role } = user.rows[0];
    const allowedRoles = ['owner', 'tenant'];
    if (!allowedRoles.includes(role.toLowerCase())) return res.status(403).send('Not authorized');

    await pool.query(
      'INSERT INTO complaints (user_id, complaint_text, date, flat_number) VALUES ($1, $2, CURRENT_DATE, $3)',
      [user_id, complaint_text, flat_number]
    );
    res.status(200).send('Complaint submitted');
  } catch (err) {
    console.error('Complaint submission error:', err.message);
    res.status(500).send('Error submitting complaint');
  }
});

// View Complaints
app.post('/view-complaints', async (req, res) => {
  const { user_id } = req.body;
  try {
    const user = await pool.query('SELECT role FROM users WHERE user_id = $1', [user_id]);
    if (user.rows[0].role.toLowerCase() !== 'secretary') return res.status(403).send('Not authorized');

    const result = await pool.query(
      'SELECT u.flat_number, c.complaint_text, c.date FROM complaints c JOIN users u ON c.user_id = u.user_id'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('View complaints error:', err.message);
    res.status(500).send('Error retrieving complaints');
  }
});

// Clear Complaints
app.delete('/clear-complaints', async (req, res) => {
  const { user_id } = req.body;
  try {
    const user = await pool.query('SELECT role FROM users WHERE user_id = $1', [user_id]);
    if (user.rows[0].role.toLowerCase() !== 'secretary') return res.status(403).send('Not authorized');

    await pool.query('DELETE FROM complaints');
    res.status(200).send('All complaints cleared');
  } catch (err) {
    console.error('Error clearing complaints:', err.message);
    res.status(500).send('Error clearing complaints');
  }
});

// // Add Facility
// app.post('/add-facility', async (req, res) => {
//   const { facility_name, description } = req.body;
//   try {
//     await pool.query('INSERT INTO facilities (facility_name, description) VALUES ($1, $2)', [facility_name, description]);
//     res.status(200).send('Facility added');
//   } catch (err) {
//     console.error('Add facility error:', err.message);
//     res.status(500).send('Error adding facility');
//   }
// });

// // Get Facilities
// app.get('/facilities', async (req, res) => {
//   try {
//     const result = await pool.query('SELECT * FROM facilities');
//     res.json(result.rows);
//   } catch (err) {
//     console.error('Facilities fetch error:', err.message);
//     res.status(500).send('Error retrieving facilities');
//   }
// });

// Book Hall
app.post('/book-hall', async (req, res) => {
  const { user_id, flat_number, hall_name, booking_date, time_slot, purpose } = req.body;
  try {
    const conflict = await pool.query('SELECT * FROM hall_booking WHERE hall_name = $1 AND booking_date = $2 AND time_slot = $3', [hall_name, booking_date, time_slot]);
    if (conflict.rows.length > 0) return res.status(400).send('Hall already booked');

    await pool.query('INSERT INTO hall_booking (user_id, flat_number, booking_date, purpose, time_slot, hall_name) VALUES ($1, $2, $3, $4, $5, $6)', [user_id, flat_number, booking_date, purpose, time_slot, hall_name]);
    res.status(200).send('Hall booked successfully');
  } catch (err) {
    console.error('Hall booking error:', err.message);
    res.status(500).send('Error booking hall');
  }
});

// Start server and auto-open browser
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  exec(`start http://localhost:${port}`); // Only works on Windows
});



// ====================== SECURITY - VISITOR ENTRY ======================
app.post('/add-visitor', async (req, res) => {
  const { name, purpose, flat_number } = req.body;

  try {
    await pool.query(
      'INSERT INTO visitor_log (name, purpose, flat_number) VALUES ($1, $2, $3)',
      [name, purpose, flat_number]
    );
    res.status(200).send('✅ Visitor entry recorded successfully!');
  } catch (err) {
    console.error('❌ Visitor entry error:', err.message);
    res.status(500).send('❌ Error recording visitor');
  }
});


// ========================= VISITOR ENTRY GET (Tenants/Owners View) =============================
app.get('/get-visitors', async (req, res) => {
  const { flat } = req.query;

  if (!flat) {
    return res.status(400).send('❌ Flat number is required');
  }

  try {
    const result = await pool.query(
      'SELECT name, purpose, timestamp FROM visitor_log WHERE flat_number = $1 ORDER BY timestamp DESC',
      [flat]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching visitors:', err.message);
    res.status(500).send('❌ Error loading visitors');
  }
});

// ========================= SECURITY VISITOR ENTRY =============================
app.post('/submit-visitor', async (req, res) => {
  const { name, purpose, flat_number } = req.body;

  if (!name || !purpose || !flat_number) {
    return res.status(400).send('❌ All fields are required');
  }

  try {
    await pool.query(
      'INSERT INTO visitor_log (name, purpose, flat_number, timestamp) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)',
      [name, purpose, flat_number]
    );
    res.status(200).send('✅ Visitor entry submitted successfully!');
  } catch (err) {
    console.error('❌ Visitor entry error:', err.message);
    res.status(500).send('❌ Failed to store visitor entry.');
  }
});


// ========================= NOTIFICATIONS =============================
// Event posting by secretary
app.post('/send-event', async (req, res) => {
  const { description } = req.body;
  try {
    await pool.query(
      'INSERT INTO events (description) VALUES ($1)',
      [description]
    );
    res.status(200).send('✅ Notification/Event saved and broadcasted!');
  } catch (err) {
    console.error('❌ Error saving event:', err.message);
    res.status(500).send('❌ Failed to send event');
  }
});


app.get('/get-events', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM events ORDER BY event_id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching events:', err.message);
    res.status(500).send('❌ Failed to load events');
  }
});

// ========================= SALOON BOOKINGS =============================
app.post('/book-saloon', async (req, res) => {
  const { user_id, flat_number, service, booking_time } = req.body;

  try {
    await pool.query(
      'INSERT INTO saloon_bookings (user_id, flat_number, service, booking_time) VALUES ($1, $2, $3, $4)',
      [user_id, flat_number, service, booking_time]
    );
    res.status(200).send('✅ Saloon appointment booked successfully!');
  } catch (err) {
    console.error('Saloon booking error:', err.message);
    res.status(500).send('❌ Error booking saloon.');
  }
});

app.listen(port, () => {
  console.log(`🌐 Server running at http://localhost:${port}`);
});



