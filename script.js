

const form = document.getElementById('signup-form');
const emailInput = document.getElementById('email-input');

// For later GitHub Pages deployment, configure these values with your public Supabase project URL and anon key.
const SUPABASE_URL = 'https://bzcyefocafeiebezobpi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6Y3llZm9jYWZlaWViZXpvYnBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwNDEyNDMsImV4cCI6MjA5NDYxNzI0M30.loITdVw-I9vsEmiDLx1YYJny4ZO5OGM_tGbQ0MB51BU';
const IS_LOCALHOST = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const USE_STATIC_SUPABASE_FALLBACK = !IS_LOCALHOST;

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

async function fallbackSignup(email) {
  if (!window.supabase) {
    throw new Error('Supabase client is not loaded.');
  }
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase fallback is not configured. Update SUPABASE_URL and SUPABASE_ANON_KEY in script.js.');
  }

  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { error: authError } = await client.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/verify.html`
    }
  });

  if (authError) {
    throw new Error(authError.message || 'Failed to send verification email.');
  }

  const tableNames = ['subscibers', 'subscribers'];
  let lastError = null;

  for (const tableName of tableNames) {
    const { error: insertError } = await client.from(tableName).upsert(
      {
        email,
        signed_up_at: new Date().toISOString(),
        verified: false
      },
      { onConflict: ['email'] }
    );

    if (!insertError) {
      return;
    }

    lastError = insertError;
    const missingMessage = `Could not find the table 'public.${tableName}'`;
    if (insertError.message && insertError.message.includes(missingMessage)) {
      console.warn(`Supabase table ${tableName} not found; trying fallback table name.`);
      continue;
    }

    throw new Error(insertError.message || 'Failed to save subscriber via Supabase.');
  }

  if (lastError) {
    throw new Error(lastError.message || 'Failed to save subscriber via Supabase.');
  }
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

  try {
    const response = await fetch('/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });

    if (response.ok) {
      window.location.href = `check-email.html?email=${encodeURIComponent(email)}`;
      return;
    }

    const json = await response.json().catch(() => ({}));
    const backendError = new Error(json.error || 'Signup failed.');
    if (response.status === 404 || response.status === 0) {
      throw backendError;
    }

    throw backendError;
  } catch (err) {
    const shouldFallback = USE_STATIC_SUPABASE_FALLBACK || err.name === 'TypeError' || err.message.includes('Failed to fetch');
    if (shouldFallback) {
      try {
        await fallbackSignup(email);
        window.location.href = `check-email.html?email=${encodeURIComponent(email)}`;
        return;
      } catch (fallbackError) {
        console.error('Supabase fallback signup error:', fallbackError);
        showError(fallbackError.message || 'Unable to save signup via Supabase fallback.');
        return;
      }
    }

    console.error('Signup error:', err);
    showError(err.message || 'Unable to start signup. Please try again later.');
  }
}

if (form && emailInput) {
  form.addEventListener('submit', submitSignup);
}
