<div align="center">
  <img width="1200" height="475" alt="ICCT CCS" src="https://github.com/user-attachments/assets/3c792512-cd07-4ec3-86b5-2ecf86190074" />
</div>

<h1 align="center">A Web-Based Columbarium Information System
Interactive Mapping & Digital Records Management<br>
for Maria Della Strada Church
</h1>

<p align="center">
  <img src="https://img.shields.io/badge/status-active-success" />
  <img src="https://img.shields.io/badge/platform-web-blue" />
  <img src="https://img.shields.io/badge/node.js-required-green" />
</p>

---

 📖 Overview
This system is designed to efficiently manage columbarium records for Maria Della Strada Church.  
It provides a **digital and centralized solution** for handling memorial data, combined with an **interactive mapping feature** that allows users to easily locate niches.

---

 ✨ Features
<table>
<tr>
<td>📍 Interactive Mapping</td>
<td>Locate columbarium niches easily</td>
</tr>
<tr>
<td>🗂️ Records Management</td>
<td>Store and manage memorial data digitally</td>
</tr>
<tr>
<td>🔍 Search System</td>
<td>Quickly retrieve client information</td>
</tr>
<tr>
<td>💻 User-Friendly UI</td>
<td>Simple and easy-to-use interface</td>
</tr>
<tr>
<td>🗄️ Centralized Storage</td>
<td>All records in one secure system</td>
</tr>
</table>

---
👨‍💻 Researchers
<div align="center">

Aeron John Sales • Romulo Sabado • Denzel Cedric Datiles
Joshua Edmyr Galope • John Leo Mores • Renz Traquina
Michael Vincent Bartolo • Jhanil DC Conge
Roi Kenjie Baylon • Maynard Balanza

</div>
🏫 Institution
<div align="center">

ICCT Colleges Foundation Inc. – Cainta Campus, Philippines
Bachelor of Science in Information Technology (BSIT)

Professor: Mr. Jericho Vilog

</div>

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

