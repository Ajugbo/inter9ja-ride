# Inter9ja Ride — Render-ready Starter (ZIP)

This archive contains a minimal full-stack starter for a ride-sharing MVP focused on Nigeria.
It is preconfigured for deployment on Render (frontend + backend + Postgres starter).

## Contents
- frontend/ (React CRA style)
- backend/ (Express + Postgres + Paystack webhook support)
- render.yaml (Render deployment config)
- README_RENDER.md (deployment steps)
- sql/schema.sql (database schema)
- backend/seed.js (seed script creates admin user)

## Chromebook instructions (open the ZIP)
1. Download the ZIP and open the **Files** app on your Chromebook.
2. Right-click the ZIP and choose **Extract all** (or double-click and extract).
3. You will have a folder named `inter9ja-ride/` ready to upload to GitHub.

## Quick local test (with Docker-compose - optional)
The project is designed for Render. For a local test you can create a Postgres and run backend locally by setting DATABASE_URL accordingly.

## Next steps
1. Create a new GitHub repo (empty) and upload the extracted folder contents (or push via git).
2. In Render, import the repo. Render will detect `render.yaml` and provision services.
3. Set environment variables (backend service):
   - PAYSTACK_SECRET_KEY (test key placeholder included)
   - JWT_SECRET (set to a secure random string)
4. Run `npm run seed` on the backend (Render shell) to seed the DB (creates admin account).
