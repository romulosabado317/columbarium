<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Maria Della Strada Columbarium

A deployable static frontend for the Columbarium management system with offline demo fallback.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Start the local development server:
   `npm run dev`
3. Open the URL shown in the terminal.

## Build

- Create a production build:
  `npm run build`
- Preview the build locally:
  `npm run preview`

## Deploy to Vercel

1. Connect this repository to Vercel.
2. Set the build command to `npm run build`.
3. Set the output directory to `dist`.
4. Add the database environment variables below if you want real MySQL access:
   - `DB_HOST`
   - `DB_USER`
   - `DB_PASS`
   - `DB_NAME`
   - `DB_PORT` (optional)
5. Deploy.

> The app now includes a Vercel-compatible serverless API handler for the PHP-style `/api/*.php` routes. If database variables are not configured or the database is unreachable, the site continues running in demo fallback mode.

## Local MySQL setup

If you want a real database locally, import `database.sql` into MySQL/MySQLi. The schema now includes `niches`, `records`, `reservations`, and `users` with hashed password support.

### First-time database setup

If your Vercel environment is configured with database variables, you can call `/api/setup_db.php` once to create the schema and seed a default admin user.

