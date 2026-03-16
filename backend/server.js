/**
 * ZION LOPES PORTFOLIO — Backend Server
 * ──────────────────────────────────────
 * • Serves all static frontend files
 * • POST /api/contact  — receives contact form, sends email via Nodemailer
 * • Rate-limiting, Helmet security headers, CORS
 *
 * Run:
 *   npm install
 *   cp .env.example .env  (fill in your email credentials)
 *   npm run dev           (development with hot-reload)
 *   npm start             (production)
 */

'use strict';

require('dotenv').config();

const express    = require('express');
const path       = require('path');
const helmet     = require('helmet');
const cors       = require('cors');
const rateLimit  = require('express-rate-limit');
const nodemailer = require('nodemailer');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── SECURITY HEADERS ──────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com',
                   'https://www.gstatic.com', 'https://api.fontshare.com'],
      styleSrc:   ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com',
                   'https://api.fontshare.com'],
      fontSrc:    ["'self'", 'https://fonts.gstatic.com', 'https://api.fontshare.com'],
      imgSrc:     ["'self'", 'data:', 'https://placehold.co'],
      connectSrc: ["'self'", 'https://firebaseapp.com', 'https://*.googleapis.com',
                   'https://*.firebaseio.com'],
    }
  }
}));

// ── CORS ──────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
  'http://localhost:5500',   // Live Server (VS Code)
  'http://127.0.0.1:5500',
  'http://localhost:3000',
];

