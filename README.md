# Maloney Signup Page

This repository contains a static signup flow designed for GitHub Pages. It uses EmailJS to send real verification emails from a client-side form.

## EmailJS setup

1. Create an EmailJS account at https://www.emailjs.com.
2. Add an email service (Gmail, Outlook, etc.).
3. Create a new email template and include these fields:
   - `to_email`
   - `verify_link`
   - `email_subject`
   - `email_message`

### Example template mapping

- Subject: `{{email_subject}}`
- Body:
  ```html
  Hello,

  Please verify your email by clicking the link below:
  <a href="{{verify_link}}">Verify email</a>

  {{email_message}}
  ```

## Update the site configuration

Open `script.js` and replace the placeholder values with your EmailJS details:

- `EMAILJS_SERVICE_ID`
- `EMAILJS_TEMPLATE_ID`
- `EMAILJS_PUBLIC_KEY`

## How it works

- The user submits their email on `index.html`.
- `script.js` generates a short-lived verification token.
- EmailJS sends the verification email containing `verify.html?token=...`.
- `verify.html` validates the token client-side and shows the result.

## GitHub Pages deployment

1. Push the `websites/maloney` folder to your repository.
2. In GitHub repository settings, enable Pages and select the branch/folder that contains `websites/maloney`.
3. The site will be served as a static page, with no server required.

## Notes

- This is a static-only implementation, so verification happens entirely in the browser.
- The token expires after 15 minutes.
- If you want stronger verification, you can later replace EmailJS with a lightweight backend API.
