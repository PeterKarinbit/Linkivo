# JobHunter Deployment Guide

This project is set up as a monorepo with a `frontend` (Vite + React) and a `backend` (Node.js + Express).

## 🚀 1. Deploying the Backend (Render)

Render is recommended for the backend as it supports Node.js web services easily.

1.  **Create a New Web Service** on [Render Dashboard](https://dashboard.render.com/).
2.  **Connect your GitHub repository**.
3.  **Configure the Service**:
    *   **Name**: `jobhunter-backend` (or similar)
    *   **Root Directory**: `backend` (Important! This tells Render to run commands inside the backend folder)
    *   **Environment**: `Node`
    *   **Build Command**: `npm install`
    *   **Start Command**: `npm start`
4.  **Environment Variables**:
    Add the following variables in the "Environment" tab:
    *   `MONGODB_URI`: Your MongoDB connection string (Atlas recommended).
    *   `ACCESS_TOKEN_SECRET`: A secure random string for JWT access tokens.
    *   `REFRESH_TOKEN_SECRET`: A secure random string for JWT refresh tokens.
    *   `CLERK_SECRET_KEY`: Your Clerk Secret Key (starts with `sk_`).
    *   `CLERK_PUBLISHABLE_KEY`: Your Clerk Publishable Key (starts with `pk_`).
    *   `OPENAI_API_KEY` (or `OPENROUTER_API_KEY`): For AI features.
    *   `NODE_ENV`: `production`
    *   `PORT`: `10000` (Optional, Render sets this automatically).

5.  **Deploy**: Click "Create Web Service". Wait for the deployment to succeed.
6.  **Copy the Backend URL**: It will look like `https://jobhunter-backend.onrender.com`.

---

## 🌐 2. Deploying the Frontend (Netlify)

Netlify is excellent for static/SPA frontend hosting.

1.  **Add New Site** > **Import from Git** on [Netlify Dashboard](https://app.netlify.com/).
2.  **Connect your GitHub repository**.
3.  **Configure Build Settings**:
    *   **Base directory**: `frontend`
    *   **Build command**: `npm run build`
    *   **Publish directory**: `dist`
    *   *(Note: The `netlify.toml` file added to the project root should handle these settings automatically if Netlify picks it up properly. If not, enter them manually.)*
4.  **Environment Variables**:
    *   Click on **Site configuration** > **Environment variables**.
    *   Add `VITE_API_BASE_URL`: Paste your **Backend URL** from Render (e.g., `https://jobhunter-backend.onrender.com`).
        *   *Important*: Do not add a trailing slash `/` at the end.
    *   Add `VITE_CLERK_PUBLISHABLE_KEY`: Your Clerk Publishable Key (starts with `pk_`).
5.  **Deploy**: Click "Deploy site".

## 🔄 3. Final Checks

1.  Once both are deployed, open your **Netlify URL**.
2.  Try **Logging in**. This verifies Clerk integration.
3.  Try generating a **Roadmap**. This verifies the connection to the Backend and the AI service.

## 🛠 Troubleshooting

*   **CORS Errors**: If you see CORS errors in the browser console, check the `backend/src/app.js` (or `index.js`) to ensure `cors` is configured to allow your Netlify domain.
    *   *Quick Fix*: Enable CORS for all origins in `backend/src/app.js` temporarily: `app.use(cors({ origin: '*', credentials: true }));`
*   **404 on Refresh**: The `netlify.toml` file includes a redirect rule (`/* -> /index.html`) to fix this. If it persists, ensure the `netlify.toml` is in the root directory.
