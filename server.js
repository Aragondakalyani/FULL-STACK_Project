const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve frontend
app.use(express.static(path.join(__dirname, 'public')));

// PostgreSQL connection
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'apartment_db',
  password: '1234',
  port: 5432,
});


// ================= REGISTER =================
app.post('/register', async (req, res) => {
  const { name, email, password, role, flat_number } = req.body;

  try {
    if (!name || !email || !password || !role) {
      return res.json({ success: false, message: "Missing required fields" });
    }

    await pool.query(
      `INSERT INTO users (name, email, password, role, flat_number)
       VALUES ($1, $2, $3, $4, $5)`,
      [name, email, password, role.toLowerCase(), flat_number || null]
    );

    res.json({ success: true });

  } catch (err) {
    if (err.code === '23505') {
      res.json({ success: false, message: "Email already exists" });
    } else {
      res.json({ success: false, message: err.message });
    }
  }
});


// ================= LOGIN =================
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email=$1 AND password=$2',
      [email, password]
    );

    if (result.rows.length > 0) {
      res.json({ success: true, user: result.rows[0] });
    } else {
      res.json({ success: false, message: "Invalid credentials" });
    }

  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});


// ================= PAY MAINTENANCE =================
app.post('/pay-maintenance', async (req, res) => {
  const { user_id, amount } = req.body;

  try {
    await pool.query(
      `INSERT INTO maintenance_payments (user_id, amount, payment_date)
       VALUES ($1, $2, CURRENT_DATE)`,
      [user_id, amount]
    );

    res.send("✅ Payment successful");

  } catch (err) {
    res.status(500).send(err.message);
  }
});


// ================= SUBMIT COMPLAINT =================
app.post('/submit-complaint', async (req, res) => {
  const { user_id, complaint_text } = req.body;

  try {
    await pool.query(
      `INSERT INTO complaints (user_id, complaint_text)
       VALUES ($1, $2)`,
      [user_id, complaint_text]
    );

    res.send("✅ Complaint submitted");

  } catch (err) {
    res.status(500).send(err.message);
  }
});


// ================= GET COMPLAINTS =================
app.get('/get-complaints', async (req, res) => {
  const result = await pool.query(`
    SELECT c.id, c.complaint_text, u.name, u.flat_number
    FROM complaints c
    JOIN users u ON c.user_id = u.id
    ORDER BY c.id DESC
  `);

  res.json(result.rows);
});


// ================= CLEAR COMPLAINTS =================
app.delete('/clear-complaints', async (req, res) => {
  await pool.query('DELETE FROM complaints');
  res.send("All complaints cleared");
});


// ================= EVENTS =================
app.post('/add-event', async (req, res) => {
  const { title, description, event_date } = req.body;

  await pool.query(
    `INSERT INTO events (title, description, event_date)
     VALUES ($1, $2, $3)`,
    [title, description, event_date]
  );

  res.send("Event added");
});

app.get('/events', async (req, res) => {
  const result = await pool.query("SELECT * FROM events ORDER BY event_date");
  res.json(result.rows);
});


// ================= NOTIFICATIONS =================
app.post('/add-notification', async (req, res) => {
  const { message } = req.body;

  await pool.query(
    `INSERT INTO notifications (message)
     VALUES ($1)`,
    [message]
  );

  res.send("Notification added");
});

app.get('/notifications', async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM notifications ORDER BY id DESC"
  );
  res.json(result.rows);
});

app.delete('/clear-notifications', async (req, res) => {
  await pool.query("DELETE FROM notifications");
  res.send("Notifications cleared");
});
// ================= GET VISITORS =================
app.get('/visitors', async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM visitors ORDER BY entry_time DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching visitors");
  }
});

// ================= START SERVER =================
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});