const crypto = require('crypto');
const express = require('express');
const nodemailer = require('nodemailer');
const path = require('path');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const baseUrl = process.env.BASE_URL || `http://localhost:${port}`;
const smtpHost = process.env.SMTP_HOST;
const smtpPort = parseInt(process.env.SMTP_PORT, 10) || 587;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
let fromEmail = process.env.FROM_EMAIL || smtpUser;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = supabaseUrl && supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, { auth: { persistSession: false } })
  : null;

const verificationTokens = new Map();
const tokenTTL = 15 * 60 * 1000; // 15 minutes

function generateVerificationToken() {
  return crypto.randomBytes(24).toString('hex');
}

function cleanupExpiredTokens() {
  const now = Date.now();
  for (const [token, { createdAt }] of verificationTokens.entries()) {
    if (now - createdAt > tokenTTL) {
      verificationTokens.delete(token);
    }
  }
}

setInterval(cleanupExpiredTokens, 60 * 1000);

if (!smtpHost || !smtpUser || !smtpPass) {
  console.warn('Warning: SMTP credentials are missing. Set SMTP_HOST, SMTP_USER, and SMTP_PASS in .env.');
}

let transporter;
let usingEthereal = false;

app.use(express.json());
app.use(express.static(path.join(__dirname), { dotfiles: 'ignore' }));

function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  const cleaned = email.trim();
  if (cleaned.length < 5) return false;
  if (cleaned !== email) return false;
  if (cleaned.includes(' ')) return false;
  const atIndex = cleaned.indexOf('@');
  if (atIndex <= 0) return false;
  const dotIndex = cleaned.lastIndexOf('.');
  return dotIndex > atIndex + 1 && dotIndex < cleaned.length - 1;
}

async function storeSubscriber(email) {
  if (!supabase) {
    console.warn('Supabase is not configured. Subscriber data will not be saved.');
    return;
  }

  const { error } = await supabase
    .from('subscibers')
    .upsert({ email, signed_up_at: new Date().toISOString() }, { onConflict: ['email'] });

  if (error) {
    console.error('Supabase insert error:', error.message || error);
    throw new Error('Failed to save subscriber data.');
  }
}

async function markSubscriberVerified(email) {
  if (!supabase) {
    return;
  }

  const { error } = await supabase
    .from('subscibers')
    .update({ verified: true, verified_at: new Date().toISOString() })
    .eq('email', email);

  if (error) {
    console.error('Supabase update error:', error.message || error);
  }
}

app.post('/signup', async (req, res) => {
  const { email } = req.body;

  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }

  try {
    await storeSubscriber(email);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to save subscriber data.' });
  }

  const token = generateVerificationToken();
  verificationTokens.set(token, {
    email,
    createdAt: Date.now()
  });

  const verifyUrl = `${baseUrl}/verify?token=${token}`;
  const mailOptions = {
    from: fromEmail,
    to: email,
    subject: 'Verify your signup',
    text: `Hi there,\\n\\nPlease click the link below to complete your signup:\\n\\n${verifyUrl}\\n\\nThanks!`,
    html: `<p>Hi there,</p><p>Please click the link below to complete your signup:</p><p><a href="${verifyUrl}">Verify your email</a></p><p>Thanks!</p>`
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    const result = { message: 'Verification email sent.' };
    if (usingEthereal) {
      const preview = nodemailer.getTestMessageUrl(info);
      console.log('Ethereal preview URL:', preview);
      result.preview = preview;
    }
    res.json(result);
  } catch (error) {
    console.error('Email send failed:', error);
    res.status(500).json({ error: 'Failed to send verification email.' });
  }
});

app.get('/verify', async (req, res) => {
  const { token } = req.query;

  if (!token || typeof token !== 'string') {
    return res.status(400).send('<h1>Verification failed</h1><p>Invalid verification link.</p>');
  }

  const stored = verificationTokens.get(token);
  if (!stored) {
    return res.status(400).send('<h1>Verification failed</h1><p>Invalid or expired verification link.</p>');
  }

  verificationTokens.delete(token);
  await markSubscriberVerified(stored.email);

  res.send(`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Verified</title><link rel="stylesheet" href="/style.css"></head><body><div class="card"><div class="banner"><span class="banner-text">WELCOME</span><span class="banner-text">VERIFIED</span></div><span class="card__title">Email verified</span><p class="card__subtitle">Thank you, your email has been verified.</p></div></body></html>`);
});

async function init() {
  if (!smtpHost || !smtpUser || !smtpPass) {
    console.log('SMTP credentials not found — creating Ethereal test account');
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      usingEthereal = true;
      if (!fromEmail) {
        fromEmail = testAccount.user;
      }
      console.log('Ethereal account created. Preview messages will be available in the console after sending.');
    } catch (err) {
      console.error('Failed to create Ethereal account:', err);
      process.exit(1);
    }
  } else {
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });
  }

  app.listen(port, () => {
    console.log(`Server running at ${baseUrl}`);
  });
}

init();
