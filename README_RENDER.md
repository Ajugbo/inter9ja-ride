# Deploying to Render (step-by-step)

1. Create a GitHub repository and push the contents of this folder (or upload files via the GitHub web UI).
2. In Render dashboard click **New + → Import from GitHub**, select your repo.
3. Render will read `render.yaml` and create three resources:
   - inter9ja-ride-frontend (Web Service)
   - inter9ja-ride-backend (Web Service)
   - inter9ja-ride-db (Postgres Database)
4. After a successful build, open the backend service in Render, go to **Environment** and verify env vars (PAYSTACK_SECRET_KEY, JWT_SECRET). Replace placeholders.
5. Open the backend Shell in Render and run `npm run seed` to create admin and sample data.
6. Frontend will be accessible at `https://<your-frontend-service>.onrender.com` and backend at `https://<your-backend-service>.onrender.com/api`