app.use(cors({
  origin: (origin, cb) => {
    // allow requests with no origin (e.g., curl, mobile apps)
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS blocked: ${origin}`));
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

// ── BODY PARSING ─────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── STATIC FILES ─────────────────────────────────────────
// The backend/server.js lives inside the /backend folder.
// The actual front-end root is one level up.
const STATIC_ROOT = path.join(__dirname, '..'); // → /portfolio/
app.use(express.static(STATIC_ROOT, {
  extensions: ['html'],
  index: 'index.html'
}));

// ── RATE LIMITING ─────────────────────────────────────────
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,                    // 5 requests per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Too many requests — please wait 15 minutes before trying again.' }
});

// ── EMAIL TRANSPORTER ─────────────────────────────────────
let transporter;

function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host:   process.env.MAIL_HOST || 'smtp.gmail.com',
    port:   parseInt(process.env.MAIL_PORT) || 587,
    secure: parseInt(process.env.MAIL_PORT) === 465,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });
  return transporter;
}

// ── HELPERS ───────────────────────────────────────────────
function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildEmailHtml({ name, email, subject, message }) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#f5f5f5; margin:0; padding:2rem; }
    .card { background:#fff; max-width:560px; margin:0 auto; border-radius:8px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,.08); }
    .header { background:#0b0b0b; padding:2rem; }
    .header h2 { color:#c9f53b; font-size:1.25rem; margin:0; letter-spacing:0.08em; font-family:monospace; }
    .body { padding:2rem; }
    .row { margin-bottom:1.25rem; }
    .label { font-size:0.72rem; font-family:monospace; letter-spacing:0.1em; text-transform:uppercase; color:#888; margin-bottom:0.3rem; }
    .value { font-size:0.97rem; color:#1a1a1a; line-height:1.6; }
    .msg   { background:#f9f9f9; padding:1.25rem; border-left:3px solid #c9f53b; white-space:pre-wrap; }
    .footer { padding:1rem 2rem; border-top:1px solid #eee; font-size:0.75rem; color:#aaa; text-align:center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header"><h2>NEW MESSAGE / ZION.PORTFOLIO</h2></div>
    <div class="body">
      <div class="row">
        <div class="label">From</div>
        <div class="value">${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</div>
      </div>
      <div class="row">
        <div class="label">Subject</div>
        <div class="value">${escapeHtml(subject)}</div>
      </div>
      <div class="row">
        <div class="label">Message</div>
        <div class="value msg">${escapeHtml(message)}</div>
      </div>
    </div>
    <div class="footer">Sent via zionlopes.portfolio contact form · ${new Date().toUTCString()}</div>
  </div>
</body>
</html>`;
}

function buildAutoReplyHtml(name) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; background:#f5f5f5; margin:0; padding:2rem; }
    .card { background:#0b0b0b; max-width:560px; margin:0 auto; border-radius:8px; overflow:hidden; }
    .top  { padding:2.5rem 2rem; border-bottom:1px solid #1e1e1e; }
    .top h2 { font-family:monospace; letter-spacing:0.1em; font-size:2rem; color:#f0ece4; margin:0 0 0.75rem; }
    .top h2 span { color:#c9f53b; }
    .top p { color:#888; font-size:0.95rem; line-height:1.7; margin:0; }
    .body { padding:2rem; }
    .body p { color:#888; font-size:0.9rem; line-height:1.8; margin:0 0 1rem; }
    .body a { color:#c9f53b; text-decoration:none; }
    .footer { padding:1rem 2rem; border-top:1px solid #1e1e1e; font-size:0.72rem; color:#444; font-family:monospace; letter-spacing:0.06em; }
  </style>
</head>
<body>
  <div class="card">
    <div class="top">
      <h2>HEY, <span>${escapeHtml(name).toUpperCase()}.</span></h2>
      <p>Thanks for reaching out — I've received your message and will get back to you within 24 hours.</p>
    </div>
    <div class="body">
      <p>In the meantime, feel free to check out my work:</p>
      <p>
        → <a href="https://github.com/ZionLopes">GitHub</a><br>
        → <a href="https://healthcare-chatbot-ivory.vercel.app/">Healthcare Chatbot</a><br>
        → <a href="https://zionlopes.github.io/gym-website/index.html">Gym Management System</a>
      </p>
      <p style="margin-top:1.5rem;color:#555;">— Zion Lopes</p>
    </div>
    <div class="footer">© 2025 ZION LOPES · MUMBAI, INDIA</div>
  </div>
</body>
</html>`;
}

// ── VALIDATION ────────────────────────────────────────────
function validateContact({ name, email, message }) {
  const errors = [];
  if (!name    || name.trim().length < 2)    errors.push('Name must be at least 2 characters.');
  if (!email   || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Valid email is required.');
  if (!message || message.trim().length < 10) errors.push('Message must be at least 10 characters.');
  return errors;
}

// ── ROUTES ────────────────────────────────────────────────

/**
 * POST /api/contact
 * Body: { name, email, subject?, message }
 * Sends an email to CONTACT_RECEIVER and an auto-reply to the sender.
 */
app.post('/api/contact', contactLimiter, async (req, res) => {
  const { name = '', email = '', subject = '', message = '' } = req.body;

  // Validate
  const errors = validateContact({ name, email, message });
  if (errors.length) {
    return res.status(422).json({ ok: false, error: errors.join(' ') });
  }

  // Check mail config
  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
    console.warn('[contact] Email credentials not set — skipping email send.');
    // Still return success so you can test the form without mail config
    return res.json({ ok: true, message: 'Message received (email not configured).' });
  }

  try {
    const t = getTransporter();

    // 1. Notification to Zion
    await t.sendMail({
      from:    `"${process.env.MAIL_FROM_NAME || 'Zion Portfolio'}" <${process.env.MAIL_USER}>`,
      to:      process.env.CONTACT_RECEIVER || process.env.MAIL_USER,
      replyTo: email,
      subject: `[Portfolio] ${subject || 'New Message'} — from ${name}`,
      html:    buildEmailHtml({ name, email, subject, message }),
    });

    // 2. Auto-reply to sender
    await t.sendMail({
      from:    `"Zion Lopes" <${process.env.MAIL_USER}>`,
      to:      email,
      subject: `Got your message, ${name}! ✓`,
      html:    buildAutoReplyHtml(name),
    });

    console.log(`[contact] Email sent → ${email} at ${new Date().toISOString()}`);
    res.json({ ok: true, message: 'Message sent successfully.' });

  } catch (err) {
    console.error('[contact] Mail error:', err.message);
    res.status(500).json({ ok: false, error: 'Failed to send email. Please try again later.' });
  }
});

// ── HEALTH CHECK ──────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    ok:   true,
    time: new Date().toISOString(),
    env:  process.env.NODE_ENV || 'development'
  });
});

// ── SPA FALLBACK ──────────────────────────────────────────
// Serve index.html for any unknown routes so deep links work
app.get('*', (_req, res) => {
  res.sendFile(path.join(STATIC_ROOT, 'index.html'));
});

// ── ERROR HANDLER ─────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[server]', err.message);
  res.status(500).json({ ok: false, error: 'Internal server error.' });
});

// ── START ─────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════╗
║  ZION LOPES — Portfolio Server     ║
║  http://localhost:${PORT}             ║
║  ENV: ${(process.env.NODE_ENV || 'development').padEnd(28)}║
╚════════════════════════════════════╝
  `.trim());
});

module.exports = app;
