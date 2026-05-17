const form = document.getElementById('signup-form');
const emailInput = document.getElementById('email-input');

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

async function submitSignup(event) {
  event.preventDefault();
  const email = emailInput.value.trim();
  const errorEl = document.getElementById('error-msg');

  if (!validateEmail(email)) {
    if (errorEl) {
      errorEl.textContent = 'Please enter a valid email address.';
      errorEl.classList.add('show');
    } else {
      alert('Please enter a valid email address.');
    }
    emailInput.classList.add('invalid');
    emailInput.focus();
    return;
  }

  if (errorEl) {
    errorEl.textContent = '';
    errorEl.classList.remove('show');
  }
  emailInput.classList.remove('invalid');

  try {
    const response = await fetch('/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      alert(error.error || 'Unable to send verification email. Please try again.');
      return;
    }

    window.location.href = `check-email.html?email=${encodeURIComponent(email)}`;
  } catch (err) {
    console.error(err);
    alert('Network error. Please try again later.');
  }
}

if (form && emailInput) {
  form.addEventListener('submit', submitSignup);
}
