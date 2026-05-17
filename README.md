# Maloney Signup

This project is a signup page that uses Supabase for GitHub Pages and local development.

## GitHub Pages deployment

1. Update `script.js` with your Supabase public values:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
2. Configure your Supabase project so the `subscribers` table allows anonymous `INSERT` and `UPDATE` for the public role.
3. Deploy the site to GitHub Pages by publishing the repository's `main` branch or `gh-pages` branch.

On GitHub Pages, the site sends a magic link through Supabase Auth and stores signup records in the `subscribers` table.

## Local development

1. Copy `.env.example` to `.env`.
2. Fill in `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
3. Optionally fill in SMTP settings, or leave blank to use Ethereal email testing.
4. Run `npm install`.
5. Start the app:
   ```powershell
   npm start
   ```
6. Open `http://localhost:3000`.

## How it works

- Local host uses the backend route `/signup` if available.
- If the backend is unavailable, the page falls back to static GitHub Pages mode.
- In static mode, Supabase sends a passwordless magic-link email and records the subscriber.
- The `verify.html` page confirms email verification when the magic link is opened.
