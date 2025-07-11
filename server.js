const express = require('express');
const nodemailer = require('nodemailer');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MySQL
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});

db.connect(err => {
  if (err) return console.error("❌ DB connection error:", err);
  console.log("✅ Connected to MySQL");

  const tableQuery = `
    CREATE TABLE IF NOT EXISTS enquiries (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100),
      type VARCHAR(50),
      regno VARCHAR(50),
      phone VARCHAR(15),
      email VARCHAR(100),
      queries TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  db.query(tableQuery, err => {
    if (err) console.error("❌ Table creation failed:", err);
    else console.log("✅ Table is ready.");
  });
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

app.post("/send-email", (req, res) => {
  const { name, type, regno, phone, email, queries } = req.body;

  const insertQuery = `
    INSERT INTO enquiries (name, type, regno, phone, email, queries)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  


  db.query(insertQuery, values, async (err) => {
    if (err) return res.status(500).json({ success: false, error: "DB Error" });

    const adminMail = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_TO,
      subject: `New Enquiry from ${name}`,
      html: `<p><b>Name:</b> ${name}</p><p><b>Type:</b> ${type}</p><p><b>Reg No:</b> ${regno}</p><p><b>Phone:</b> ${phone}</p><p><b>Email:</b> ${email}</p><p><b>Queries:</b> ${queries}</p>`
    };

    const customerMail = {
  from: process.env.EMAIL_USER,
  to: email || process.env.EMAIL_TO, // ✅ fallback if email is empty
  subject: "✅ Amite Invent-ory - Enquiry Received",
  html: `
    <h3>Dear ${name || "Customer"},</h3>
    <p>Thank you for reaching out to <strong>Amite Invent-ory</strong>.</p>
    <p>We’ve received your enquiry and will respond soon.</p>
    <p><strong>Your Query:</strong> ${queries || "N/A"}</p>
    <p>📞 Call us at <strong>+91 9176860553</strong> if urgent.</p>
    <p>Best regards,<br>Team Amite Invent-ory</p>
  `
};

    try {
      await transporter.sendMail(adminMail);
      await transporter.sendMail(customerMail);
      res.json({ success: true });
    } catch (error) {
      console.error("❌ Email error:", error);
      res.status(500).json({ success: false, error: "Email Error" });
    }
  });
});

app.listen(process.env.PORT, () => {
  console.log(`🚀 Server running at http://localhost:${process.env.PORT}`);
});
