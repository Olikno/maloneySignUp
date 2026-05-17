/*
  EmailJS setup for GitHub Pages

  1. Create an EmailJS service and template.
  2. Use these template fields:
       - to_email
       - verify_link
       - email_subject
       - email_message
  3. In EmailJS template editor, set:
       Subject: {{email_subject}}
       Body: Hello,\nPlease verify your email by clicking the link below:\n<a href="{{verify_link}}">Verify email</a>\n{{email_message}}
  4. Update SERVICE_ID, TEMPLATE_ID, PUBLIC_KEY below.
*/

const form = document.getElementById('signup-form');
const emailInput = document.getElementById('email-input');

const EMAILJS_SERVICE_ID = 'service_5ng0aje';
const EMAILJS_TEMPLATE_ID = 'template_szk649f';
const EMAILJS_PUBLIC_KEY = 'j5GNOxiL0-FwXKu4t';
const TOKEN_EXPIRY_SECONDS = 60 * 15; // 15 minutes

function validateEmail(value) {
  if (typeof value !== 'string') return false;
  const cleaned = value.trim();
  if (cleaned.length < 5) return false;
  if (cleaned !== value) return false;
  if (cleaned.includes(' ')) return false;
  const atIndex = cleaned.indexOf('@');
  if (atIndex <= 0) return false;
  const dotIndex = cleaned.lastIndexOf('.');
  return dotIndex > atIndex + 1 && dotIndex < cleaned.length - 1;
}

function createVerificationToken(email) {
  const payload = JSON.stringify({ email, createdAt: Date.now() });
  return encodeURIComponent(btoa(unescape(encodeURIComponent(payload))));
}

function getVerifyUrl(email, token) {
  return new URL(`verify.html?token=${token}`, window.location.href).href;
}

function showError(message) {
  const errorEl = document.getElementById('error-msg');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.classList.add('show');
  } else {
    alert(message);
  }
}

function clearError() {
  const errorEl = document.getElementById('error-msg');
  if (errorEl) {
    errorEl.textContent = '';
    errorEl.classList.remove('show');
  }
}

async function submitSignup(event) {
  event.preventDefault();
  const email = emailInput.value.trim();

  if (!validateEmail(email)) {
    showError('Please enter a valid email address.');
    emailInput.classList.add('invalid');
    emailInput.focus();
    return;
  }

  clearError();
  emailInput.classList.remove('invalid');

  if (EMAILJS_SERVICE_ID === 'YOUR_SERVICE_ID') {
    showError('EmailJS is not configured yet. Please update script.js with your EmailJS service, template, and public key.');
    return;
  }

  try {
    emailjs.init(EMAILJS_PUBLIC_KEY);
    const token = createVerificationToken(email);
    const verifyUrl = getVerifyUrl(email, token);
    const templateParams = {
      to_email: email,
      verify_link: verifyUrl,
      email_subject: 'Verify your signup',
      email_message: `Click the link to verify your email: ${verifyUrl}`
    };

    const result = await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams);
    window.location.href = `check-email.html?email=${encodeURIComponent(email)}`;
  } catch (err) {
    console.error(err);
    showError('Unable to send verification email. Please try again later.');
  }
}

if (form && emailInput) {
  form.addEventListener('submit', submitSignup);
}
